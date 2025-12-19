import React, { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  Autocomplete,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
// VisibilityIcon removed (not used)
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/feedback/ToastProvider'
import { leadershipApi } from '../api/leadership.api'
import { fellowshipPositionApi } from '../api/fellowshipPosition.api'
import { peopleApi } from '../api/people.api'
import type { LeadershipAssignmentResponse, CreateLeadershipAssignmentRequest, LeadershipAssignmentListParams } from '../types/leadership'
import StatusChip from '../components/common/StatusChip'
import LoadingState from '../components/common/LoadingState'
import EmptyState from '../components/common/EmptyState'
import PageLayout from '../components/layout/PageLayout'
import AppShell from '../components/layout/AppShell'
import MasterDataHeader from '../components/common/MasterDataHeader'

const LeadershipAssignmentsPage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false

  const [assignments, setAssignments] = useState<LeadershipAssignmentResponse[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [filters] = useState<LeadershipAssignmentListParams>({ page: 0, size: 20, sort: 'id,desc' })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LeadershipAssignmentResponse | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<LeadershipAssignmentResponse | null>(null)

  const [eligibleOpen, setEligibleOpen] = useState(false)
  const [eligibleList, setEligibleList] = useState<any[]>([])
  const [eligibleLoading, setEligibleLoading] = useState(false)

  const { control, handleSubmit, reset } = useForm<CreateLeadershipAssignmentRequest & { scope?: string }>({ defaultValues: { personId: 0, fellowshipPositionId: 0, termStartDate: '', dioceseId: undefined, archdeaconryId: undefined, churchId: undefined, termEndDate: '', notes: '' } })

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const resp = await leadershipApi.list({ ...filters, page, size: rowsPerPage })
      setAssignments(resp.content)
      setTotal(resp.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to load assignments', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadPositions = async () => {
    try {
      const resp = await fellowshipPositionApi.list({ fellowshipId: 0 as any, page: 0, size: 1000 })
      setPositions(resp.content)
    } catch (e) {
      // ignore
    }
  }

  const loadPeople = async () => {
    try {
      const resp = await peopleApi.list({ page: 0, size: 1000 })
      setPeople(resp.content)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { fetchAssignments() }, [page, rowsPerPage, filters])
  useEffect(() => { loadPositions(); loadPeople() }, [])

  const openCreate = () => { setEditing(null); reset({ personId: 0, fellowshipPositionId: 0, termStartDate: '', termEndDate: '', notes: '' }); setDialogOpen(true) }
  const openEdit = (a: LeadershipAssignmentResponse) => { setEditing(a); reset({ personId: a.person.id, fellowshipPositionId: a.fellowshipPositionId, termStartDate: a.termStartDate, termEndDate: a.termEndDate || '', notes: a.notes || '' }); setDialogOpen(true) }

  const onSubmit = async (data: any) => {
    try {
      if (editing) {
        await leadershipApi.update(editing.id, data)
        showToast('Assignment updated', 'success')
      } else {
        await leadershipApi.create(data)
        showToast('Assignment created', 'success')
      }
      setDialogOpen(false)
      fetchAssignments()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save assignment', 'error')
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await leadershipApi.delete(toDelete.id)
      showToast('Assignment deleted', 'success')
      setDeleteOpen(false)
      fetchAssignments()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete', 'error')
    }
  }

  const openEligible = async () => {
    setEligibleOpen(true)
    setEligibleLoading(true)
    try {
      // require fellowshipId and scope; use first position if available
      const pos = positions[0]
      if (!pos) {
        setEligibleList([])
        return
      }
      const resp = await leadershipApi.eligibleVoters({ fellowshipId: pos.fellowship.id, scope: pos.scope as any, page: 0, size: 50 })
      setEligibleList(resp.content)
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to load eligible voters', 'error')
    } finally {
      setEligibleLoading(false)
    }
  }

  return (
    <AppShell>
      <PageLayout title="Leadership Assignments">
        <MasterDataHeader
          title="Leadership Assignments"
          subtitle="Assign leaders to positions with scope and term dates."
          onAddClick={isAdmin ? openCreate : undefined}
          addButtonLabel="Create Assignment"
          isAdmin={isAdmin}
          actions={[
            { id: 'eligible', label: 'View Eligible Voters', onClick: openEligible }
          ]}
          filters={[]}
        />

        <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
          {loading ? (
            <LoadingState count={5} variant="row" />
          ) : assignments.length === 0 ? (
            <EmptyState title="No assignments" description={isAdmin ? 'Create your first leadership assignment.' : 'No assignments found.'} action={isAdmin ? <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Create Assignment</Button> : undefined} />
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Person</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Scope</TableCell>
                      <TableCell>Term Start</TableCell>
                      <TableCell>Term End</TableCell>
                      <TableCell>Status</TableCell>
                      {isAdmin && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell>{a.person.fullName}</TableCell>
                        <TableCell>{a.fellowship?.name || a.fellowshipPositionId}</TableCell>
                        <TableCell>{a.dioceseId ? 'Diocese' : a.archdeaconryId ? 'Archdeaconry' : a.churchId ? 'Church' : '—'}</TableCell>
                        <TableCell>{new Date(a.termStartDate).toLocaleDateString()}</TableCell>
                        <TableCell>{a.termEndDate ? new Date(a.termEndDate).toLocaleDateString() : '—'}</TableCell>
                        <TableCell><StatusChip status={(a.status as any) ?? 'INACTIVE'} /></TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => openEdit(a)} color="primary"><EditIcon fontSize="small"/></IconButton>
                            <IconButton size="small" onClick={() => { setToDelete(a); setDeleteOpen(true) }} color="error"><DeleteIcon fontSize="small"/></IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination rowsPerPageOptions={[10,20,50]} component="div" count={total} rowsPerPage={rowsPerPage} page={page} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }} />
            </>
          )}
        </Paper>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller name="personId" control={control} render={({ field }) => (
                <Autocomplete options={people} getOptionLabel={(p) => p.fullName} onChange={(_, v) => field.onChange(v?.id || 0)} renderInput={(params) => <TextField {...params} label="Person" required />} />
              )} />

              <Controller name="fellowshipPositionId" control={control} render={({ field }) => (
                <Autocomplete options={positions} getOptionLabel={(p) => `${p.title.name} — ${p.fellowship.name}`} onChange={(_, v) => field.onChange(v?.id || 0)} renderInput={(params) => <TextField {...params} label="Position" required />} />
              )} />

              <Controller name="termStartDate" control={control} rules={{ required: 'Start date required' }} render={({ field }) => (
                <TextField {...field} label="Term Start" type="date" InputLabelProps={{ shrink: true }} required />
              )} />

              <Controller name="termEndDate" control={control} render={({ field }) => (
                <TextField {...field} label="Term End" type="date" InputLabelProps={{ shrink: true }} />
              )} />

              <Controller name="notes" control={control} render={({ field }) => (
                <TextField {...field} label="Notes" multiline rows={3} />
              )} />

            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained">{editing ? 'Save' : 'Create'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>Delete Assignment</DialogTitle>
          <DialogContent><Typography>Are you sure you want to delete this assignment?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={eligibleOpen} onClose={() => setEligibleOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Eligible Voters</DialogTitle>
          <DialogContent>
            {eligibleLoading ? <LoadingState count={5} variant="row" /> : (
              <Box>
                {eligibleList.map((p: any) => (
                  <Box key={p.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                    <Typography>{p.fullName} — {p.email}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEligibleOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

      </PageLayout>
    </AppShell>
  )
}

export default LeadershipAssignmentsPage
