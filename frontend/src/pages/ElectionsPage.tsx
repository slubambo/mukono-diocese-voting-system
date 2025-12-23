import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TablePagination,
  TextField,
  Tooltip,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import CancelIcon from '@mui/icons-material/Cancel'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import LoadingState from '../components/common/LoadingState'
import EmptyState from '../components/common/EmptyState'
import StatusChip from '../components/common/StatusChip'
import { useAuth } from '../context/AuthContext'
import { electionApi } from '../api/election.api'
import ElectionForm from '../components/elections/ElectionForm'
import { useToast } from '../components/feedback/ToastProvider'
import type { Election } from '../types/election'

const ElectionsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const isAdmin = useMemo(() => user?.roles?.includes('ROLE_ADMIN'), [user])

  const [loading, setLoading] = useState(false)
  const [elections, setElections] = useState<Election[]>([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [sort] = useState('name,asc')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Election | null>(null)
  const [canceling, setCanceling] = useState<Election | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const fetchElections = async () => {
    setLoading(true)
    try {
      const params = { page, size, sort, q: query }
      const res = await electionApi.list(params as any)
      setElections(res.content || [])
      setTotal(res.totalElements || 0)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load elections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sort])

  const handleView = (id: string | number) => {
    const base = isAdmin ? '/admin' : '/ds'
    navigate(`${base}/elections/${String(id)}`)
  }

  const handleEdit = (e: Election) => {
    const loadElection = async () => {
      try {
        const res = await electionApi.get(String(e.id))
        setEditing(res)
        setShowForm(true)
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load election')
      }
    }
    loadElection()
  }

  const handleCancel = (e: Election) => {
    setCancelReason('')
    setCanceling(e)
  }

  const submitCancel = async () => {
    if (!canceling) return
    if (!cancelReason.trim()) {
      toast.error('Cancellation reason is required')
      return
    }
    try {
      await electionApi.cancel(canceling.id, { reason: cancelReason.trim() })
      toast.success('Election cancelled')
      setCanceling(null)
      setCancelReason('')
      fetchElections()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel election')
    }
  }

  return (
    <AppShell>
      <PageLayout
        title="Elections"
        subtitle="Create and manage elections and their configuration timeline."
        actions={isAdmin ? <Button variant="contained" onClick={() => { setEditing(null); setShowForm(true) }}>Create Election</Button> : null}
      >
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') { setPage(0); fetchElections() } }} />
            <Button onClick={() => { setPage(0); fetchElections() }}>Search</Button>
          </Box>
        </Paper>

        {loading ? (
          <LoadingState />
        ) : elections.length === 0 ? (
          <EmptyState title="No elections" description="There are no elections to display." action={isAdmin ? <Button onClick={() => { setEditing(null); setShowForm(true) }}>Create Election</Button> : undefined} />
        ) : (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Fellowship</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell>Voting</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {elections.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell>{e.name}</TableCell>
                      <TableCell><StatusChip status={(e.status || 'pending') as any} /></TableCell>
                      <TableCell>{e.scope || '—'}</TableCell>
                      <TableCell>{e.fellowshipName || 'All fellowships'}</TableCell>
                      <TableCell>
                        {(() => {
                          if (e.scope === 'DIOCESE') return e.dioceseId ? `Diocese #${e.dioceseId}` : '—'
                          if (e.scope === 'ARCHDEACONRY') return e.archdeaconryId ? `Archdeaconry #${e.archdeaconryId}` : '—'
                          if (e.scope === 'CHURCH') return e.churchId ? `Church #${e.churchId}` : '—'
                          return '—'
                        })()}
                      </TableCell>
                      <TableCell>
                        {e.termStartDate && e.termEndDate
                          ? `${new Date(e.termStartDate).toLocaleDateString()} — ${new Date(e.termEndDate).toLocaleDateString()}`
                          : e.termStartDate
                            ? new Date(e.termStartDate).toLocaleDateString()
                            : '—'}
                      </TableCell>
                      <TableCell>
                        {e.votingStartAt && e.votingEndAt
                          ? `${new Date(e.votingStartAt).toLocaleDateString()} — ${new Date(e.votingEndAt).toLocaleDateString()}`
                          : e.votingStartAt
                            ? new Date(e.votingStartAt).toLocaleDateString()
                            : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View details">
                          <span>
                            <IconButton onClick={() => handleView(e.id)} size="small"><VisibilityIcon /></IconButton>
                          </span>
                        </Tooltip>
                        {isAdmin && (
                          <>
                            <Tooltip title={e.status !== 'DRAFT' ? 'Only draft elections can be edited' : 'Edit'}>
                              <span>
                                <IconButton onClick={() => handleEdit(e)} size="small" disabled={e.status !== 'DRAFT'}><EditIcon /></IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={e.status !== 'DRAFT' ? 'Only draft elections can be cancelled' : 'Cancel'}>
                              <span>
                                <IconButton onClick={() => handleCancel(e)} size="small" disabled={e.status !== 'DRAFT'}><CancelIcon /></IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={size} onRowsPerPageChange={(e) => { setSize(Number(e.target.value)); setPage(0) }} />
          </Paper>
        )}

        <ElectionForm open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} onSaved={() => { setShowForm(false); setEditing(null); fetchElections() }} election={editing || undefined} />

        <Dialog open={Boolean(canceling)} onClose={() => setCanceling(null)} fullWidth maxWidth="sm">
          <DialogTitle>Cancel Election</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <TextField
                label="Reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
                multiline
                minRows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCanceling(null)}>Close</Button>
            <Button variant="contained" color="error" onClick={submitCancel}>Cancel Election</Button>
          </DialogActions>
        </Dialog>
      </PageLayout>
    </AppShell>
  )
}

export default ElectionsPage
