import React, { useState, useEffect } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Chip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FellowshipResponse, CreateFellowshipRequest, UpdateFellowshipRequest, orgApi } from '@/api/org.api'
import { useToast } from '@/hooks/useToast'

interface FellowshipFormData {
  name: string
  code: string
}

export const FellowshipPage: React.FC = () => {
  const { showToast } = useToast()
  const [fellowships, setFellowships] = useState<FellowshipResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FellowshipFormData>({ name: '', code: '' })
  const [formLoading, setFormLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch fellowships
  const fetchFellowships = async () => {
    try {
      setLoading(true)
      const response = await orgApi.listFellowships({
        q: searchValue,
        page,
        size: pageSize,
      })
      setFellowships(response.data.content)
      setTotalCount(response.data.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to fetch fellowships', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFellowships()
  }, [page, pageSize, searchValue])

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('Fellowship name is required', 'error')
      return
    }

    try {
      setFormLoading(true)
      if (editingId) {
        const payload: UpdateFellowshipRequest = {
          name: formData.name,
          code: formData.code || undefined,
        }
        await orgApi.updateFellowship(editingId, payload)
        showToast('Fellowship updated successfully', 'success')
      } else {
        const payload: CreateFellowshipRequest = {
          name: formData.name,
          code: formData.code || undefined,
        }
        await orgApi.createFellowship(payload)
        showToast('Fellowship created successfully', 'success')
      }
      setFormOpen(false)
      setFormData({ name: '', code: '' })
      setEditingId(null)
      setPage(0)
      await fetchFellowships()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save fellowship', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (fellowship: FellowshipResponse) => {
    setEditingId(fellowship.id)
    setFormData({
      name: fellowship.name,
      code: fellowship.code || '',
    })
    setFormOpen(true)
  }

  // Handle delete
  const handleDeleteClick = (fellowship: FellowshipResponse) => {
    setDeleteId(fellowship.id)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return

    try {
      setFormLoading(true)
      await orgApi.deleteFellowship(deleteId)
      showToast('Fellowship deleted successfully', 'success')
      setConfirmOpen(false)
      setDeleteId(null)
      setPage(0)
      await fetchFellowships()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete fellowship', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const columns: DataTableColumn<FellowshipResponse>[] = [
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
      <DataTable<FellowshipResponse>
        columns={columns}
        rows={fellowships}
        loading={loading}
        empty={fellowships.length === 0 && !loading}
        emptyMessage="No fellowships found. Create one to get started."
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
            New Fellowship
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => !formLoading && setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Fellowship' : 'Create Fellowship'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Fellowship Name"
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
        title="Delete Fellowship"
        message="Are you sure you want to delete this fellowship? This action cannot be undone."
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

export default FellowshipPage
