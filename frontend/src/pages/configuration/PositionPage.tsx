/**
 * Fellowship Position Management Page
 */
import React, { useState, useEffect, useMemo } from 'react'
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Autocomplete,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/ToastProvider'
import { fellowshipPositionApi } from '../../api/fellowshipPosition.api'
import { fellowshipApi } from '../../api/fellowship.api'
import { positionTitleApi } from '../../api/positionTitle.api'
import type { FellowshipPosition, CreateFellowshipPositionRequest, PositionScope, EntityStatus } from '../../types/leadership'
import type { Fellowship } from '../../types/organization'
import type { PositionTitle } from '../../types/leadership'
import StatusChip from '../../components/common/StatusChip'
import LoadingState from '../../components/common/LoadingState'
import EmptyState from '../../components/common/EmptyState'
import PageLayout from '../../components/layout/PageLayout'
import AppShell from '../../components/layout/AppShell'
import MasterDataHeader from '../../components/common/MasterDataHeader'

type DialogMode = 'create' | 'edit' | null

export const PositionPage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  
  const [positions, setPositions] = useState<FellowshipPosition[]>([])
  const [fellowships, setFellowships] = useState<Fellowship[]>([])
  const [titles, setTitles] = useState<PositionTitle[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedFellowshipId, setSelectedFellowshipId] = useState<number | null>(null)
  const [selectedScope, setSelectedScope] = useState<PositionScope | null>(null)
  const [availableScopes, setAvailableScopes] = useState<PositionScope[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [sort, setSort] = useState('title.name,asc')
  
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selected, setSelected] = useState<FellowshipPosition | null>(null)
  const [formData, setFormData] = useState<Omit<CreateFellowshipPositionRequest, 'scope'> & { scope: PositionScope | PositionScope[]; status?: EntityStatus }>({
    fellowshipId: 0,
    titleId: 0,
    seats: 1,
    scope: ['DIOCESE'],
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<FellowshipPosition | null>(null)
  
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false

  const fetchPositions = async () => {
    if (!selectedFellowshipId) {
      setPositions([])
      setTotalElements(0)
      return
    }

    try {
      setLoading(true)
      const response = await fellowshipPositionApi.list({ 
        fellowshipId: selectedFellowshipId, 
        scope: selectedScope || undefined,
        page, 
        size: rowsPerPage, 
        sort: 'id,desc' 
      })
      setPositions(response.content)
      setTotalElements(response.totalElements)
      setAvailableScopes((prev) => {
        const next = new Set(prev)
        response.content.forEach((p) => next.add(p.scope))
        return Array.from(next)
      })
      setStats({
        total: response.totalElements,
        active: response.content.filter((p) => p.status === 'ACTIVE').length,
        inactive: response.content.filter((p) => p.status === 'INACTIVE').length,
      })
    } catch (error) {
      showToast('Failed to load positions', 'error')
      console.error('Error fetching positions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFellowships = async () => {
    try {
      const response = await fellowshipApi.list({ page: 0, size: 1000 })
      const activeFellowships = response.content.filter(f => f.status === 'ACTIVE').sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setFellowships(activeFellowships)
      // Select first fellowship by default
      if (activeFellowships.length > 0 && !selectedFellowshipId) {
        setSelectedFellowshipId(activeFellowships[0].id)
      }
    } catch (error) {
      console.error('Failed to load fellowships')
    }
  }

  const loadTitles = async () => {
    try {
      const response = await positionTitleApi.list({ page: 0, size: 1000 })
      const sorted = response.content
        .filter(t => t.status === 'ACTIVE')
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setTitles(sorted)
    } catch (error) {
      console.error('Failed to load position titles')
    }
  }

  useEffect(() => {
    fetchPositions()
  }, [page, rowsPerPage, selectedFellowshipId, selectedScope])

  useEffect(() => {
    setAvailableScopes([])
    setSelectedScope(null)
  }, [selectedFellowshipId])

  useEffect(() => {
    loadFellowships()
    loadTitles()
  }, [])

  const handleSave = async () => {
    const scopeList = Array.isArray(formData.scope) ? formData.scope : [formData.scope]
    if (!formData.fellowshipId || !formData.titleId || !formData.seats || formData.seats < 1 || scopeList.length === 0) {
      showToast('All fields are required', 'error')
      return
    }

    try {
      if (dialogMode === 'create') {
        const errors: string[] = []
        let successCount = 0
        for (const scope of scopeList) {
          try {
            await fellowshipPositionApi.create({
              fellowshipId: formData.fellowshipId,
              titleId: formData.titleId,
              seats: formData.seats,
              scope,
            })
            successCount += 1
          } catch (error: any) {
            errors.push(`${scope}: ${error?.response?.data?.message || 'Failed to create'}`)
          }
        }
        if (successCount > 0) {
          showToast(`Created ${successCount} position${successCount === 1 ? '' : 's'}`, 'success')
          setDialogMode(null)
          fetchPositions()
        }
        if (errors.length > 0) {
          showToast(`Some positions failed: ${errors.join(' · ')}`, 'error')
        }
        return
      } else if (selected) {
        await fellowshipPositionApi.update(selected.id, {
          titleId: formData.titleId,
          seats: formData.seats,
          scope: Array.isArray(formData.scope) ? formData.scope[0] : formData.scope,
          status: formData.status,
        })
        showToast('Position updated', 'success')
        setDialogMode(null)
        fetchPositions()
        return
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save', 'error')
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await fellowshipPositionApi.delete(toDelete.id)
      showToast('Position deleted', 'success')
      setDeleteDialogOpen(false)
      setToDelete(null)
      fetchPositions()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete', 'error')
    }
  }

  const renderCount = (value?: number) => (typeof value === 'number' ? value : '—')

  const scopeOptions = Array.from(new Set(availableScopes.length ? availableScopes : positions.map((p) => p.scope)))
    .map((scope) => ({
      id: scope,
      name: scope.charAt(0) + scope.slice(1).toLowerCase(),
    }))

  const sortOptions = [
    { id: 'title.name,asc', name: 'Title (A-Z)' },
    { id: 'title.name,desc', name: 'Title (Z-A)' },
    { id: 'seats,desc', name: 'Seats (High-Low)' },
    { id: 'seats,asc', name: 'Seats (Low-High)' },
    { id: 'createdAt,desc', name: 'Newest first' },
    { id: 'createdAt,asc', name: 'Oldest first' },
  ]

  const displayPositions = useMemo(() => {
    const byStatus = (status?: EntityStatus) => (status === 'ACTIVE' ? 0 : 1)
    return [...positions].sort((a, b) => {
      const statusCompare = byStatus(a.status) - byStatus(b.status)
      if (statusCompare !== 0) return statusCompare

      switch (sort) {
        case 'title.name,asc':
          return (a.title?.name || '').localeCompare(b.title?.name || '')
        case 'title.name,desc':
          return (b.title?.name || '').localeCompare(a.title?.name || '')
        case 'seats,asc':
          return (a.seats || 0) - (b.seats || 0)
        case 'seats,desc':
          return (b.seats || 0) - (a.seats || 0)
        case 'createdAt,asc':
          return (a.createdAt || '').localeCompare(b.createdAt || '')
        case 'createdAt,desc':
          return (b.createdAt || '').localeCompare(a.createdAt || '')
        default:
          return 0
      }
    })
  }, [positions, sort])

  // FellowshipPosition has nested fellowship and title objects
  const getFellowshipName = (position: FellowshipPosition) => position.fellowship.name
  const getTitleName = (position: FellowshipPosition) => position.title.name

  return (
    <AppShell>
      <PageLayout title="Positions">
        {/* Modern Header with Filters */}
        <MasterDataHeader
          title="Positions"
          subtitle="Manage fellowship positions"
          onAddClick={isAdmin && selectedFellowshipId ? () => { setFormData({ fellowshipId: selectedFellowshipId || 0, titleId: 0, seats: 1, scope: ['DIOCESE'] }); setDialogMode('create'); } : undefined}
          addButtonLabel="Add Position"
          isAdmin={isAdmin}
          stats={[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Inactive', value: stats.inactive },
          ]}
          filters={[
            {
              id: 'fellowship',
              label: 'Fellowship',
              value: selectedFellowshipId,
              options: fellowships.map(f => ({ id: f.id, name: f.name })),
              onChange: (value) => {
                setSelectedFellowshipId(value as number | null)
                setPage(0)
              },
              placeholder: 'Select Fellowship',
            }
            ,
            {
              id: 'scope',
              label: 'Scope',
              value: selectedScope ?? 'ALL',
              options: [{ id: 'ALL', name: 'All' }, ...scopeOptions],
              onChange: (value) => {
                setSelectedScope(value === 'ALL' ? null : (value as PositionScope))
                setPage(0)
              },
              placeholder: 'All scopes',
            }
            ,
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
            }
          ]}
        />

        <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
        {loading ? (
          <LoadingState count={5} variant="row" />
        ) : !selectedFellowshipId ? (
          <EmptyState title="Select a Fellowship" description="Choose a fellowship to view its positions." />
        ) : displayPositions.length === 0 ? (
          <EmptyState title="No positions" description={isAdmin ? 'Create your first position for this fellowship.' : 'No positions exist for this fellowship.'} action={isAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData({ fellowshipId: selectedFellowshipId || 0, titleId: 0, seats: 1, scope: ['DIOCESE'] }); setDialogMode('create'); }}>Add Position</Button>} />
        ) : (
          <>
            <TableContainer>
              <Table
                sx={{
                  '& thead th': {
                    backgroundColor: 'rgba(88, 28, 135, 0.08)',
                    fontWeight: 700,
                    color: '#2d1b4e',
                    borderBottom: '2px solid rgba(88, 28, 135, 0.2)',
                  },
                  '& tbody tr': {
                    '&:hover': {
                      backgroundColor: 'rgba(88, 28, 135, 0.04)',
                    },
                  },
                  '& tbody tr:last-child td': {
                    borderBottom: 'none',
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Fellowship</TableCell>
                    <TableCell>Position Title</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Seats</TableCell>
                    <TableCell align="right">Assigned</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell>Status</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayPositions.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell><Typography variant="body2">{getFellowshipName(p)}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={500}>{getTitleName(p)}</Typography></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{p.scope}</Typography></TableCell>
                      <TableCell>{p.seats}</TableCell>
                      <TableCell align="right">{renderCount(p.currentAssignmentsCount)}</TableCell>
                      <TableCell align="right">{renderCount(p.availableSeats)}</TableCell>
                      <TableCell><StatusChip status={p.status} /></TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => { setFormData({ fellowshipId: p.fellowship.id, titleId: p.title.id, seats: p.seats, scope: p.scope, status: p.status }); setSelected(p); setDialogMode('edit'); }} color="primary"><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => { setToDelete(p); setDeleteDialogOpen(true); }} color="error"><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination rowsPerPageOptions={[10, 20, 50]} component="div" count={totalElements} rowsPerPage={rowsPerPage} page={page} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
          </>
        )}
      </Paper>

      <Dialog open={dialogMode !== null} onClose={() => setDialogMode(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Create Position' : 'Edit Position'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={fellowships}
              getOptionLabel={(f) => f.name}
              value={fellowships.find(f => f.id === formData.fellowshipId) || null}
              onChange={(_, f) => setFormData({ ...formData, fellowshipId: f?.id || 0 })}
              renderInput={(params) => <TextField {...params} label="Fellowship" required />}
            />
            <Autocomplete
              options={titles}
              getOptionLabel={(t) => t.name}
              value={titles.find(t => t.id === formData.titleId) || null}
              onChange={(_, t) => setFormData({ ...formData, titleId: t?.id || 0 })}
              renderInput={(params) => <TextField {...params} label="Position Title" required />}
            />
            {dialogMode === 'create' ? (
              <FormControl fullWidth required>
                <InputLabel>Scope</InputLabel>
                <Select
                  multiple
                  value={Array.isArray(formData.scope) ? formData.scope : [formData.scope]}
                  label="Scope"
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value as PositionScope[] })}
                  renderValue={(selected) => (selected as PositionScope[]).join(', ')}
                >
                  <MenuItem value="DIOCESE">Diocese</MenuItem>
                  <MenuItem value="ARCHDEACONRY">Archdeaconry</MenuItem>
                  <MenuItem value="CHURCH">Church</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <FormControl fullWidth required>
                <InputLabel>Scope</InputLabel>
                <Select value={Array.isArray(formData.scope) ? formData.scope[0] : formData.scope} label="Scope" onChange={(e) => setFormData({ ...formData, scope: e.target.value as PositionScope })}>
                  <MenuItem value="DIOCESE">Diocese</MenuItem>
                  <MenuItem value="ARCHDEACONRY">Archdeaconry</MenuItem>
                  <MenuItem value="CHURCH">Church</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField label="Seats" type="number" value={formData.seats} onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })} inputProps={{ min: 1 }} required fullWidth />
            {dialogMode === 'edit' && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status || 'ACTIVE'} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value as EntityStatus })}>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogMode(null)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{dialogMode === 'create' ? 'Create' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Position</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this position?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
    </AppShell>
  )
}
