/**
 * Position Title Management Page
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
  Box,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/ToastProvider'
import { positionTitleApi } from '../../api/positionTitle.api'
import type { PositionTitle, CreatePositionTitleRequest, EntityStatus } from '../../types/leadership'
import StatusChip from '../../components/common/StatusChip'
import LoadingState from '../../components/common/LoadingState'
import EmptyState from '../../components/common/EmptyState'
import PageLayout from '../../components/layout/PageLayout'
import AppShell from '../../components/layout/AppShell'
import MasterDataHeader from '../../components/common/MasterDataHeader'

type DialogMode = 'create' | 'edit' | null

export const PositionTitlePage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  
  const [titles, setTitles] = useState<PositionTitle[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [totalElements, setTotalElements] = useState(0)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selected, setSelected] = useState<PositionTitle | null>(null)
  const [formData, setFormData] = useState<CreatePositionTitleRequest & { status?: EntityStatus }>({ name: '' })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<PositionTitle | null>(null)
  
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false

  const fetchTitles = async () => {
    try {
      setLoading(true)
      const response = await positionTitleApi.list({ page, size: rowsPerPage, sort: 'id,desc' })
      setTitles(response.content)
      setTotalElements(response.totalElements)
      setStats({
        total: response.totalElements,
        active: response.content.filter((t) => t.status === 'ACTIVE').length,
        inactive: response.content.filter((t) => t.status === 'INACTIVE').length,
      })
    } catch (error) {
      showToast('Failed to load position titles', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTitles()
  }, [page, rowsPerPage])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Name is required', 'error')
      return
    }

    try {
      if (dialogMode === 'create') {
        await positionTitleApi.create({ name: formData.name })
        showToast('Position title created', 'success')
      } else if (selected) {
        await positionTitleApi.update(selected.id, { name: formData.name, status: formData.status })
        showToast('Position title updated', 'success')
      }
      setDialogMode(null)
      fetchTitles()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save', 'error')
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await positionTitleApi.delete(toDelete.id)
      showToast('Position title deactivated', 'success')
      setDeleteDialogOpen(false)
      setToDelete(null)
      fetchTitles()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete', 'error')
    }
  }

  return (
    <AppShell>
      <PageLayout title="Position Titles">
        {/* Modern Header */}
        <MasterDataHeader
          title="Position Titles"
          subtitle="Manage position title templates"
          onAddClick={isAdmin ? () => { setFormData({ name: '' }); setDialogMode('create'); } : undefined}
          addButtonLabel="Add Title"
          isAdmin={isAdmin}
          stats={[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Inactive', value: stats.inactive },
          ]}
        />

        <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
        {loading ? (
          <LoadingState count={5} variant="row" />
        ) : titles.length === 0 ? (
          <EmptyState title="No position titles" description={isAdmin ? 'Create your first position title.' : 'No titles exist yet.'} action={isAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData({ name: '' }); setDialogMode('create'); }}>Add Title</Button>} />
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
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {titles.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={500}>{t.name}</Typography></TableCell>
                      <TableCell><StatusChip status={t.status} /></TableCell>
                      <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => { setFormData({ name: t.name, status: t.status }); setSelected(t); setDialogMode('edit'); }} color="primary"><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => { setToDelete(t); setDeleteDialogOpen(true); }} color="error"><DeleteIcon fontSize="small" /></IconButton>
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
        <DialogTitle>{dialogMode === 'create' ? 'Create Position Title' : 'Edit Position Title'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required fullWidth autoFocus />
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
        <DialogTitle>Delete Position Title</DialogTitle>
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
