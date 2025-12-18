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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ChurchResponse, CreateChurchRequest, UpdateChurchRequest, orgApi, DioceseResponse, ArchdeaconryResponse } from '@/api/org.api'
import { useToast } from '@/hooks/useToast'

interface ChurchFormData {
  archdeaconryId: number | ''
  name: string
  code: string
}

export const ChurchPage: React.FC = () => {
  const { showToast } = useToast()
  const [churches, setChurches] = useState<ChurchResponse[]>([])
  const [dioceses, setDioceses] = useState<DioceseResponse[]>([])
  const [archdeaconries, setArchdeaconries] = useState<ArchdeaconryResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [selectedDiocese, setSelectedDiocese] = useState<number | ''>('')
  const [selectedArchdeaconry, setSelectedArchdeaconry] = useState<number | ''>('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<ChurchFormData>({ archdeaconryId: '', name: '', code: '' })
  const [formLoading, setFormLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch dioceses
  const fetchDioceses = async () => {
    try {
      const response = await orgApi.listDioceses({ size: 1000 })
      setDioceses(response.data.content)
    } catch (error: any) {
      showToast('Failed to fetch dioceses', 'error')
    }
  }

  // Fetch archdeaconries for selected diocese
  const fetchArchdeaconries = async (dioceseId: number) => {
    try {
      const response = await orgApi.listArchdeaconries(dioceseId, { size: 1000 })
      setArchdeaconries(response.data.content)
    } catch (error: any) {
      showToast('Failed to fetch archdeaconries', 'error')
    }
  }

  // Fetch churches
  const fetchChurches = async () => {
    if (!selectedArchdeaconry) {
      setChurches([])
      setTotalCount(0)
      return
    }

    try {
      setLoading(true)
      const response = await orgApi.listChurches(selectedArchdeaconry as number, {
        q: searchValue,
        page,
        size: pageSize,
      })
      setChurches(response.data.content)
      setTotalCount(response.data.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to fetch churches', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDioceses()
  }, [])

  useEffect(() => {
    if (selectedDiocese) {
      fetchArchdeaconries(selectedDiocese as number)
      setSelectedArchdeaconry('')
    }
  }, [selectedDiocese])

  useEffect(() => {
    fetchChurches()
  }, [page, pageSize, searchValue, selectedArchdeaconry])

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!formData.archdeaconryId) {
      showToast('Archdeaconry is required', 'error')
      return
    }
    if (!formData.name.trim()) {
      showToast('Church name is required', 'error')
      return
    }

    try {
      setFormLoading(true)
      if (editingId) {
        const payload: UpdateChurchRequest = {
          name: formData.name,
          code: formData.code || undefined,
        }
        await orgApi.updateChurch(editingId, payload)
        showToast('Church updated successfully', 'success')
      } else {
        const payload: CreateChurchRequest = {
          archdeaconryId: formData.archdeaconryId as number,
          name: formData.name,
          code: formData.code || undefined,
        }
        await orgApi.createChurch(payload)
        showToast('Church created successfully', 'success')
      }
      setFormOpen(false)
      setFormData({ archdeaconryId: '', name: '', code: '' })
      setEditingId(null)
      setPage(0)
      await fetchChurches()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save church', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (church: ChurchResponse) => {
    setEditingId(church.id)
    setFormData({
      archdeaconryId: church.archdeaconry.id,
      name: church.name,
      code: church.code || '',
    })
    setFormOpen(true)
  }

  // Handle delete
  const handleDeleteClick = (church: ChurchResponse) => {
    setDeleteId(church.id)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return

    try {
      setFormLoading(true)
      await orgApi.deleteChurch(deleteId)
      showToast('Church deleted successfully', 'success')
      setConfirmOpen(false)
      setDeleteId(null)
      setPage(0)
      await fetchChurches()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete church', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const columns: DataTableColumn<ChurchResponse>[] = [
    {
      key: 'name',
      label: 'Name',
      width: '25%',
    },
    {
      key: 'code',
      label: 'Code',
      width: '12%',
      render: (value) => value || '-',
    },
    {
      key: 'archdeaconry',
      label: 'Archdeaconry',
      width: '20%',
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
          onChange={(e) => setSelectedDiocese(e.target.value as number | '')}
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

      {/* Archdeaconry Selection */}
      {selectedDiocese && (
        <FormControl fullWidth size="small">
          <InputLabel>Select Archdeaconry</InputLabel>
          <Select
            value={selectedArchdeaconry}
            onChange={(e) => {
              setSelectedArchdeaconry(e.target.value as number | '')
              setPage(0)
            }}
            label="Select Archdeaconry"
            disabled={archdeaconries.length === 0}
          >
            <MenuItem value="">-- No Archdeaconry Selected --</MenuItem>
            {archdeaconries.map((archdeaconry) => (
              <MenuItem key={archdeaconry.id} value={archdeaconry.id}>
                {archdeaconry.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedArchdeaconry && (
        <DataTable<ChurchResponse>
          columns={columns}
          rows={churches}
          loading={loading}
          empty={churches.length === 0 && !loading}
          emptyMessage="No churches found for this archdeaconry."
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
                setFormData({ archdeaconryId: selectedArchdeaconry, name: '', code: '' })
                setFormOpen(true)
              }}
            >
              New Church
            </Button>
          }
        />
      )}

      {(!selectedDiocese || !selectedArchdeaconry) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          {!selectedDiocese ? 'Select a diocese' : 'Select an archdeaconry'} to view churches
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => !formLoading && setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Church' : 'Create Church'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth disabled={formLoading}>
            <InputLabel>Archdeaconry</InputLabel>
            <Select
              value={formData.archdeaconryId}
              onChange={(e) => setFormData({ ...formData, archdeaconryId: e.target.value as number })}
              label="Archdeaconry"
              required
            >
              <MenuItem value="">-- Select Archdeaconry --</MenuItem>
              {archdeaconries.map((archdeaconry) => (
                <MenuItem key={archdeaconry.id} value={archdeaconry.id}>
                  {archdeaconry.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Church Name"
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
        title="Delete Church"
        message="Are you sure you want to delete this church? This action cannot be undone."
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

export default ChurchPage
