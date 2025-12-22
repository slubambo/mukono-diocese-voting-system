/**
 * Archdeaconry Management Page
 * Allows ADMIN to create, update, delete archdeaconries
 * Allows DS/Polling Officer to view archdeaconries (read-only)
 */
import React, { useState, useEffect } from 'react'
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
  Tooltip,
  Autocomplete,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/ToastProvider'
import { archdeaconryApi } from '../../api/archdeaconry.api'
import { dioceseApi } from '../../api/diocese.api'
import type { Archdeaconry, CreateArchdeaconryRequest, EntityStatus, Diocese } from '../../types/organization'
import StatusChip from '../../components/common/StatusChip'
import LoadingState from '../../components/common/LoadingState'
import EmptyState from '../../components/common/EmptyState'
import PageLayout from '../../components/layout/PageLayout'
import AppShell from '../../components/layout/AppShell'
import MasterDataHeader from '../../components/common/MasterDataHeader'

type DialogMode = 'create' | 'edit' | null

export const ArchdeaconryPage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  
  const [archdeaconries, setArchdeaconries] = useState<Archdeaconry[]>([])
  const [dioceses, setDioceses] = useState<Diocese[]>([])
  const [selectedDioceseId, setSelectedDioceseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [totalElements, setTotalElements] = useState(0)
  
  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedArchdeaconry, setSelectedArchdeaconry] = useState<Archdeaconry | null>(null)
  const [formData, setFormData] = useState<CreateArchdeaconryRequest & { status?: EntityStatus }>({
    dioceseId: 0,
    name: '',
    code: '',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [archdeaconryToDelete, setArchdeaconryToDelete] = useState<Archdeaconry | null>(null)
  
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false
  const isReadOnly = !isAdmin

  // Fetch dioceses for selection
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

  // Fetch archdeaconries
  const fetchArchdeaconries = async () => {
    if (!selectedDioceseId) return
    
    try {
      setLoading(true)
      const response = await archdeaconryApi.list({
        dioceseId: selectedDioceseId,
        page,
        size: rowsPerPage,
        sort: 'id,desc',
      })
      setArchdeaconries(response.content)
      setTotalElements(response.totalElements)
    } catch (error) {
      showToast('Failed to load archdeaconries', 'error')
      console.error('Error fetching archdeaconries:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDioceses()
  }, [])

  useEffect(() => {
    if (selectedDioceseId) {
      fetchArchdeaconries()
    }
  }, [page, rowsPerPage, selectedDioceseId])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenCreateDialog = () => {
    setFormData({ dioceseId: selectedDioceseId || 0, name: '', code: '' })
    setSelectedArchdeaconry(null)
    setDialogMode('create')
  }

  const handleOpenEditDialog = (archdeaconry: Archdeaconry) => {
    setFormData({
      dioceseId: archdeaconry.diocese.id,
      name: archdeaconry.name,
      code: archdeaconry.code || '',
      status: archdeaconry.status,
    })
    setSelectedArchdeaconry(archdeaconry)
    setDialogMode('edit')
  }

  const handleCloseDialog = () => {
    setDialogMode(null)
    setSelectedArchdeaconry(null)
    setFormData({ dioceseId: 0, name: '', code: '' })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Archdeaconry name is required', 'error')
      return
    }
    if (!formData.dioceseId) {
      showToast('Diocese is required', 'error')
      return
    }

    try {
      if (dialogMode === 'create') {
        await archdeaconryApi.create({
          dioceseId: formData.dioceseId,
          name: formData.name,
          code: formData.code || undefined,
        })
        showToast('Archdeaconry created successfully', 'success')
      } else if (dialogMode === 'edit' && selectedArchdeaconry) {
        await archdeaconryApi.update(selectedArchdeaconry.id, {
          name: formData.name,
          code: formData.code || undefined,
          status: formData.status,
        })
        showToast('Archdeaconry updated successfully', 'success')
      }
      handleCloseDialog()
      fetchArchdeaconries()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to save archdeaconry'
      showToast(message, 'error')
      console.error('Error saving archdeaconry:', error)
    }
  }

  const handleOpenDeleteDialog = (archdeaconry: Archdeaconry) => {
    setArchdeaconryToDelete(archdeaconry)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setArchdeaconryToDelete(null)
  }

  const handleDelete = async () => {
    if (!archdeaconryToDelete) return

    try {
      await archdeaconryApi.delete(archdeaconryToDelete.id)
      showToast('Archdeaconry deactivated successfully', 'success')
      handleCloseDeleteDialog()
      fetchArchdeaconries()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete archdeaconry'
      showToast(message, 'error')
      console.error('Error deleting archdeaconry:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const stats = {
    total: totalElements,
    active: archdeaconries.filter((a) => a.status === 'ACTIVE').length,
    inactive: archdeaconries.filter((a) => a.status === 'INACTIVE').length,
  }

  return (
    <AppShell>
      <PageLayout title="Archdeaconries">
        {/* Modern Header with Filters */}
        <MasterDataHeader
          title="Archdeaconry Management"
          subtitle="Manage archdeaconries within dioceses"
          onAddClick={!isReadOnly && selectedDioceseId ? handleOpenCreateDialog : undefined}
          addButtonLabel="Add Archdeaconry"
          isAdmin={!isReadOnly}
          stats={[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Inactive', value: stats.inactive },
          ]}
          filters={[
            {
              id: 'diocese',
              label: 'Diocese',
              value: selectedDioceseId,
              options: dioceses.map(d => ({ id: d.id, name: d.name })),
              onChange: (value) => {
                setSelectedDioceseId(value as number | null)
                setPage(0)
              },
              placeholder: 'Select Diocese',
            }
          ]}
        />

        <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
        {loading ? (
          <LoadingState count={5} variant="row" />
        ) : !selectedDioceseId ? (
          <EmptyState
            title="Select a diocese"
            description="Please select a diocese to view its archdeaconries."
          />
        ) : archdeaconries.length === 0 ? (
          <EmptyState
            title="No archdeaconries found"
            description={
              isReadOnly
                ? 'No archdeaconries have been created for this diocese yet.'
                : 'Get started by creating the first archdeaconry for this diocese.'
            }
            action={
              !isReadOnly && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
                  Add Archdeaconry
                </Button>
              )
            }
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
                    <TableCell>Code</TableCell>
                    <TableCell>Diocese</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    {!isReadOnly && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {archdeaconries.map((archdeaconry) => (
                    <TableRow key={archdeaconry.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {archdeaconry.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{archdeaconry.code || '—'}</TableCell>
                      <TableCell>{archdeaconry.diocese.name}</TableCell>
                      <TableCell>
                        <StatusChip status={archdeaconry.status} />
                      </TableCell>
                      <TableCell>{formatDate(archdeaconry.createdAt)}</TableCell>
                      {!isReadOnly && (
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(archdeaconry)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(archdeaconry)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogMode !== null} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create Archdeaconry' : 'Edit Archdeaconry'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={dioceses}
              getOptionLabel={(option) => option.name}
              value={dioceses.find((d) => d.id === formData.dioceseId) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, dioceseId: newValue?.id || 0 })
              }}
              disabled={dialogMode === 'edit'}
              renderInput={(params) => (
                <TextField {...params} label="Diocese" required />
              )}
            />
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              helperText="Optional unique identifier"
            />
            {dialogMode === 'edit' && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status || 'ACTIVE'}
                  label="Status"
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as EntityStatus })
                  }
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {dialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Archdeaconry</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{archdeaconryToDelete?.name}</strong>?
            This action will deactivate the archdeaconry.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
    </AppShell>
  )
}
