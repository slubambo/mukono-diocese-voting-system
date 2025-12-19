/**
 * Church Management Page
 * Similar to Archdeaconry but belongs to an Archdeaconry
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
import StatusChip from '../../components/common/StatusChip'
import LoadingState from '../../components/common/LoadingState'
import EmptyState from '../../components/common/EmptyState'
import PageLayout from '../../components/layout/PageLayout'
import AppShell from '../../components/layout/AppShell'

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
  
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null)
  const [formData, setFormData] = useState<CreateChurchRequest & { status?: EntityStatus }>({
    archdeaconryId: 0,
    name: '',
    code: '',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [churchToDelete, setChurchToDelete] = useState<Church | null>(null)
  
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false
  const isReadOnly = !isAdmin

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
      })
      setChurches(response.content)
      setTotalElements(response.totalElements)
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
  }, [page, rowsPerPage, selectedArchdeaconryId])

  const handleOpenCreateDialog = () => {
    setFormData({ archdeaconryId: selectedArchdeaconryId || 0, name: '', code: '' })
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
    setSelectedChurch(church)
    setDialogMode('edit')
  }

  const handleCloseDialog = () => {
    setDialogMode(null)
    setSelectedChurch(null)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.archdeaconryId) {
      showToast('All required fields must be filled', 'error')
      return
    }

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

  return (
    <AppShell>
      <PageLayout
      title="Church Management"
      subtitle="Manage churches within archdeaconries"
      actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Diocese</InputLabel>
            <Select
              value={selectedDioceseId || ''}
              label="Diocese"
              onChange={(e) => setSelectedDioceseId(e.target.value as number)}
            >
              {dioceses.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Archdeaconry</InputLabel>
            <Select
              value={selectedArchdeaconryId || ''}
              label="Archdeaconry"
              onChange={(e) => setSelectedArchdeaconryId(e.target.value as number)}
              disabled={!archdeaconries.length}
            >
              {archdeaconries.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {!isReadOnly && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              disabled={!selectedArchdeaconryId}
            >
              Add Church
            </Button>
          )}
        </Box>
      }
    >
      <Paper sx={{ width: '100%', mb: 2 }}>
        {loading ? (
          <LoadingState count={5} variant="row" />
        ) : !selectedArchdeaconryId ? (
          <EmptyState title="Select an archdeaconry" description="Please select an archdeaconry to view its churches." />
        ) : churches.length === 0 ? (
          <EmptyState
            title="No churches found"
            description={isReadOnly ? 'No churches exist yet.' : 'Create your first church.'}
            action={!isReadOnly && <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>Add Church</Button>}
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Archdeaconry</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    {!isReadOnly && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {churches.map((church) => (
                    <TableRow key={church.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={500}>{church.name}</Typography></TableCell>
                      <TableCell>{church.code || '—'}</TableCell>
                      <TableCell>{church.archdeaconry.name}</TableCell>
                      <TableCell><StatusChip status={church.status} /></TableCell>
                      <TableCell>{new Date(church.createdAt).toLocaleDateString()}</TableCell>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={archdeaconries}
              getOptionLabel={(opt) => opt.name}
              value={archdeaconries.find((a) => a.id === formData.archdeaconryId) || null}
              onChange={(_, val) => setFormData({ ...formData, archdeaconryId: val?.id || 0 })}
              disabled={dialogMode === 'edit'}
              renderInput={(params) => <TextField {...params} label="Archdeaconry" required />}
            />
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
