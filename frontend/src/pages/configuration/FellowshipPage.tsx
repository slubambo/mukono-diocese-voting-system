/**
 * Fellowship Management Page
 * Simpler - fellowships are not hierarchical
 */
import React, { useState, useEffect } from 'react'
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
import StatusChip from '../../components/common/StatusChip'
import LoadingState from '../../components/common/LoadingState'
import EmptyState from '../../components/common/EmptyState'
import PageLayout from '../../components/layout/PageLayout'

type DialogMode = 'create' | 'edit' | null

export const FellowshipPage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  
  const [fellowships, setFellowships] = useState<Fellowship[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [totalElements, setTotalElements] = useState(0)
  
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selected, setSelected] = useState<Fellowship | null>(null)
  const [formData, setFormData] = useState<CreateFellowshipRequest & { status?: EntityStatus }>({ name: '', code: '' })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Fellowship | null>(null)
  
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false

  const fetchFellowships = async () => {
    try {
      setLoading(true)
      const response = await fellowshipApi.list({ page, size: rowsPerPage, sort: 'id,desc' })
      setFellowships(response.content)
      setTotalElements(response.totalElements)
    } catch (error) {
      showToast('Failed to load fellowships', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFellowships()
  }, [page, rowsPerPage])

  const handleOpenCreate = () => {
    setFormData({ name: '', code: '' })
    setSelected(null)
    setDialogMode('create')
  }

  const handleOpenEdit = (fellowship: Fellowship) => {
    setFormData({ name: fellowship.name, code: fellowship.code || '', status: fellowship.status })
    setSelected(fellowship)
    setDialogMode('edit')
  }

  const handleClose = () => {
    setDialogMode(null)
    setSelected(null)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Name is required', 'error')
      return
    }

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

  return (
    <PageLayout
      title="Fellowship Management"
      subtitle="Manage fellowships"
      actions={!isAdmin ? undefined : <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add Fellowship</Button>}
    >
      <Paper sx={{ width: '100%', mb: 2 }}>
        {loading ? (
          <LoadingState count={5} variant="row" />
        ) : fellowships.length === 0 ? (
          <EmptyState
            title="No fellowships found"
            description={isAdmin ? 'Create your first fellowship.' : 'No fellowships exist yet.'}
            action={isAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add Fellowship</Button>}
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fellowships.map((f) => (
                    <TableRow key={f.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={500}>{f.name}</Typography></TableCell>
                      <TableCell>{f.code || '—'}</TableCell>
                      <TableCell><StatusChip status={f.status} /></TableCell>
                      <TableCell>{new Date(f.createdAt).toLocaleDateString()}</TableCell>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required fullWidth />
            <TextField label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} fullWidth />
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
  )
}
