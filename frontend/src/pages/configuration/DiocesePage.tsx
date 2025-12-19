/**
 * Diocese Management Page
 * Allows ADMIN to create, update, delete dioceses
 * Allows DS/Polling Officer to view dioceses (read-only)
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
  InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
// BusinessIcon unused
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/feedback/ToastProvider'
import { dioceseApi } from '../../api/diocese.api'
import type { Diocese, CreateDioceseRequest, EntityStatus } from '../../types/organization'
import StatusChip from '../../components/common/StatusChip'
import LoadingState from '../../components/common/LoadingState'
import EmptyState from '../../components/common/EmptyState'
import PageLayout from '../../components/layout/PageLayout'
import AppShell from '../../components/layout/AppShell'
import MasterDataHeader from '../../components/common/MasterDataHeader'

type DialogMode = 'create' | 'edit' | null

export const DiocesePage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  
  const [dioceses, setDioceses] = useState<Diocese[]>([])
  const [filteredDioceses, setFilteredDioceses] = useState<Diocese[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [totalElements, setTotalElements] = useState(0)
  
  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedDiocese, setSelectedDiocese] = useState<Diocese | null>(null)
  const [formData, setFormData] = useState<CreateDioceseRequest & { status?: EntityStatus }>({
    name: '',
    code: '',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dioceseToDelete, setDioceseToDelete] = useState<Diocese | null>(null)
  
  // Check if user is admin
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false
  const isReadOnly = !isAdmin

  // Fetch dioceses
  const fetchDioceses = async () => {
    try {
      setLoading(true)
      const response = await dioceseApi.list({
        page,
        size: rowsPerPage,
        sort: 'id,desc',
      })
      setDioceses(response.content)
      setTotalElements(response.totalElements)
    } catch (error) {
      showToast('Failed to load dioceses', 'error')
      console.error('Error fetching dioceses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDioceses()
  }, [page, rowsPerPage])

  // Filter dioceses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDioceses(dioceses)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = dioceses.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.code?.toLowerCase().includes(query)
      )
      setFilteredDioceses(filtered)
    }
  }, [searchQuery, dioceses])

  // Calculate stats
  const stats = {
    total: totalElements,
    active: dioceses.filter((d) => d.status === 'ACTIVE').length,
    inactive: dioceses.filter((d) => d.status === 'INACTIVE').length,
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenCreateDialog = () => {
    setFormData({ name: '', code: '' })
    setSelectedDiocese(null)
    setDialogMode('create')
  }

  const handleOpenEditDialog = (diocese: Diocese) => {
    setFormData({
      name: diocese.name,
      code: diocese.code || '',
      status: diocese.status,
    })
    setSelectedDiocese(diocese)
    setDialogMode('edit')
  }

  const handleCloseDialog = () => {
    setDialogMode(null)
    setSelectedDiocese(null)
    setFormData({ name: '', code: '' })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Diocese name is required', 'error')
      return
    }

    try {
      if (dialogMode === 'create') {
        await dioceseApi.create({
          name: formData.name,
          code: formData.code || undefined,
        })
        showToast('Diocese created successfully', 'success')
      } else if (dialogMode === 'edit' && selectedDiocese) {
        await dioceseApi.update(selectedDiocese.id, {
          name: formData.name,
          code: formData.code || undefined,
          status: formData.status,
        })
        showToast('Diocese updated successfully', 'success')
      }
      handleCloseDialog()
      fetchDioceses()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to save diocese'
      showToast(message, 'error')
      console.error('Error saving diocese:', error)
    }
  }

  const handleOpenDeleteDialog = (diocese: Diocese) => {
    setDioceseToDelete(diocese)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setDioceseToDelete(null)
  }

  const handleDelete = async () => {
    if (!dioceseToDelete) return

    try {
      await dioceseApi.delete(dioceseToDelete.id)
      showToast('Diocese deactivated successfully', 'success')
      handleCloseDeleteDialog()
      fetchDioceses()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete diocese'
      showToast(message, 'error')
      console.error('Error deleting diocese:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <AppShell>
      <PageLayout title="Dioceses">
        {/* Modern Header with Stats */}
        <MasterDataHeader
          title="Diocese Management"
          subtitle="Manage dioceses in the organizational hierarchy"
          onAddClick={!isReadOnly ? handleOpenCreateDialog : undefined}
          addButtonLabel="Add Diocese"
          isAdmin={!isReadOnly}
          stats={[
            { label: 'Total Dioceses', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Inactive', value: stats.inactive },
          ]}
        />

        {/* Search Bar */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 1.5,
            border: '1px solid rgba(88, 28, 135, 0.1)',
          }}
        >
          <TextField
            fullWidth
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" sx={{ mr: 1 }} />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#7c3aed',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#7c3aed',
                },
              },
            }}
          />
        </Paper>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
        {loading ? (
          <LoadingState count={5} variant="row" />
        ) : filteredDioceses.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No dioceses found' : 'No dioceses found'}
            description={
              searchQuery
                ? 'Try adjusting your search query.'
                : isReadOnly
                ? 'No dioceses have been created yet.'
                : 'Get started by creating your first diocese.'
            }
            action={
              !isReadOnly && !searchQuery && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
                  Add Diocese
                </Button>
              )
            }
          />
        ) : (
          <>
            <TableContainer>
              <Table sx={{
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
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    {!isReadOnly && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDioceses.map((diocese) => (
                    <TableRow key={diocese.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {diocese.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{diocese.code || '—'}</TableCell>
                      <TableCell>
                        <StatusChip status={diocese.status} />
                      </TableCell>
                      <TableCell>{formatDate(diocese.createdAt)}</TableCell>
                      {!isReadOnly && (
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(diocese)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(diocese)}
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
          {dialogMode === 'create' ? 'Create Diocese' : 'Edit Diocese'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              autoFocus
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
        <DialogTitle>Delete Diocese</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{dioceseToDelete?.name}</strong>?
            This action will deactivate the diocese.
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
