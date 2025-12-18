import React, { useState, useEffect } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Chip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DioceseResponse, CreateDioceseRequest, UpdateDioceseRequest, orgApi } from '@/api/org.api'
import { useToast } from '@/hooks/useToast'

interface DioceseFormData {
  name: string
  code: string
}

export const DiocesePage: React.FC = () => {
  const { showToast } = useToast()
  const [dioceses, setDioceses] = useState<DioceseResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<DioceseFormData>({ name: '', code: '' })
  const [formLoading, setFormLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch dioceses
  const fetchDioceses = async () => {
    try {
      setLoading(true)
      const response = await orgApi.listDioceses({
        q: searchValue,
        page,
        size: pageSize,
      })
      setDioceses(response.data.content)
      setTotalCount(response.data.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to fetch dioceses', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDioceses()
  }, [page, pageSize, searchValue])

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('Diocese name is required', 'error')
      return
    }

    try {
      setFormLoading(true)
      if (editingId) {
        const payload: UpdateDioceseRequest = {
          name: formData.name,
          code: formData.code || undefined,
        }
        await orgApi.updateDiocese(editingId, payload)
        showToast('Diocese updated successfully', 'success')
      } else {
        const payload: CreateDioceseRequest = {
          name: formData.name,
          code: formData.code || undefined,
        }
        await orgApi.createDiocese(payload)
        showToast('Diocese created successfully', 'success')
      }
      setFormOpen(false)
      setFormData({ name: '', code: '' })
      setEditingId(null)
      setPage(0)
      await fetchDioceses()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save diocese', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (diocese: DioceseResponse) => {
    setEditingId(diocese.id)
    setFormData({
      name: diocese.name,
      code: diocese.code || '',
    })
    setFormOpen(true)
  }

  // Handle delete
  const handleDeleteClick = (diocese: DioceseResponse) => {
    setDeleteId(diocese.id)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return

    try {
      setFormLoading(true)
      await orgApi.deleteDiocese(deleteId)
      showToast('Diocese deleted successfully', 'success')
      setConfirmOpen(false)
      setDeleteId(null)
      setPage(0)
      await fetchDioceses()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete diocese', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const columns: DataTableColumn<DioceseResponse>[] = [
    {
      key: 'name',
      label: 'Name',
      width: '30%',
    },
    {
      key: 'code',
      label: 'Code',
      width: '20%',
      render: (value) => value || '-',
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
    {
      key: 'createdAt',
      label: 'Created',
      width: '20%',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ]

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DataTable<DioceseResponse>
        columns={columns}
        rows={dioceses}
        loading={loading}
        empty={dioceses.length === 0 && !loading}
        emptyMessage="No dioceses found. Create one to get started."
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
              setFormData({ name: '', code: '' })
              setFormOpen(true)
            }}
          >
            New Diocese
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => !formLoading && setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Diocese' : 'Create Diocese'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Diocese Name"
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
        title="Delete Diocese"
        message="Are you sure you want to delete this diocese? This action cannot be undone."
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

export default DiocesePage
