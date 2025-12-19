/**
 * Fellowship Position Management Page
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
  
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selected, setSelected] = useState<FellowshipPosition | null>(null)
  const [formData, setFormData] = useState<CreateFellowshipPositionRequest & { status?: EntityStatus }>({
    fellowshipId: 0,
    titleId: 0,
    seats: 1,
    scope: 'DIOCESE',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<FellowshipPosition | null>(null)
  
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false

  const fetchPositions = async () => {
    try {
      setLoading(true)
      // Fetch all positions - use fellowshipId: 0 to get all (backend should handle this)
      const response = await fellowshipPositionApi.list({ fellowshipId: 0, page, size: rowsPerPage, sort: 'id,desc' })
      setPositions(response.content)
      setTotalElements(response.totalElements)
    } catch (error) {
      showToast('Failed to load positions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadFellowships = async () => {
    try {
      const response = await fellowshipApi.list({ page: 0, size: 1000 })
      setFellowships(response.content.filter(f => f.status === 'ACTIVE'))
    } catch (error) {
      console.error('Failed to load fellowships')
    }
  }

  const loadTitles = async () => {
    try {
      const response = await positionTitleApi.list({ page: 0, size: 1000 })
      setTitles(response.content.filter(t => t.status === 'ACTIVE'))
    } catch (error) {
      console.error('Failed to load position titles')
    }
  }

  useEffect(() => {
    fetchPositions()
  }, [page, rowsPerPage])

  useEffect(() => {
    loadFellowships()
    loadTitles()
  }, [])

  const handleSave = async () => {
    if (!formData.fellowshipId || !formData.titleId || !formData.seats || formData.seats < 1) {
      showToast('All fields are required', 'error')
      return
    }

    try {
      if (dialogMode === 'create') {
        await fellowshipPositionApi.create({
          fellowshipId: formData.fellowshipId,
          titleId: formData.titleId,
          seats: formData.seats,
          scope: formData.scope,
        })
        showToast('Position created', 'success')
      } else if (selected) {
        await fellowshipPositionApi.update(selected.id, {
          titleId: formData.titleId,
          seats: formData.seats,
          scope: formData.scope,
          status: formData.status,
        })
        showToast('Position updated', 'success')
      }
      setDialogMode(null)
      fetchPositions()
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

  // FellowshipPosition has nested fellowship and title objects
  const getFellowshipName = (position: FellowshipPosition) => position.fellowship.name
  const getTitleName = (position: FellowshipPosition) => position.title.name

  return (
    <PageLayout
      title="Positions"
      subtitle="Manage fellowship positions"
      actions={isAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData({ fellowshipId: 0, titleId: 0, seats: 1, scope: 'DIOCESE' }); setDialogMode('create'); }}>Add Position</Button>}
    >
      <Paper sx={{ width: '100%', mb: 2 }}>
        {loading ? (
          <LoadingState count={5} variant="row" />
        ) : positions.length === 0 ? (
          <EmptyState title="No positions" description={isAdmin ? 'Create your first position.' : 'No positions exist yet.'} action={isAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData({ fellowshipId: 0, titleId: 0, seats: 1, scope: 'DIOCESE' }); setDialogMode('create'); }}>Add Position</Button>} />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fellowship</TableCell>
                    <TableCell>Position Title</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Seats</TableCell>
                    <TableCell>Status</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell><Typography variant="body2">{getFellowshipName(p)}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={500}>{getTitleName(p)}</Typography></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{p.scope}</Typography></TableCell>
                      <TableCell>{p.seats}</TableCell>
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
            <FormControl fullWidth required>
              <InputLabel>Scope</InputLabel>
              <Select value={formData.scope} label="Scope" onChange={(e) => setFormData({ ...formData, scope: e.target.value as PositionScope })}>
                <MenuItem value="DIOCESE">Diocese</MenuItem>
                <MenuItem value="ARCHDEACONRY">Archdeaconry</MenuItem>
                <MenuItem value="CHURCH">Church</MenuItem>
              </Select>
            </FormControl>
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
  )
}
