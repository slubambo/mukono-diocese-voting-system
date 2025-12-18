import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  TablePagination,
  Toolbar,
  TextField,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

export interface DataTableColumn<T> {
  key: keyof T
  label: string
  width?: string
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  searchable?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  getRowId: (row: T) => string | number
  toolbar?: React.ReactNode
}

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any>>(
  (
    {
      columns,
      rows,
      loading = false,
      empty = false,
      emptyMessage = 'No records found',
      page,
      pageSize,
      totalCount,
      onPageChange,
      onPageSizeChange,
      onEdit,
      onDelete,
      searchable = false,
      searchValue = '',
      onSearchChange,
      getRowId,
      toolbar,
    },
    ref,
  ) => {
    const handleChangePage = (event: unknown, newPage: number) => {
      onPageChange(newPage)
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
      onPageSizeChange(parseInt(event.target.value, 10))
    }

    return (
      <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column' }}>
        {(searchable || toolbar) && (
          <Toolbar
            sx={{
              pl: { xs: 2, sm: 3 },
              pr: { xs: 1, sm: 2 },
              display: 'flex',
              gap: 2,
            }}
          >
            {searchable && (
              <TextField
                size="small"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
            )}
            {toolbar}
          </Toolbar>
        )}

        <TableContainer component={Paper} sx={{ flex: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          ) : empty || rows.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, p: 2 }}>
              <Typography color="textSecondary">{emptyMessage}</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} sx={{ width: col.width, fontWeight: 600 }}>
                      {col.label}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={getRowId(row)} hover>
                    {columns.map((col) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const value = (row as any)[col.key]
                      return (
                        <TableCell key={`${getRowId(row)}-${String(col.key)}`}>
                          {col.render ? col.render(value, row) : value}
                        </TableCell>
                      )
                    })}
                    {(onEdit || onDelete) && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {onEdit && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onEdit(row)}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {onDelete && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(row)}
                              title="Delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    )
  },
)

DataTable.displayName = 'DataTable'
