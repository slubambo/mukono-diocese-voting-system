import React, { useState, useEffect } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Chip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DataTable, DataTableColumn } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PositionTitleResponse, CreatePositionTitleRequest, UpdatePositionTitleRequest, masterDataApi } from '@/api/master-data.api'
import { useToast } from '@/hooks/useToast'

interface PositionTitleFormData {
  name: string
}

export const PositionTitlePage: React.FC = () => {
  const { showToast } = useToast()
  const [titles, setTitles] = useState<PositionTitleResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<PositionTitleFormData>({ name: '' })
  const [formLoading, setFormLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch position titles
  const fetchTitles = async () => {
    try {
      setLoading(true)
      const response = await masterDataApi.listPositionTitles({
        q: searchValue,
        page,
        size: pageSize,
      })
      setTitles(response.data.content)
      setTotalCount(response.data.totalElements)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to fetch position titles', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTitles()
  }, [page, pageSize, searchValue])

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('Position title name is required', 'error')
      return
    }

    try {
      setFormLoading(true)
      if (editingId) {
        const payload: UpdatePositionTitleRequest = {
          name: formData.name,
        }
        await masterDataApi.updatePositionTitle(editingId, payload)
        showToast('Position title updated successfully', 'success')
      } else {
        const payload: CreatePositionTitleRequest = {
          name: formData.name,
        }
        await masterDataApi.createPositionTitle(payload)
        showToast('Position title created successfully', 'success')
      }
      setFormOpen(false)
      setFormData({ name: '' })
      setEditingId(null)
      setPage(0)
      await fetchTitles()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save position title', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (title: PositionTitleResponse) => {
    setEditingId(title.id)
    setFormData({
      name: title.name,
    })
    setFormOpen(true)
  }

  // Handle delete
  const handleDeleteClick = (title: PositionTitleResponse) => {
    setDeleteId(title.id)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return

    try {
      setFormLoading(true)
      await masterDataApi.deletePositionTitle(deleteId)
      showToast('Position title deleted successfully', 'success')
      setConfirmOpen(false)
      setDeleteId(null)
      setPage(0)
      await fetchTitles()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete position title', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const columns: DataTableColumn<PositionTitleResponse>[] = [
    {
      key: 'name',
      label: 'Title Name',
      width: '35%',
    },
    {
      key: 'status',
      label: 'Status',
      width: '20%',
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
      width: '25%',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ]

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DataTable<PositionTitleResponse>
        columns={columns}
        rows={titles}
        loading={loading}
        empty={titles.length === 0 && !loading}
        emptyMessage="No position titles found. Create one to get started."
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
              setFormData({ name: '' })
              setFormOpen(true)
            }}
          >
            New Position Title
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => !formLoading && setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Position Title' : 'Create Position Title'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Position Title Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={formLoading}
            autoFocus
            required
            placeholder="e.g., Chairperson, Secretary, Treasurer"
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
        title="Delete Position Title"
        message="Are you sure you want to delete this position title? This action cannot be undone."
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

export default PositionTitlePage
