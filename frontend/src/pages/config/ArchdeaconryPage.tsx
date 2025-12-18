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
import { ArchdeaconryResponse, CreateArchdeaconryRequest, UpdateArchdeaconryRequest, orgApi } from '@/api/org.api'
import { DioceseResponse } from '@/api/org.api'
import { useToast } from '@/hooks/useToast'

interface ArchdeaconryFormData {
  dioceseId: number | ''
  name: string
  code: string
}

export const ArchdeaconryPage: React.FC = () => {
  const { showToast } = useToast()
  const [archdeaconries, setArchdeaconries] = useState<ArchdeaconryResponse[]>([])
  const [dioceses, setDioceses] = useState<DioceseResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [selectedDiocese, setSelectedDiocese] = useState<number | ''>('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<ArchdeaconryFormData>({ dioceseId: '', name: '', code: '' })
  const [formLoading, setFormLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch dioceses for dropdown
  const fetchDioceses = async () => {
    try {
      const response = await orgApi.listDioceses({ size: 1000 })
      setDioceses(response.data.content)
    } catch (error: any) {
      showToast('Failed to fetch dioceses', 'error')
    }
  }

  // Fetch archdeaconries
  const fetchArchdeaconries = async () => {
    if (!selectedDiocese) {
      setArchdeaconries([])
      setTotalCount(0)
      return
    }

    try {
      setLoading(true)
      const response = await orgApi.listArchdeaconries(selectedDiocese as number, {
        q: searchValue,
        page,
        size: pageSize,
      })
      setArchdeaconries(response.data.content)
      setTotalCount(response.data.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to fetch archdeaconries', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDioceses()
  }, [])

  useEffect(() => {
    fetchArchdeaconries()
  }, [page, pageSize, searchValue, selectedDiocese])

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!formData.dioceseId) {
      showToast('Diocese is required', 'error')
      return
    }
    if (!formData.name.trim()) {
      showToast('Archdeaconry name is required', 'error')
      return
    }

    try {
      setFormLoading(true)
      if (editingId) {
        const payload: UpdateArchdeaconryRequest = {
          name: formData.name,
          code: formData.code || undefined,
        }
        await orgApi.updateArchdeaconry(editingId, payload)
        showToast('Archdeaconry updated successfully', 'success')
      } else {
        const payload: CreateArchdeaconryRequest = {
          dioceseId: formData.dioceseId as number,
          name: formData.name,
          code: formData.code || undefined,
        }
        await orgApi.createArchdeaconry(payload)
        showToast('Archdeaconry created successfully', 'success')
      }
      setFormOpen(false)
      setFormData({ dioceseId: '', name: '', code: '' })
      setEditingId(null)
      setPage(0)
      await fetchArchdeaconries()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save archdeaconry', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (archdeaconry: ArchdeaconryResponse) => {
    setEditingId(archdeaconry.id)
    setFormData({
      dioceseId: archdeaconry.diocese.id,
      name: archdeaconry.name,
      code: archdeaconry.code || '',
    })
    setFormOpen(true)
  }

  // Handle delete
  const handleDeleteClick = (archdeaconry: ArchdeaconryResponse) => {
    setDeleteId(archdeaconry.id)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return

    try {
      setFormLoading(true)
      await orgApi.deleteArchdeaconry(deleteId)
      showToast('Archdeaconry deleted successfully', 'success')
      setConfirmOpen(false)
      setDeleteId(null)
      setPage(0)
      await fetchArchdeaconries()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete archdeaconry', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const columns: DataTableColumn<ArchdeaconryResponse>[] = [
    {
      key: 'name',
      label: 'Name',
      width: '30%',
    },
    {
      key: 'code',
      label: 'Code',
      width: '15%',
      render: (value) => value || '-',
    },
    {
      key: 'diocese',
      label: 'Diocese',
      width: '25%',
      render: (value: any) => value?.name || '-',
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
      {/* Diocese Selection */}
      <FormControl fullWidth size="small">
        <InputLabel>Select Diocese</InputLabel>
        <Select
          value={selectedDiocese}
          onChange={(e) => {
            setSelectedDiocese(e.target.value as number | '')
            setPage(0)
          }}
          label="Select Diocese"
          disabled={dioceses.length === 0}
        >
          <MenuItem value="">-- No Diocese Selected --</MenuItem>
          {dioceses.map((diocese) => (
            <MenuItem key={diocese.id} value={diocese.id}>
              {diocese.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedDiocese && (
        <DataTable<ArchdeaconryResponse>
          columns={columns}
          rows={archdeaconries}
          loading={loading}
          empty={archdeaconries.length === 0 && !loading}
          emptyMessage="No archdeaconries found for this diocese."
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          searchable
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          getRowId={(row) => row.id}
          toolbar={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingId(null)
                setFormData({ dioceseId: selectedDiocese, name: '', code: '' })
                setFormOpen(true)
              }}
            >
              New Archdeaconry
            </Button>
          }
        />
      )}

      {!selectedDiocese && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          Select a diocese to view archdeaconries
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => !formLoading && setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Archdeaconry' : 'Create Archdeaconry'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth disabled={formLoading}>
            <InputLabel>Diocese</InputLabel>
            <Select
              value={formData.dioceseId}
              onChange={(e) => setFormData({ ...formData, dioceseId: e.target.value as number })}
              label="Diocese"
              required
            >
              <MenuItem value="">-- Select Diocese --</MenuItem>
              {dioceses.map((diocese) => (
                <MenuItem key={diocese.id} value={diocese.id}>
                  {diocese.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Archdeaconry Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={formLoading}
            autoFocus
            required
          />
          <TextField
            label="Code (Optional)"
            fullWidth
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            disabled={formLoading}
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
        title="Delete Archdeaconry"
        message="Are you sure you want to delete this archdeaconry? This action cannot be undone."
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

export default ArchdeaconryPage
