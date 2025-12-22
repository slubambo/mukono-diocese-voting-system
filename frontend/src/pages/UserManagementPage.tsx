import React, { useEffect, useState } from 'react'
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
  Typography,
  Box,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import BlockIcon from '@mui/icons-material/Block'
import CheckIcon from '@mui/icons-material/Check'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/feedback/ToastProvider'
import PageLayout from '../components/layout/PageLayout'
import AppShell from '../components/layout/AppShell'
import MasterDataHeader from '../components/common/MasterDataHeader'
import LoadingState from '../components/common/LoadingState'
import EmptyState from '../components/common/EmptyState'
import { userApi } from '../api/user.api'
import type { User, CreateUserRequest, UpdateUserRequest } from '../types/user'
import { useForm, Controller } from 'react-hook-form'

type FormValues = CreateUserRequest & { roles?: string[] }

const UserManagementPage: React.FC = () => {
  const { user } = useAuth()
  const { addToast: showToast } = useToast()
  const isAdmin = user?.roles.includes('ROLE_ADMIN') || false

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [rolesOptions, setRolesOptions] = useState<string[]>([])

  // Search with debounce
  const [search, setSearch] = useState('')

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'delete' | 'deactivate' | 'activate' | 'reset' | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null)
  const [resetNewPassword, setResetNewPassword] = useState<string>('')

  const { control, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { username: '', email: '', password: '', displayName: '', roles: [] } })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const resp = await userApi.list({ page, size: rowsPerPage, username: search || undefined, email: search || undefined })
      setUsers(resp.content)
      setTotal(resp.totalElements)
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [page, rowsPerPage, search])

  // debounce query -> search
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  // fetch roles options from backend if available
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await userApi.listRoles()
        if (mounted) setRolesOptions((r || []).filter(Boolean))
      } catch (e) {
        // fallback to sensible defaults
        if (mounted) setRolesOptions(['ROLE_ADMIN', 'ROLE_DS', 'ROLE_POLLING_OFFICER', 'ROLE_VOTER'])
      }
    })()
    return () => { mounted = false }
  }, [])

  const formatRoleLabel = (role: string) => {
    if (!role) return ''
    const r = role.replace(/^ROLE_/, '')
    return r.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ')
  }

  const openCreate = () => { setEditing(null); reset({ username: '', email: '', password: '', displayName: '', roles: [] }); setDialogOpen(true) }
  const openEdit = (u: User) => { setEditing(u); reset({ username: u.username, email: u.email || '', password: '', displayName: u.displayName || '', roles: u.roles || [] }); setDialogOpen(true) }

  const onSubmit = async (data: FormValues) => {
    try {
      if (editing) {
        const payload: UpdateUserRequest = { email: data.email, displayName: data.displayName, roles: data.roles }
        await userApi.update(editing.id, payload)
        showToast('User updated', 'success')
      } else {
        await userApi.create({ username: data.username, email: data.email, password: data.password, displayName: data.displayName, roles: data.roles })
        showToast('User created', 'success')
      }
      setDialogOpen(false)
      fetchUsers()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to save user', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id)
      showToast('User deleted', 'success')
      fetchUsers()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to delete user', 'error')
    }
  }

  const handleDeactivate = async (id: number) => {
    try {
      await userApi.deactivate(id)
      showToast('User deactivated', 'success')
      fetchUsers()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to deactivate user', 'error')
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await userApi.activate(id)
      showToast('User activated', 'success')
      fetchUsers()
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to activate user', 'error')
    }
  }

  const handleResetPassword = async (id: number, newPassword?: string) => {
    try {
      await userApi.resetPassword(id, newPassword)
      showToast('Password reset requested', 'success')
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to reset password', 'error')
    }
  }

  const openConfirm = (action: 'delete' | 'deactivate' | 'activate' | 'reset', target: User) => {
    setConfirmAction(action)
    setConfirmTarget(target)
    setResetNewPassword('')
    setConfirmOpen(true)
  }

  const confirmExecute = async () => {
    if (!confirmAction || !confirmTarget) return
    const id = confirmTarget.id
    setConfirmOpen(false)
    switch (confirmAction) {
      case 'delete':
        await handleDelete(id)
        break
      case 'deactivate':
        await handleDeactivate(id)
        break
      case 'activate':
        await handleActivate(id)
        break
      case 'reset':
        await handleResetPassword(id, resetNewPassword || undefined)
        break
    }
  }

  return (
    <AppShell>
      <PageLayout title="User Management">
        <MasterDataHeader
          title="User Management"
          subtitle="Manage application users and their access."
          onAddClick={isAdmin ? openCreate : undefined}
          addButtonLabel="Create User"
          isAdmin={isAdmin}
          filters={[{ id: 'search', label: 'Search', value: query, placeholder: 'Search by username or email', onChange: (v: any) => { setQuery(v as string); setPage(0) } }]}
        />

        <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
          {loading ? (
            <LoadingState count={5} variant="row" />
          ) : users.length === 0 ? (
            <EmptyState title="No users" description={isAdmin ? 'Create your first user.' : 'No users found.'} action={isAdmin ? <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Create User</Button> : undefined} />
          ) : (
            <>
              <TableContainer>
                <Table sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.08)', fontWeight: 700 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Display Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Roles</TableCell>
                      <TableCell>Status</TableCell>
                      {isAdmin && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>{u.displayName}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.roles.map(r => <Chip key={r} label={formatRoleLabel(r)} size="small" sx={{ mr: 0.5 }} />)}</TableCell>
                        <TableCell>{u.active ? <Chip label="Active" color="success" /> : <Chip label="Inactive" color="default" />}</TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <Button size="small" onClick={() => openEdit(u)} sx={{ mr: 1 }}>Edit</Button>
                            <Tooltip title="Reset Password">
                              <IconButton size="small" onClick={() => openConfirm('reset', u)}><RefreshIcon fontSize="small"/></IconButton>
                            </Tooltip>
                            {u.active ? (
                              <Tooltip title="Deactivate">
                                <IconButton size="small" onClick={() => openConfirm('deactivate', u)}><BlockIcon fontSize="small"/></IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Activate">
                                <IconButton size="small" onClick={() => openConfirm('activate', u)}><CheckIcon fontSize="small"/></IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => openConfirm('delete', u)} color="error"><DeleteIcon fontSize="small"/></IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination rowsPerPageOptions={[10,20,50]} component="div" count={total} rowsPerPage={rowsPerPage} page={page} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }} />
            </>
          )}
        </Paper>

        {/* Confirm Dialog for delete/activate/deactivate/reset */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{confirmAction === 'delete' ? 'Delete User' : confirmAction === 'reset' ? 'Reset Password' : confirmAction === 'deactivate' ? 'Deactivate User' : 'Activate User'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography>{confirmTarget ? `Are you sure you want to ${confirmAction} user '${confirmTarget.username}'?` : ''}</Typography>
              {confirmAction === 'reset' && (
                <TextField label="New password (optional)" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} placeholder="Leave blank to use default" fullWidth />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={confirmExecute} variant="contained" color={confirmAction === 'delete' ? 'error' : 'primary'}>Confirm</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!editing && (
                <Controller name="username" control={control} rules={{ required: 'Username is required' }} render={({ field, fieldState }) => (
                  <TextField {...field} label="Username" required error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
              )}

              <Controller name="email" control={control} render={({ field }) => (
                <TextField {...field} label="Email" type="email" fullWidth />
              )} />

              {!editing && (
                <Controller name="password" control={control} rules={{ required: 'Password is required' }} render={({ field, fieldState }) => (
                  <TextField {...field} label="Password" type="password" required error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth />
                )} />
              )}

              <Controller name="displayName" control={control} render={({ field }) => (
                <TextField {...field} label="Display Name" fullWidth />
              )} />

              <Controller name="roles" control={control} render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="roles-label">Roles</InputLabel>
                  <Select
                    labelId="roles-label"
                    multiple
                    value={field.value || []}
                    onChange={(e) => field.onChange(e.target.value as string[])}
                    input={<OutlinedInput label="Roles" />}
                    renderValue={(selected) => (selected as string[]).map(s => <Chip key={s} label={formatRoleLabel(s)} size="small" sx={{ mr: 0.5 }} />)}
                  >
                      {rolesOptions.map((r) => (
                        <MenuItem key={r} value={r}>
                          <Checkbox checked={(field.value || []).indexOf(r) > -1} />
                          <ListItemText primary={formatRoleLabel(r)} />
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )} />

            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained">{editing ? 'Save' : 'Create'}</Button>
          </DialogActions>
        </Dialog>

      </PageLayout>
    </AppShell>
  )
}

export default UserManagementPage
