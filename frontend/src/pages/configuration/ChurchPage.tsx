/**
 * Church Management Page
 * Similar to Archdeaconry but belongs to an Archdeaconry
 */
import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
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
  Autocomplete,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/ToastProvider'
import { churchApi } from '../../api/church.api'
import { archdeaconryApi } from '../../api/archdeaconry.api'
import { dioceseApi } from '../../api/diocese.api'
import type { Church, CreateChurchRequest, EntityStatus, Archdeaconry, Diocese } from '../../types/organization'
import LoadingState from '../../components/common/LoadingState'
import EmptyState from '../../components/common/EmptyState'
import PageLayout from '../../components/layout/PageLayout'
import AppShell from '../../components/layout/AppShell'
import MasterDataHeader from '../../components/common/MasterDataHeader'

type DialogMode = 'create' | 'edit' | null

export const ChurchPage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  
  const [churches, setChurches] = useState<Church[]>([])
  const [dioceses, setDioceses] = useState<Diocese[]>([])
  const [archdeaconries, setArchdeaconries] = useState<Archdeaconry[]>([])
  const [selectedDioceseId, setSelectedDioceseId] = useState<number | null>(null)
  const [selectedArchdeaconryId, setSelectedArchdeaconryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [totalElements, setTotalElements] = useState(0)
  const [, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [sort, setSort] = useState('name,asc')
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE')
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['code', 'diocese', 'archdeaconry', 'leaders', 'created'])
  
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null)
  const [formData, setFormData] = useState<CreateChurchRequest & { status?: EntityStatus }>({
    archdeaconryId: 0,
    name: '',
    code: '',
  })
  const [errors, setErrors] = useState<{ archdeaconryId?: string; name?: string; code?: string }>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [churchToDelete, setChurchToDelete] = useState<Church | null>(null)
  
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false
  const isReadOnly = !isAdmin
  const isColumnVisible = (key: string) => visibleColumns.includes(key)

  const fetchDioceses = async () => {
    try {
      const response = await dioceseApi.list({ page: 0, size: 100 })
      setDioceses(response.content)
      if (response.content.length > 0 && !selectedDioceseId) {
        setSelectedDioceseId(response.content[0].id)
      }
    } catch (error) {
      showToast('Failed to load dioceses', 'error')
    }
  }

  const fetchArchdeaconries = async (dioceseId: number) => {
    try {
      const response = await archdeaconryApi.list({ dioceseId, page: 0, size: 100 })
      setArchdeaconries(response.content)
      if (response.content.length > 0 && !selectedArchdeaconryId) {
        setSelectedArchdeaconryId(response.content[0].id)
      }
    } catch (error) {
      showToast('Failed to load archdeaconries', 'error')
    }
  }

  const fetchChurches = async () => {
    if (!selectedArchdeaconryId) return
    
    try {
      setLoading(true)
      const response = await churchApi.list({
        archdeaconryId: selectedArchdeaconryId,
        page,
        size: rowsPerPage,
        sort: 'id,desc',
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      })
      setChurches(response.content)
      setTotalElements(response.totalElements)
      setStats({
        total: response.totalElements,
        active: response.content.filter((c) => c.status === 'ACTIVE').length,
        inactive: response.content.filter((c) => c.status === 'INACTIVE').length,
      })
    } catch (error) {
      showToast('Failed to load churches', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDioceses()
  }, [])

  useEffect(() => {
    if (selectedDioceseId) {
      setSelectedArchdeaconryId(null)
      setArchdeaconries([])
      fetchArchdeaconries(selectedDioceseId)
    }
  }, [selectedDioceseId])

  useEffect(() => {
    fetchChurches()
  }, [page, rowsPerPage, selectedArchdeaconryId, statusFilter])

  const handleOpenCreateDialog = () => {
    setFormData({ archdeaconryId: selectedArchdeaconryId || 0, name: '', code: '' })
    setErrors({})
    setSelectedChurch(null)
    setDialogMode('create')
  }

  const handleOpenEditDialog = (church: Church) => {
    setFormData({
      archdeaconryId: church.archdeaconry.id,
      name: church.name,
      code: church.code || '',
      status: church.status,
    })
    setErrors({})
    setSelectedChurch(church)
    setDialogMode('edit')
  }

  const handleCloseDialog = () => {
    setDialogMode(null)
    setSelectedChurch(null)
    setErrors({})
  }

  const validateForm = () => {
    const nextErrors: { archdeaconryId?: string; name?: string; code?: string } = {}

    if (!formData.archdeaconryId) {
      nextErrors.archdeaconryId = 'Archdeaconry is required'
    }
    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      if (dialogMode === 'create') {
        await churchApi.create({
          archdeaconryId: formData.archdeaconryId,
          name: formData.name,
          code: formData.code || undefined,
        })
        showToast('Church created successfully', 'success')
      } else if (dialogMode === 'edit' && selectedChurch) {
        await churchApi.update(selectedChurch.id, {
          name: formData.name,
          code: formData.code || undefined,
          status: formData.status,
        })
        showToast('Church updated successfully', 'success')
      }
      handleCloseDialog()
      fetchChurches()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save church', 'error')
    }
  }

  const handleDelete = async () => {
    if (!churchToDelete) return
    try {
      await churchApi.delete(churchToDelete.id)
      showToast('Church deactivated successfully', 'success')
      setDeleteDialogOpen(false)
      setChurchToDelete(null)
      fetchChurches()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete church', 'error')
    }
  }

  const renderCount = (value?: number) => (typeof value === 'number' ? value : '—')

  const sortOptions = [
    { id: 'name,asc', name: 'Name (A-Z)' },
    { id: 'name,desc', name: 'Name (Z-A)' },
    { id: 'createdAt,desc', name: 'Newest first' },
    { id: 'createdAt,asc', name: 'Oldest first' },
  ]

  const displayChurches = useMemo(() => {
    const byStatus = (status?: EntityStatus) => (status === 'ACTIVE' ? 0 : 1)
    const filtered = statusFilter === 'ALL' ? churches : churches.filter((c) => c.status === statusFilter)
    return [...filtered].sort((a, b) => {
      const statusCompare = byStatus(a.status) - byStatus(b.status)
      if (statusCompare !== 0) return statusCompare

      switch (sort) {
        case 'name,asc':
          return a.name.localeCompare(b.name)
        case 'name,desc':
          return b.name.localeCompare(a.name)
        case 'createdAt,asc':
          return a.createdAt.localeCompare(b.createdAt)
        case 'createdAt,desc':
          return b.createdAt.localeCompare(a.createdAt)
        default:
          return 0
      }
    })
  }, [churches, sort, statusFilter])

  return (
    <AppShell>
      <PageLayout title="Church Management">
        {/* Modern Header with Filters */}
        <MasterDataHeader
          title="Church Management"
          subtitle="Manage churches within archdeaconries"
          onAddClick={!isReadOnly && selectedArchdeaconryId ? handleOpenCreateDialog : undefined}
          addButtonLabel="Add Church"
          isAdmin={!isReadOnly}
          filters={[
            {
              id: 'diocese',
              label: 'Diocese',
              value: selectedDioceseId,
              options: dioceses.map(d => ({ id: d.id, name: d.name })),
              onChange: (value) => setSelectedDioceseId(value as number | null),
              placeholder: 'Select Diocese',
            },
            {
              id: 'archdeaconry',
              label: 'Archdeaconry',
              value: selectedArchdeaconryId,
              options: archdeaconries.map(a => ({ id: a.id, name: a.name })),
              onChange: (value) => setSelectedArchdeaconryId(value as number | null),
              disabled: !archdeaconries.length,
              placeholder: 'Select Archdeaconry',
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
            {
              id: 'columns',
              label: 'Columns',
              value: visibleColumns,
              options: [
                { id: 'code', name: 'Code' },
                { id: 'diocese', name: 'Diocese' },
                { id: 'archdeaconry', name: 'Archdeaconry' },
                { id: 'leaders', name: 'Leaders' },
                { id: 'created', name: 'Created' },
              ],
              onChange: (value) => setVisibleColumns(Array.isArray(value) ? value : []),
              multiple: true,
            },
            {
              id: 'status',
              label: 'Status',
              value: statusFilter,
              options: [
                { id: 'ACTIVE', name: 'Active' },
                { id: 'INACTIVE', name: 'Inactive' },
                { id: 'ALL', name: 'All' },
              ],
              onChange: (value) => { setStatusFilter((value as any) || 'ALL'); setPage(0) },
              placeholder: 'Status',
            },
          ]}
        />

        <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
        {loading ? (
          <LoadingState count={5} variant="row" />
        ) : !selectedArchdeaconryId ? (
          <EmptyState title="Select an archdeaconry" description="Please select an archdeaconry to view its churches." />
        ) : displayChurches.length === 0 ? (
          <EmptyState
            title="No churches found"
            description={isReadOnly ? 'No churches exist yet.' : 'Create your first church.'}
            action={!isReadOnly && <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>Add Church</Button>}
          />
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
                    <TableCell>Name</TableCell>
                    {isColumnVisible('code') && <TableCell>Code</TableCell>}
                    {isColumnVisible('diocese') && <TableCell>Diocese</TableCell>}
                    {isColumnVisible('archdeaconry') && <TableCell>Archdeaconry</TableCell>}
                    {isColumnVisible('leaders') && <TableCell align="right">Leaders</TableCell>}
                    {isColumnVisible('created') && <TableCell>Created</TableCell>}
                    {!isReadOnly && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayChurches.map((church) => (
                    <TableRow key={church.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={500}>{church.name}</Typography></TableCell>
                      {isColumnVisible('code') && <TableCell>{church.code || '—'}</TableCell>}
                      {isColumnVisible('diocese') && <TableCell>{church.diocese?.name || '—'}</TableCell>}
                      {isColumnVisible('archdeaconry') && <TableCell>{church.archdeaconry.name}</TableCell>}
                      {isColumnVisible('leaders') && <TableCell align="right">{renderCount(church.currentLeadersCount)}</TableCell>}
                      {isColumnVisible('created') && <TableCell>{new Date(church.createdAt).toLocaleDateString()}</TableCell>}
                      {!isReadOnly && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(church)} color="primary"><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => { setChurchToDelete(church); setDeleteDialogOpen(true); }} color="error"><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={totalElements}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </>
        )}
      </Paper>

      <Dialog open={dialogMode !== null} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Create Church' : 'Edit Church'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
            <Autocomplete
              options={archdeaconries}
              getOptionLabel={(opt) => opt.name}
              value={archdeaconries.find((a) => a.id === formData.archdeaconryId) || null}
              onChange={(_, val) => {
                setFormData({ ...formData, archdeaconryId: val?.id || 0 })
                if (errors.archdeaconryId) setErrors((prev) => ({ ...prev, archdeaconryId: undefined }))
              }}
              disabled={dialogMode === 'edit'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Archdeaconry"
                  required
                  size="small"
                  error={Boolean(errors.archdeaconryId)}
                  helperText={errors.archdeaconryId}
                />
              )}
              size="small"
            />
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              required
              fullWidth
              size="small"
              error={Boolean(errors.name)}
              helperText={errors.name}
            />
            <TextField
              label="Code"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value })
                if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }))
              }}
              fullWidth
              size="small"
              helperText={errors.code || 'Optional unique identifier'}
            />
            {dialogMode === 'edit' && (
              <FormControl fullWidth size="small">
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{dialogMode === 'create' ? 'Create' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Church</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{churchToDelete?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
    </AppShell>
  )
}
