import React, { useEffect, useState } from 'react'
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
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
// VisibilityIcon removed (not used)
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/feedback/ToastProvider'
import { leadershipApi } from '../api/leadership.api'

import { fellowshipApi } from '../api/fellowship.api'
import { dioceseApi } from '../api/diocese.api'
import { archdeaconryApi } from '../api/archdeaconry.api'
import { churchApi } from '../api/church.api'
import type { LeadershipAssignmentResponse, LeadershipAssignmentListParams } from '../types/leadership'
import StatusChip from '../components/common/StatusChip'
import LoadingState from '../components/common/LoadingState'
import EmptyState from '../components/common/EmptyState'
import PageLayout from '../components/layout/PageLayout'
import AppShell from '../components/layout/AppShell'
import MasterDataHeader from '../components/common/MasterDataHeader'
import AssignmentForm from '../components/leadership/AssignmentForm'

const LeadershipAssignmentsPage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false

  const [assignments, setAssignments] = useState<LeadershipAssignmentResponse[]>([])
  const [fellowships, setFellowships] = useState<any[]>([])
  const [levels, setLevels] = useState<string[]>([])
  const [selectedFellowshipId, setSelectedFellowshipId] = useState<number | null>(null)
  const [dioceses, setDioceses] = useState<any[]>([])
  const [archdeaconries, setArchdeaconries] = useState<any[]>([])
  const [churches, setChurches] = useState<any[]>([])
  const [selectedDioceseId, setSelectedDioceseId] = useState<number | null>(null)
  const [selectedArchdeaconryId, setSelectedArchdeaconryId] = useState<number | null>(null)
  const [selectedChurchId, setSelectedChurchId] = useState<number | null>(null)
  const [dioceseFixed, setDioceseFixed] = useState(false)
  // Filters (page-level)
  const [filterDioceseId, setFilterDioceseId] = useState<number | null>(null)
  const [filterLevel, setFilterLevel] = useState<string | null>(null)
  const [filterArchdeaconryId, setFilterArchdeaconryId] = useState<number | null>(null)
  const [filterChurchId, setFilterChurchId] = useState<number | null>(null)
  const [filterFellowshipId, setFilterFellowshipId] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [filters] = useState<LeadershipAssignmentListParams>({ page: 0, size: 20, sort: 'id,desc' })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LeadershipAssignmentResponse | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<LeadershipAssignmentResponse | null>(null)

  

  const [selectedLevelForm, setSelectedLevelForm] = useState<string | null>(null)
  

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const resp = await leadershipApi.list({
        ...filters,
        page,
        size: rowsPerPage,
        dioceseId: filterDioceseId ?? undefined,
        archdeaconryId: filterArchdeaconryId ?? undefined,
        churchId: filterChurchId ?? undefined,
        fellowshipId: filterFellowshipId ?? undefined,
        scope: (filterLevel as any) ?? undefined,
      })
      setAssignments(resp.content)
      setTotal(resp.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to load assignments', 'error')
    } finally {
      setLoading(false)
    }
  }

  

  const loadFellowships = async () => {
    try {
      const resp = await fellowshipApi.list({ page: 0, size: 1000 })
      setFellowships(resp.content)
      if (resp.content.length > 0 && !selectedFellowshipId) setSelectedFellowshipId(resp.content[0].id)
    } catch (e) {
      // ignore
    }
  }

  const loadLevels = async () => {
    try {
      const lv = await leadershipApi.getLevels()
      setLevels(lv)
    } catch (e) {
      setLevels(['DIOCESE', 'ARCHDEACONRY', 'CHURCH'])
    }
  }

  const loadDioceses = async () => {
    try {
      const resp = await dioceseApi.list({ page: 0, size: 100 })
      setDioceses(resp.content)
      if (resp.content.length === 1) {
        const id = resp.content[0].id
        setSelectedDioceseId(id)
        setFilterDioceseId(id)
        setDioceseFixed(true)
      } else if (resp.content.length > 0 && !selectedDioceseId) {
        setSelectedDioceseId(resp.content[0].id)
      }
    } catch (e) {
      // ignore
    }
  }

  const loadArchdeaconries = async (dioceseId: number) => {
    try {
      const resp = await archdeaconryApi.list({ dioceseId, page: 0, size: 1000 })
      setArchdeaconries(resp.content)
      if (resp.content.length > 0 && !selectedArchdeaconryId) setSelectedArchdeaconryId(resp.content[0].id)
    } catch (e) {
      // ignore
    }
  }

  const loadChurches = async (archdeaconryId: number) => {
    try {
      const resp = await churchApi.list({ archdeaconryId, page: 0, size: 1000 })
      setChurches(resp.content)
      if (resp.content.length > 0 && !selectedChurchId) setSelectedChurchId(resp.content[0].id)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { fetchAssignments() }, [page, rowsPerPage, filters, selectedFellowshipId, selectedDioceseId, selectedArchdeaconryId, selectedChurchId])
  useEffect(() => { loadFellowships(); loadDioceses(); loadLevels() }, [])
  useEffect(() => { if (selectedDioceseId) { loadArchdeaconries(selectedDioceseId) } else { setArchdeaconries([]); setSelectedArchdeaconryId(null); setSelectedChurchId(null) } }, [selectedDioceseId])
  useEffect(() => { if (selectedArchdeaconryId) { loadChurches(selectedArchdeaconryId) } else { setChurches([]); setSelectedChurchId(null) } }, [selectedArchdeaconryId])

  // Support filters loading dependent options
  useEffect(() => {
    if (filterDioceseId) {
      loadArchdeaconries(filterDioceseId)
    } else {
      // if no filter diocese, clear filter-level archdeaconry/church options
      setArchdeaconries([])
      setFilterArchdeaconryId(null)
      setFilterChurchId(null)
    }
  }, [filterDioceseId])

  useEffect(() => {
    if (filterArchdeaconryId) {
      loadChurches(filterArchdeaconryId)
    } else {
      setChurches([])
      setFilterChurchId(null)
    }
  }, [filterArchdeaconryId])

  // Re-fetch when filters change
  useEffect(() => { setPage(0); fetchAssignments() }, [filterDioceseId, filterLevel, filterArchdeaconryId, filterChurchId, filterFellowshipId])

  const openCreate = () => {
    setEditing(null)
    setSelectedLevelForm(filterLevel ?? null)
    if (!dioceseFixed) setSelectedDioceseId(filterDioceseId ?? null)
    setSelectedArchdeaconryId(null)
    setSelectedChurchId(null)
    setDialogOpen(true)
  }
  const openEdit = (a: LeadershipAssignmentResponse) => {
    setEditing(a)
    // prefill dialog state from assignment
    if (a.diocese) setSelectedDioceseId(a.diocese.id)
    if (a.archdeaconry) setSelectedArchdeaconryId(a.archdeaconry.id)
    if (a.church) setSelectedChurchId(a.church.id)
    const fp = a.fellowshipPosition as any
    setSelectedLevelForm(fp?.scope ?? null)
    if (fp?.fellowshipId) setSelectedFellowshipId(fp.fellowshipId)
    else if (fp?.fellowship?.id) setSelectedFellowshipId(fp.fellowship.id)
    setDialogOpen(true)
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

  // Eligible voters deferred to Elections management

  return (
    <AppShell>
      <PageLayout title="Leadership Assignments">
        <MasterDataHeader
          title="Leadership Assignments"
          subtitle="Assign leaders to positions with scope and term dates."
          onAddClick={isAdmin ? openCreate : undefined}
          addButtonLabel="Create Assignment"
          isAdmin={isAdmin}
          actions={[{ id: 'clear', label: 'Clear Filters', onClick: () => { setFilterDioceseId(dioceseFixed ? filterDioceseId : null); setFilterLevel(null); setFilterArchdeaconryId(null); setFilterChurchId(null); setFilterFellowshipId(null); setPage(0); fetchAssignments() } } ]}
          filters={[
            {
              id: 'diocese',
              label: 'Diocese',
              value: filterDioceseId,
              options: dioceses.map((d) => ({ id: d.id, name: d.name })),
              onChange: (v: any) => { setFilterDioceseId(v as number | null); if (v) { setFilterArchdeaconryId(null); setFilterChurchId(null) } },
              placeholder: 'Diocese',
              disabled: dioceseFixed,
            },
            {
              id: 'level',
              label: 'Level',
              value: filterLevel,
              options: levels.map((l) => ({ id: l, name: `${l.charAt(0)}${l.slice(1).toLowerCase()}` })),
              onChange: (v: any) => { setFilterLevel(v as string | null) },
              placeholder: 'Level',
            },
            {
              id: 'archdeaconry',
              label: 'Archdeaconry',
              value: filterArchdeaconryId,
              options: archdeaconries.map((a) => ({ id: a.id, name: a.name })),
              onChange: (v: any) => { setFilterArchdeaconryId(v as number | null); if (v) setFilterChurchId(null) },
              placeholder: 'Archdeaconry',
              disabled: !archdeaconries.length,
            },
            {
              id: 'church',
              label: 'Church',
              value: filterChurchId,
              options: churches.map((c) => ({ id: c.id, name: c.name })),
              onChange: (v: any) => setFilterChurchId(v as number | null),
              placeholder: 'Church',
              disabled: !churches.length,
            },
            {
              id: 'fellowship',
              label: 'Fellowship',
              value: filterFellowshipId,
              options: fellowships.map((f) => ({ id: f.id, name: f.name })),
              onChange: (v: any) => setFilterFellowshipId(v as number | null),
              placeholder: 'Fellowship',
            },
          ]}
        />

        <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
          {loading ? (
            <LoadingState count={5} variant="row" />
          ) : assignments.length === 0 ? (
            <EmptyState title="No assignments" description={isAdmin ? 'Create your first leadership assignment.' : 'No assignments found.'} action={isAdmin ? <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Create Assignment</Button> : undefined} />
          ) : (
            <>
              <TableContainer>
                <Table sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.08)', fontWeight: 700 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Full Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Fellowship</TableCell>
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
                        <TableCell><Typography variant="body2">{a.person.fullName}</Typography></TableCell>
                        <TableCell>{a.person.email}</TableCell>
                        <TableCell>{a.person.phoneNumber}</TableCell>
                        <TableCell>{((a.fellowshipPosition as any)?.titleName) ?? (a.fellowshipPosition as any)?.title?.name ?? '—'}</TableCell>
                        <TableCell>{((a.fellowshipPosition as any)?.fellowshipName) ?? a.fellowship?.name ?? '—'}</TableCell>
                        <TableCell>{(((a.fellowshipPosition as any)?.scope) ?? '').charAt(0) + (((a.fellowshipPosition as any)?.scope) ?? '').slice(1).toLowerCase()}</TableCell>
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
            <AssignmentForm
              assignment={editing}
              initialLevel={selectedLevelForm}
              onLevelChange={(lvl) => setSelectedLevelForm(lvl)}
              onSaved={() => { setDialogOpen(false); fetchAssignments() }}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>Delete Assignment</DialogTitle>
          <DialogContent><Typography>Are you sure you want to delete this assignment?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Eligible voters dialog removed (handled in Elections module) */}

      </PageLayout>
    </AppShell>
  )
}

export default LeadershipAssignmentsPage
