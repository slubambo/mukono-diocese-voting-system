import React, { useEffect, useMemo, useState } from 'react'
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
  TableSortLabel,
  Link,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
// @ts-ignore - dayjs module resolution
import dayjs from 'dayjs'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/feedback/ToastProvider'
import { peopleApi } from '../api/people.api'
import { leadershipApi } from '../api/leadership.api'

import type { PersonResponse, CreatePersonRequest, UpdatePersonRequest } from '../types/leadership'
import type { LeadershipAssignmentResponse } from '../types/leadership'
import StatusChip from '../components/common/StatusChip'
import AssignmentForm from '../components/leadership/AssignmentForm'
import PersonAssignmentForm from '../components/leadership/PersonAssignmentForm'
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
  const [debouncedQuery, setDebouncedQuery] = useState<string>('')
  const [sort, setSort] = useState('fullName,asc')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PersonResponse | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<PersonResponse | null>(null)
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false)
  // Assignments UI
  const [assignmentsOpen, setAssignmentsOpen] = useState(false)
  const [assignments, setAssignments] = useState<LeadershipAssignmentResponse[]>([])
  const [currentPerson, setCurrentPerson] = useState<PersonResponse | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<LeadershipAssignmentResponse | null>(null)
  

  const { control, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { fullName: '', email: '', phoneNumber: '', gender: '', dateOfBirth: '' } })

  const fetchPeople = async () => {
    try {
      setLoading(true)
      const resp = await peopleApi.list({ q: debouncedQuery || undefined, page, size: rowsPerPage, sort: 'id,desc' })
      setPeople(resp.content)
      setTotal(resp.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to load people', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadPersonAssignments = async (personId: number) => {
    try {
      const resp = await leadershipApi.list({ personId, page: 0, size: 100 })
      setAssignments(resp.content)
    } catch (e) {
      showToast('Failed to load assignments for person', 'error')
    }
  }

  const openAssignments = (p: PersonResponse) => {
    setCurrentPerson(p)
    setAssignmentsOpen(true)
    loadPersonAssignments(p.id)
  }

  const openAssignDialog = (assignment?: LeadershipAssignmentResponse) => {
    if (!currentPerson) return
    setEditingAssignment(assignment ?? null)
    setAssignDialogOpen(true)
  }

  const deleteAssignment = async (id: number) => {
    try {
      await leadershipApi.delete(id)
      showToast('Assignment deleted', 'success')
      if (currentPerson) loadPersonAssignments(currentPerson.id)
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to delete assignment', 'error')
    }
  }

  const toggleAssignmentStatus = async (a: LeadershipAssignmentResponse) => {
    try {
      const newStatus = (a.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE'
      await leadershipApi.update(a.id, { status: newStatus })
      showToast('Assignment status updated', 'success')
      if (currentPerson) loadPersonAssignments(currentPerson.id)
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to update status', 'error')
    }
  }

  

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => { fetchPeople() }, [page, rowsPerPage, debouncedQuery])

  const sortOptions = [
    { id: 'fullName,asc', name: 'Name (A-Z)' },
    { id: 'fullName,desc', name: 'Name (Z-A)' },
    { id: 'dateOfBirth,desc', name: 'Youngest first' },
    { id: 'dateOfBirth,asc', name: 'Oldest first' },
  ]

  const displayPeople = useMemo(() => {
    const byStatus = (status?: string | null) => (status === 'ACTIVE' ? 0 : 1)
    const toTimestamp = (value?: string | null) => {
      if (!value) return null
      const time = new Date(value).getTime()
      return Number.isNaN(time) ? null : time
    }
    return [...people].sort((a, b) => {
      const statusCompare = byStatus(a.status) - byStatus(b.status)
      if (statusCompare !== 0) return statusCompare

      switch (sort) {
        case 'fullName,asc':
          return (a.fullName || '').localeCompare(b.fullName || '')
        case 'fullName,desc':
          return (b.fullName || '').localeCompare(a.fullName || '')
        case 'dateOfBirth,asc': {
          const aTime = toTimestamp(a.dateOfBirth)
          const bTime = toTimestamp(b.dateOfBirth)
          if (aTime === null && bTime === null) return 0
          if (aTime === null) return 1
          if (bTime === null) return -1
          return aTime - bTime
        }
        case 'dateOfBirth,desc': {
          const aTime = toTimestamp(a.dateOfBirth)
          const bTime = toTimestamp(b.dateOfBirth)
          if (aTime === null && bTime === null) return 0
          if (aTime === null) return 1
          if (bTime === null) return -1
          return bTime - aTime
        }
        default:
          return 0
      }
    })
  }, [people, sort])

  const getSortDirection = (column: 'fullName' | 'dateOfBirth') => {
    if (sort.startsWith(`${column},`)) return sort.endsWith('asc') ? 'asc' : 'desc'
    return false
  }

  const toggleSort = (column: 'fullName' | 'dateOfBirth') => {
    const direction = getSortDirection(column)
    if (!direction) {
      setSort(`${column},asc`)
    } else if (direction === 'asc') {
      setSort(`${column},desc`)
    } else {
      setSort(`${column},asc`)
    }
    setPage(0)
  }

  const formatAge = (dob?: string | null) => {
    if (!dob) return '—'
    const d = dayjs(dob)
    if (!d.isValid()) return '—'
    return `${dayjs().diff(d, 'year')}`
  }

  const openCreate = () => { setEditing(null); reset({ fullName: '', email: '', phoneNumber: '', gender: '', dateOfBirth: '' }); setDialogOpen(true) }
  const openCreateWithAssignment = () => { setCreateAssignmentOpen(true) }
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
          addButtonLabel="Create Person (Only)"
          isAdmin={isAdmin}
          actions={isAdmin ? [{ id: 'create-person-assignment', label: 'Create + Assign', onClick: openCreateWithAssignment }] : undefined}
          filters={[
            {
              id: 'search',
              label: 'Search',
              value: query,
              placeholder: 'Search by name or email',
              onChange: (v: any) => { setQuery(v as string); setPage(0) },
            },
            {
              id: 'sort',
              label: 'Sort by',
              value: sort,
              options: sortOptions,
              onChange: (value) => {
                setSort(value as string)
                setPage(0)
              },
              placeholder: 'Sort by',
            },
          ]}
        />

        <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
          {loading ? (
            <LoadingState count={5} variant="row" />
          ) : displayPeople.length === 0 ? (
            <EmptyState
              title="No people"
              description={isAdmin ? 'Create your first person.' : 'No people found.'}
              action={isAdmin ? (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Create Person (Only)</Button>
                  <Button variant="outlined" onClick={openCreateWithAssignment}>Create + Assign</Button>
                </Box>
              ) : undefined}
            />
          ) : (
            <>
              <TableContainer>
                <Table size="small" sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.08)', fontWeight: 700 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sortDirection={getSortDirection('fullName') || false}>
                        <TableSortLabel active={Boolean(getSortDirection('fullName'))} direction={(getSortDirection('fullName') as any) || 'asc'} onClick={() => toggleSort('fullName')}>
                          Full Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell sortDirection={getSortDirection('dateOfBirth') || false}>
                        <TableSortLabel active={Boolean(getSortDirection('dateOfBirth'))} direction={(getSortDirection('dateOfBirth') as any) || 'asc'} onClick={() => toggleSort('dateOfBirth')}>
                          Date of Birth
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Status</TableCell>
                      {isAdmin && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayPeople.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell><Typography variant="body2">{p.fullName}</Typography></TableCell>
                        <TableCell>{p.email ? <Link href={`mailto:${p.email}`} underline="hover" color="inherit">{p.email}</Link> : ''}</TableCell>
                        <TableCell>{p.phoneNumber ? <Link href={`tel:${p.phoneNumber}`} underline="hover" color="inherit">{p.phoneNumber}</Link> : ''}</TableCell>
                        <TableCell>{p.gender ? p.gender.charAt(0) + p.gender.slice(1).toLowerCase() : ''}</TableCell>
                        <TableCell>{p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : ''}</TableCell>
                        <TableCell>{formatAge(p.dateOfBirth)}</TableCell>
                        <TableCell><StatusChip status={(p.status as any) ?? 'INACTIVE'} /></TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <Button size="small" onClick={() => openAssignments(p)} sx={{ mr: 1 }}>Positions</Button>
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

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{editing ? 'Edit Person' : 'Create Person'}</DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Controller name="fullName" control={control} rules={{ required: 'Full name is required' }} render={({ field, fieldState }) => (
                  <TextField {...field} label="Full Name" required error={!!fieldState.error} helperText={fieldState.error?.message} size="small" sx={{ gridColumn: '1 / -1' }} />
                )} />

                <Controller name="email" control={control} render={({ field }) => (
                  <TextField {...field} label="Email" type="email" size="small" />
                )} />

                <Controller name="phoneNumber" control={control} render={({ field }) => (
                  <TextField {...field} label="Phone Number" size="small" />
                )} />

                <Controller name="gender" control={control} render={({ field }) => (
                  <FormControl size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select {...field} label="Gender">
                      <MenuItem value="">Unknown</MenuItem>
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                    </Select>
                  </FormControl>
                )} />

                <Controller name="dateOfBirth" control={control} rules={{ 
                  validate: (value) => {
                    if (!value) return true // Optional field
                    const date = dayjs(value)
                    if (!date.isValid()) return 'Invalid date'
                    const age = dayjs().diff(date, 'year')
                    if (age < 0) return 'Birth date cannot be in the future'
                    return true
                  }
                }} render={({ field, fieldState }) => (
                  <DatePicker
                    label="Date of Birth"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                    slotProps={{
                      textField: {
                        size: 'small',
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                      },
                      openPickerButton: { color: 'primary' },
                    }}
                    openTo="year"
                    views={['year', 'month', 'day']}
                    defaultValue={dayjs().subtract(18, 'year')}
                  />
                )} />

              </Box>
            </LocalizationProvider>
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

        {/* Person Assignments Dialog */}
        <Dialog open={assignmentsOpen} onClose={() => setAssignmentsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{currentPerson ? `${currentPerson.fullName} — Positions` : 'Positions'}</DialogTitle>
          <DialogContent>
            {assignments.length === 0 ? (
              <Typography>No assignments found for this person.</Typography>
            ) : (
              <TableContainer>
                <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Position</TableCell>
                          <TableCell>Fellowship</TableCell>
                          <TableCell>Scope</TableCell>
                          <TableCell>Term Start</TableCell>
                          <TableCell>Term End</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{((a.fellowshipPosition as any)?.titleName) ?? (a.fellowshipPosition as any)?.title?.name ?? '—'}</TableCell>
                        <TableCell>{((a.fellowshipPosition as any)?.fellowshipName) ?? a.fellowship?.name ?? '—'}</TableCell>
                        <TableCell>{(((a.fellowshipPosition as any)?.scope) ?? '').charAt(0) + (((a.fellowshipPosition as any)?.scope) ?? '').slice(1).toLowerCase()}</TableCell>
                        <TableCell>{new Date(a.termStartDate).toLocaleDateString()}</TableCell>
                        <TableCell>{a.termEndDate ? new Date(a.termEndDate).toLocaleDateString() : '—'}</TableCell>
                        <TableCell align="right">
                          {isAdmin && (
                            <>
                              <Button size="small" onClick={() => openAssignDialog(a)} sx={{ mr: 1 }}>Edit</Button>
                              <Button size="small" color={a.status === 'ACTIVE' ? 'warning' : 'success'} onClick={() => toggleAssignmentStatus(a)} sx={{ mr: 1 }}>{a.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</Button>
                              <IconButton size="small" onClick={() => deleteAssignment(a.id)} color="error"><DeleteIcon fontSize="small"/></IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            {isAdmin && <Button onClick={() => { openAssignDialog() }} variant="contained" startIcon={<AddIcon />}>Assign Position</Button>}
            <Button onClick={() => setAssignmentsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign Position{currentPerson ? ` — ${currentPerson.fullName}` : ''}</DialogTitle>
          <DialogContent>
            <AssignmentForm
              personId={currentPerson?.id}
              assignment={editingAssignment}
              onSaved={() => { setAssignDialogOpen(false); if (currentPerson) loadPersonAssignments(currentPerson.id) }}
              onCancel={() => setAssignDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={createAssignmentOpen} onClose={() => setCreateAssignmentOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Person + Assign Position</DialogTitle>
          <DialogContent>
            <PersonAssignmentForm
              onSaved={() => { setCreateAssignmentOpen(false); fetchPeople() }}
              onCancel={() => setCreateAssignmentOpen(false)}
            />
          </DialogContent>
        </Dialog>

      </PageLayout>
    </AppShell>
  )
}

export default PeopleRegistryPage
