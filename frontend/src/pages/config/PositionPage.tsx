import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  FellowshipPositionResponse,
  CreateFellowshipPositionRequest,
  UpdateFellowshipPositionRequest,
  masterDataApi,
} from '@/api/master-data.api'
import { FellowshipResponse, PositionTitleResponse, orgApi } from '@/api/org.api'
import { useToast } from '@/hooks/useToast'

interface FellowshipPositionFormData {
  fellowshipId: number | ''
  titleId: number | ''
  scope: 'DIOCESE' | 'ARCHDEACONRY' | 'CHURCH' | ''
  seats?: number
}

const SCOPE_OPTIONS = [
  { value: 'DIOCESE', label: 'Diocese' },
  { value: 'ARCHDEACONRY', label: 'Archdeaconry' },
  { value: 'CHURCH', label: 'Church' },
]

export const FellowshipPositionPage: React.FC = () => {
  const { showToast } = useToast()
  const [positions, setPositions] = useState<FellowshipPositionResponse[]>([])
  const [fellowships, setFellowships] = useState<FellowshipResponse[]>([])
  const [titles, setTitles] = useState<PositionTitleResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedFellowship, setSelectedFellowship] = useState<number | ''>('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FellowshipPositionFormData>({
    fellowshipId: '',
    titleId: '',
    scope: '',
    seats: 1,
  })
  const [formLoading, setFormLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch fellowships and titles
  const fetchReferenceData = async () => {
    try {
      const [fellowshipsRes, titlesRes] = await Promise.all([
        orgApi.listFellowships({ size: 1000 }),
        masterDataApi.listPositionTitles({ size: 1000 }),
      ])
      setFellowships(fellowshipsRes.data.content)
      setTitles(titlesRes.data.content)
    } catch (error: any) {
      showToast('Failed to fetch reference data', 'error')
    }
  }

  // Fetch positions
  const fetchPositions = async () => {
    if (!selectedFellowship) {
      setPositions([])
      setTotalCount(0)
      return
    }

    try {
      setLoading(true)
      const response = await masterDataApi.listFellowshipPositions(selectedFellowship as number, {
        page,
        size: pageSize,
      })
      setPositions(response.data.content)
      setTotalCount(response.data.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to fetch positions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferenceData()
  }, [])

  useEffect(() => {
    fetchPositions()
  }, [page, pageSize, selectedFellowship])

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!formData.fellowshipId) {
      showToast('Fellowship is required', 'error')
      return
    }
    if (!formData.titleId) {
      showToast('Position title is required', 'error')
      return
    }
    if (!formData.scope) {
      showToast('Scope is required', 'error')
      return
    }

    try {
      setFormLoading(true)
      if (editingId) {
        const payload: UpdateFellowshipPositionRequest = {
          titleId: formData.titleId as number,
          scope: formData.scope as 'DIOCESE' | 'ARCHDEACONRY' | 'CHURCH',
          seats: formData.seats || 1,
        }
        await masterDataApi.updateFellowshipPosition(editingId, payload)
        showToast('Fellowship position updated successfully', 'success')
      } else {
        const payload: CreateFellowshipPositionRequest = {
          fellowshipId: formData.fellowshipId as number,
          titleId: formData.titleId as number,
          scope: formData.scope as 'DIOCESE' | 'ARCHDEACONRY' | 'CHURCH',
          seats: formData.seats || 1,
        }
        await masterDataApi.createFellowshipPosition(payload)
        showToast('Fellowship position created successfully', 'success')
      }
      setFormOpen(false)
      setFormData({ fellowshipId: '', titleId: '', scope: '', seats: 1 })
      setEditingId(null)
      setPage(0)
      await fetchPositions()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save fellowship position', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (position: FellowshipPositionResponse) => {
    setEditingId(position.id)
    setFormData({
      fellowshipId: position.fellowship.id,
      titleId: position.title.id,
      scope: position.scope,
      seats: position.seats,
    })
    setFormOpen(true)
  }

  // Handle delete
  const handleDeleteClick = (position: FellowshipPositionResponse) => {
    setDeleteId(position.id)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return

    try {
      setFormLoading(true)
      await masterDataApi.deleteFellowshipPosition(deleteId)
      showToast('Fellowship position deleted successfully', 'success')
      setConfirmOpen(false)
      setDeleteId(null)
      setPage(0)
      await fetchPositions()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete fellowship position', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const columns: DataTableColumn<FellowshipPositionResponse>[] = [
    {
      key: 'title',
      label: 'Position Title',
      width: '25%',
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'scope',
      label: 'Scope',
      width: '15%',
      render: (value) => (
        <Chip
          label={value}
          size="small"
          color={value === 'DIOCESE' ? 'primary' : value === 'ARCHDEACONRY' ? 'success' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      key: 'seats',
      label: 'Seats',
      width: '10%',
    },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (value) => (
        <Chip
          label={value}
          color={value === 'ACTIVE' ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
  ]

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Fellowship Selection */}
      <FormControl fullWidth size="small">
        <InputLabel>Select Fellowship</InputLabel>
        <Select
          value={selectedFellowship}
          onChange={(e) => {
            setSelectedFellowship(e.target.value as number | '')
            setPage(0)
          }}
          label="Select Fellowship"
          disabled={fellowships.length === 0}
        >
          <MenuItem value="">-- No Fellowship Selected --</MenuItem>
          {fellowships.map((fellowship) => (
            <MenuItem key={fellowship.id} value={fellowship.id}>
              {fellowship.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedFellowship && (
        <DataTable<FellowshipPositionResponse>
          columns={columns}
          rows={positions}
          loading={loading}
          empty={positions.length === 0 && !loading}
          emptyMessage="No positions found for this fellowship."
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          getRowId={(row) => row.id}
          toolbar={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingId(null)
                setFormData({ fellowshipId: selectedFellowship, titleId: '', scope: '', seats: 1 })
                setFormOpen(true)
              }}
            >
              New Position
            </Button>
          }
        />
      )}

      {!selectedFellowship && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          Select a fellowship to view positions
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => !formLoading && setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Fellowship Position' : 'Create Fellowship Position'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth disabled={formLoading || !!editingId}>
            <InputLabel>Fellowship</InputLabel>
            <Select
              value={formData.fellowshipId}
              onChange={(e) => setFormData({ ...formData, fellowshipId: e.target.value as number })}
              label="Fellowship"
              required
            >
              <MenuItem value="">-- Select Fellowship --</MenuItem>
              {fellowships.map((fellowship) => (
                <MenuItem key={fellowship.id} value={fellowship.id}>
                  {fellowship.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={formLoading}>
            <InputLabel>Position Title</InputLabel>
            <Select
              value={formData.titleId}
              onChange={(e) => setFormData({ ...formData, titleId: e.target.value as number })}
              label="Position Title"
              required
            >
              <MenuItem value="">-- Select Title --</MenuItem>
              {titles.map((title) => (
                <MenuItem key={title.id} value={title.id}>
                  {title.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={formLoading}>
            <InputLabel>Scope</InputLabel>
            <Select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
              label="Scope"
              required
            >
              <MenuItem value="">-- Select Scope --</MenuItem>
              {SCOPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Number of Seats"
            type="number"
            fullWidth
            value={formData.seats || 1}
            onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
            disabled={formLoading}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button onClick={handleFormSubmit} variant="contained" disabled={formLoading}>
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Fellowship Position"
        message="Are you sure you want to delete this position? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
        loading={formLoading}
      />
    </Box>
  )
}

export default FellowshipPositionPage
