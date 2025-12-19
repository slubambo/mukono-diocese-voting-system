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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/feedback/ToastProvider'
import { peopleApi } from '../api/people.api'
import type { PersonResponse, CreatePersonRequest, UpdatePersonRequest } from '../types/leadership'
import StatusChip from '../components/common/StatusChip'
import LoadingState from '../components/common/LoadingState'
import EmptyState from '../components/common/EmptyState'
import PageLayout from '../components/layout/PageLayout'
import AppShell from '../components/layout/AppShell'
import MasterDataHeader from '../components/common/MasterDataHeader'

type FormValues = CreatePersonRequest & { status?: string }

const PeopleRegistryPage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false

  const [people, setPeople] = useState<PersonResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<string>('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PersonResponse | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<PersonResponse | null>(null)

  const { control, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { fullName: '', email: '', phoneNumber: '', gender: '', dateOfBirth: '' } })

  const fetchPeople = async () => {
    try {
      setLoading(true)
      const resp = await peopleApi.list({ q: query || undefined, page, size: rowsPerPage, sort: 'id,desc' })
      setPeople(resp.content)
      setTotal(resp.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to load people', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPeople() }, [page, rowsPerPage, query])

  const openCreate = () => { setEditing(null); reset({ fullName: '', email: '', phoneNumber: '', gender: '', dateOfBirth: '' }); setDialogOpen(true) }
  const openEdit = (p: PersonResponse) => { setEditing(p); reset({ fullName: p.fullName, email: p.email || '', phoneNumber: p.phoneNumber || '', gender: p.gender || '', dateOfBirth: p.dateOfBirth || '' }); setDialogOpen(true) }

  const onSubmit = async (data: FormValues) => {
    try {
      if (editing) {
        const payload: UpdatePersonRequest = { fullName: data.fullName, email: data.email, phoneNumber: data.phoneNumber, gender: data.gender, dateOfBirth: data.dateOfBirth }
        await peopleApi.update(editing.id, payload)
        showToast('Person updated', 'success')
      } else {
        const payload: CreatePersonRequest = { fullName: data.fullName, email: data.email, phoneNumber: data.phoneNumber, gender: data.gender, dateOfBirth: data.dateOfBirth }
        await peopleApi.create(payload)
        showToast('Person created', 'success')
      }
      setDialogOpen(false)
      fetchPeople()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save person', 'error')
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await peopleApi.delete(toDelete.id)
      showToast('Person deleted', 'success')
      setDeleteOpen(false)
      fetchPeople()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete', 'error')
    }
  }

  return (
    <AppShell>
      <PageLayout title="People Registry">
        <MasterDataHeader
          title="People Registry"
          subtitle="Manage person records used for leadership and elections."
          onAddClick={isAdmin ? openCreate : undefined}
          addButtonLabel="Create Person"
          isAdmin={isAdmin}
          filters={[
            {
              id: 'search',
              label: 'Search',
              value: query,
              placeholder: 'Search by name or email',
              onChange: (v: any) => { setQuery(v as string); setPage(0) },
            }
          ]}
        />

        <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
          {loading ? (
            <LoadingState count={5} variant="row" />
          ) : people.length === 0 ? (
            <EmptyState title="No people" description={isAdmin ? 'Create your first person.' : 'No people found.'} action={isAdmin ? <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Create Person</Button> : undefined} />
          ) : (
            <>
              <TableContainer>
                <Table sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.08)', fontWeight: 700 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Full Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Date of Birth</TableCell>
                      <TableCell>Status</TableCell>
                      {isAdmin && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {people.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell><Typography variant="body2">{p.fullName}</Typography></TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>{p.phoneNumber}</TableCell>
                        <TableCell>{p.gender}</TableCell>
                        <TableCell>{p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : ''}</TableCell>
                        <TableCell><StatusChip status={(p.status as any) ?? 'INACTIVE'} /></TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => openEdit(p)} color="primary"><EditIcon fontSize="small"/></IconButton>
                            <IconButton size="small" onClick={() => { setToDelete(p); setDeleteOpen(true) }} color="error"><DeleteIcon fontSize="small"/></IconButton>
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
          <DialogTitle>{editing ? 'Edit Person' : 'Create Person'}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller name="fullName" control={control} rules={{ required: 'Full name is required' }} render={({ field, fieldState }) => (
                <TextField {...field} label="Full Name" required error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
              )} />

              <Controller name="email" control={control} render={({ field }) => (
                <TextField {...field} label="Email" type="email" fullWidth />
              )} />

              <Controller name="phoneNumber" control={control} render={({ field }) => (
                <TextField {...field} label="Phone Number" fullWidth />
              )} />

              <Controller name="gender" control={control} render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select {...field} label="Gender">
                    <MenuItem value="">Unknown</MenuItem>
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                  </Select>
                </FormControl>
              )} />

              <Controller name="dateOfBirth" control={control} render={({ field }) => (
                <TextField {...field} label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} fullWidth />
              )} />

            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained">{editing ? 'Save' : 'Create'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>Delete Person</DialogTitle>
          <DialogContent><Typography>Are you sure you want to delete this person?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

      </PageLayout>
    </AppShell>
  )
}

export default PeopleRegistryPage
