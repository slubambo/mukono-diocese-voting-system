/**
 * Fellowship Management Page
 * Simpler - fellowships are not hierarchical
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
  Tooltip,
  Box,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/ToastProvider'
import { fellowshipApi } from '../../api/fellowship.api'
import type { Fellowship, CreateFellowshipRequest, EntityStatus } from '../../types/organization'
import LoadingState from '../../components/common/LoadingState'
import EmptyState from '../../components/common/EmptyState'
import PageLayout from '../../components/layout/PageLayout'
import AppShell from '../../components/layout/AppShell'
import MasterDataHeader from '../../components/common/MasterDataHeader'

type DialogMode = 'create' | 'edit' | null

export const FellowshipPage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  
  const [fellowships, setFellowships] = useState<Fellowship[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [totalElements, setTotalElements] = useState(0)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [sort, setSort] = useState('name,asc')
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE')
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['code', 'positions', 'created'])
  
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selected, setSelected] = useState<Fellowship | null>(null)
  const [formData, setFormData] = useState<CreateFellowshipRequest & { status?: EntityStatus }>({ name: '', code: '' })
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Fellowship | null>(null)
  
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false
  const isColumnVisible = (key: string) => visibleColumns.includes(key)

  const fetchFellowships = async () => {
    try {
      setLoading(true)
      const response = await fellowshipApi.list({
        page,
        size: rowsPerPage,
        sort: 'id,desc',
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      })
      setFellowships(response.content)
      setTotalElements(response.totalElements)
      setStats({
        total: response.totalElements,
        active: response.content.filter((f) => f.status === 'ACTIVE').length,
        inactive: response.content.filter((f) => f.status === 'INACTIVE').length,
      })
    } catch (error) {
      showToast('Failed to load fellowships', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFellowships()
  }, [page, rowsPerPage, statusFilter])

  const handleOpenCreate = () => {
    setFormData({ name: '', code: '' })
    setErrors({})
    setSelected(null)
    setDialogMode('create')
  }

  const handleOpenEdit = (fellowship: Fellowship) => {
    setFormData({ name: fellowship.name, code: fellowship.code || '', status: fellowship.status })
    setErrors({})
    setSelected(fellowship)
    setDialogMode('edit')
  }

  const handleClose = () => {
    setDialogMode(null)
    setSelected(null)
    setErrors({})
  }

  const validateForm = () => {
    const nextErrors: { name?: string; code?: string } = {}

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
        await fellowshipApi.create({ name: formData.name, code: formData.code || undefined })
        showToast('Fellowship created', 'success')
      } else if (selected) {
        await fellowshipApi.update(selected.id, { name: formData.name, code: formData.code || undefined, status: formData.status })
        showToast('Fellowship updated', 'success')
      }
      handleClose()
      fetchFellowships()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save', 'error')
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await fellowshipApi.delete(toDelete.id)
      showToast('Fellowship deactivated', 'success')
      setDeleteDialogOpen(false)
      setToDelete(null)
      fetchFellowships()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete', 'error')
    }
  }

  const renderCount = (value?: number) => (typeof value === 'number' ? value : '—')

  const sortOptions = [
    { id: 'name,asc', name: 'Name (A-Z)' },
    { id: 'name,desc', name: 'Name (Z-A)' },
    { id: 'createdAt,desc', name: 'Newest first' },
    { id: 'createdAt,asc', name: 'Oldest first' },
  ]

  const displayFellowships = useMemo(() => {
    const byStatus = (status?: EntityStatus) => (status === 'ACTIVE' ? 0 : 1)
    const filtered = statusFilter === 'ALL' ? fellowships : fellowships.filter((f) => f.status === statusFilter)
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
  }, [fellowships, sort, statusFilter])

  return (
    <AppShell>
      <PageLayout title="Fellowships">
        {/* Modern Header */}
        <MasterDataHeader
          title="Fellowship Management"
          subtitle="Manage fellowships in the organizational structure"
          onAddClick={isAdmin ? handleOpenCreate : undefined}
          addButtonLabel="Add Fellowship"
          isAdmin={isAdmin}
          stats={[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Inactive', value: stats.inactive },
          ]}
          filters={[
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
                { id: 'positions', name: 'Positions' },
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
        ) : displayFellowships.length === 0 ? (
          <EmptyState
            title="No fellowships found"
            description={isAdmin ? 'Create your first fellowship.' : 'No fellowships exist yet.'}
            action={isAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add Fellowship</Button>}
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
                    {isColumnVisible('positions') && <TableCell align="right">Positions</TableCell>}
                    {isColumnVisible('created') && <TableCell>Created</TableCell>}
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayFellowships.map((f) => (
                    <TableRow key={f.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={500}>{f.name}</Typography></TableCell>
                      {isColumnVisible('code') && <TableCell>{f.code || '—'}</TableCell>}
                      {isColumnVisible('positions') && <TableCell align="right">{renderCount(f.positionsCount)}</TableCell>}
                      {isColumnVisible('created') && <TableCell>{new Date(f.createdAt).toLocaleDateString()}</TableCell>}
                      {isAdmin && (
                        <TableCell align="right">
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(f)} color="primary"><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" onClick={() => { setToDelete(f); setDeleteDialogOpen(true); }} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      <Dialog open={dialogMode !== null} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Create Fellowship' : 'Edit Fellowship'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
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
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{dialogMode === 'create' ? 'Create' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Fellowship</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete <strong>{toDelete?.name}</strong>?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
    </AppShell>
  )
}
