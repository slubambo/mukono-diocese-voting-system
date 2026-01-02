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
  TableSortLabel,
  Chip,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import CancelIcon from '@mui/icons-material/Cancel'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import LoadingState from '../components/common/LoadingState'
import EmptyState from '../components/common/EmptyState'
import StatusChip from '../components/common/StatusChip'
import MasterDataHeader from '../components/common/MasterDataHeader'
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
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sort, setSort] = useState('name,asc')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Election | null>(null)
  const [canceling, setCanceling] = useState<Election | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [closingElectionId, setClosingElectionId] = useState<string | number | null>(null)
  const [openPeriodMap, setOpenPeriodMap] = useState<Record<string, 'loading' | 'open' | 'none'>>({})

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(timer)
  }, [query])

  const sortOptions = [
    { id: 'name,asc', name: 'Name (A-Z)' },
    { id: 'name,desc', name: 'Name (Z-A)' },
    { id: 'status,asc', name: 'Status (A-Z)' },
    { id: 'status,desc', name: 'Status (Z-A)' },
    { id: 'termStartDate,asc', name: 'Term Start (Earliest)' },
    { id: 'termStartDate,desc', name: 'Term Start (Latest)' },
  ]

  const getSortDirection = (column: 'name' | 'status' | 'termStartDate') => {
    if (sort.startsWith(`${column},`)) return sort.endsWith('asc') ? 'asc' : 'desc'
    return false
  }

  const toggleSort = (column: 'name' | 'status' | 'termStartDate') => {
    const direction = getSortDirection(column)
    if (!direction) {
      setSort(`${column},asc`)
    } else if (direction === 'asc') {
      setSort(`${column},desc`)
    } else {
      setSort(`${column},asc`)
    }
    setPage(0)
  }

  const displayElections = useMemo(() => {
    const safeText = (value?: string | null) => (value || '').toLowerCase()
    const toTimestamp = (value?: string | null) => {
      if (!value) return null
      const time = new Date(value).getTime()
      return Number.isNaN(time) ? null : time
    }

    return [...elections].sort((a, b) => {
      switch (sort) {
        case 'name,asc':
          return safeText(a.name).localeCompare(safeText(b.name))
        case 'name,desc':
          return safeText(b.name).localeCompare(safeText(a.name))
        case 'status,asc':
          return safeText(a.status).localeCompare(safeText(b.status))
        case 'status,desc':
          return safeText(b.status).localeCompare(safeText(a.status))
        case 'termStartDate,asc': {
          const aTime = toTimestamp(a.termStartDate)
          const bTime = toTimestamp(b.termStartDate)
          if (aTime === null && bTime === null) return 0
          if (aTime === null) return 1
          if (bTime === null) return -1
          return aTime - bTime
        }
        case 'termStartDate,desc': {
          const aTime = toTimestamp(a.termStartDate)
          const bTime = toTimestamp(b.termStartDate)
          if (aTime === null && bTime === null) return 0
          if (aTime === null) return 1
          if (bTime === null) return -1
          return bTime - aTime
        }
        default:
          return 0
      }
    })
  }, [elections, sort])

  const calcDays = (start?: string, end?: string): number | null => {
    if (!start || !end) return null
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    if (Number.isNaN(s) || Number.isNaN(e)) return null
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24))
  }

  const fetchElections = async () => {
    setLoading(true)
    try {
      const params = { page, size, sort, q: debouncedQuery }
      const res = await electionApi.list(params as any)
      setElections(res.content || [])
      setTotal(res.totalElements || 0)

      // Preload whether each election has an open voting period to inform close button state.
      const statusMap: Record<string, 'loading' | 'open' | 'none'> = {}
      const electionsList = res.content || []
      await Promise.all(
        electionsList.map(async (el: any) => {
          const key = String(el.id)
          statusMap[key] = 'loading'
          try {
            const periods = await electionApi.listVotingPeriods(el.id)
            const items = (periods as any)?.content ?? periods ?? []
            const hasOpen = (items as any[]).some((p) => (p.status || '').toUpperCase() === 'OPEN')
            statusMap[key] = hasOpen ? 'open' : 'none'
          } catch (err) {
            statusMap[key] = 'none'
          }
        })
      )
      setOpenPeriodMap(statusMap)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load elections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sort, debouncedQuery])

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

  const handleCloseVotingPeriod = async (election: Election) => {
    setClosingElectionId(election.id)
    try {
      const res = await electionApi.listVotingPeriods(election.id)
      const periods = (res as any)?.content ?? res ?? []
      const openPeriod = (periods as any[]).find((p) => (p.status || '').toUpperCase() === 'OPEN')
      if (!openPeriod) {
        toast.info('No open voting period to close for this election')
        return
      }
      await electionApi.closeVotingPeriod(election.id, openPeriod.id)
      toast.success(`Closed voting period ${openPeriod.name || openPeriod.label || openPeriod.id}`)
      fetchElections()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to close voting period')
    } finally {
      setClosingElectionId(null)
    }
  }

  return (
    <AppShell>
      <PageLayout title="Elections">
        <MasterDataHeader
          title="Elections"
          subtitle="Create and manage elections and their configuration timeline."
          onAddClick={isAdmin ? () => { setEditing(null); setShowForm(true) } : undefined}
          addButtonLabel="Create Election"
          isAdmin={isAdmin}
          filters={[
            {
              id: 'search',
              label: 'Search',
              value: query,
              placeholder: 'Search by name',
              onChange: (v: any) => { setQuery(v as string); setPage(0) },
            },
            {
              id: 'sort',
              label: 'Sort by',
              value: sort,
              options: sortOptions,
              onChange: (value) => {
                setSort(value as string)
                setPage(0)
              },
              placeholder: 'Sort by',
            },
          ]}
        />

        {loading ? (
          <LoadingState />
        ) : elections.length === 0 ? (
          <EmptyState title="No elections" description="There are no elections to display." action={isAdmin ? <Button onClick={() => { setEditing(null); setShowForm(true) }}>Create Election</Button> : undefined} />
        ) : (
          <Paper sx={{ width: '100%', mb: 2, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
            <TableContainer>
              <Table size="small" sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.08)', fontWeight: 700 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sortDirection={getSortDirection('name') || false}>
                      <TableSortLabel
                        active={Boolean(getSortDirection('name'))}
                        direction={(getSortDirection('name') as any) || 'asc'}
                        onClick={() => toggleSort('name')}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={getSortDirection('status') || false}>
                      <TableSortLabel
                        active={Boolean(getSortDirection('status'))}
                        direction={(getSortDirection('status') as any) || 'asc'}
                        onClick={() => toggleSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Fellowship</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Term Duration</TableCell>
                    <TableCell>Voting Dates</TableCell>
                    <TableCell>Voting Days</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayElections.map((e) => {
                    const votingDays = calcDays(e.votingStartAt, e.votingEndAt)
                    return (
                      <TableRow key={e.id} hover>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{e.name}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={e.status || 'PENDING'}
                            size="small"
                            color={e.status === 'ACTIVE' ? 'success' : e.status === 'CANCELLED' ? 'error' : 'default'}
                            variant={e.status === 'DRAFT' ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                        <TableCell>{e.scope || '—'}</TableCell>
                        <TableCell>{e.fellowshipName || 'All'}</TableCell>
                        <TableCell>
                          {(() => {
                            if (e.scope === 'DIOCESE') return e.dioceseId ? `Diocese #${e.dioceseId}` : '—'
                            if (e.scope === 'ARCHDEACONRY') return e.archdeaconryId ? `Archd. #${e.archdeaconryId}` : '—'
                            if (e.scope === 'CHURCH') return e.churchId ? `Church #${e.churchId}` : '—'
                            return '—'
                          })()}
                        </TableCell>
                        <TableCell>
                          {e.termStartDate && e.termEndDate
                            ? `${new Date(e.termStartDate).toLocaleDateString()} – ${new Date(e.termEndDate).toLocaleDateString()}`
                            : e.termStartDate
                              ? new Date(e.termStartDate).toLocaleDateString()
                              : '—'}
                        </TableCell>
                        <TableCell>
                          {e.votingStartAt && e.votingEndAt
                            ? `${new Date(e.votingStartAt).toLocaleDateString()} – ${new Date(e.votingEndAt).toLocaleDateString()}`
                            : e.votingStartAt
                              ? new Date(e.votingStartAt).toLocaleDateString()
                              : '—'}
                        </TableCell>
                        <TableCell>{votingDays !== null ? `${votingDays} days` : '—'}</TableCell>
                        {isAdmin && (
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title="View details">
                              <span>
                                <IconButton onClick={() => handleView(e.id)} size="small" color="primary"><VisibilityIcon fontSize="small" /></IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={e.status !== 'DRAFT' ? 'Only draft elections can be edited' : 'Edit'}>
                              <span>
                                <IconButton onClick={() => handleEdit(e)} size="small" color="primary" disabled={e.status !== 'DRAFT'}><EditIcon fontSize="small" /></IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={e.status !== 'DRAFT' ? 'Only draft elections can be cancelled' : 'Cancel'}>
                              <span>
                                <IconButton onClick={() => handleCancel(e)} size="small" color="warning" disabled={e.status !== 'DRAFT'}><CancelIcon fontSize="small" /></IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={
                                openPeriodMap[String(e.id)] === 'none'
                                  ? 'No open voting period to close'
                                  : 'Close the current open voting period'
                              }
                            >
                              <span>
                                <IconButton
                                  onClick={() => handleCloseVotingPeriod(e)}
                                  size="small"
                                  color="error"
                                  disabled={closingElectionId === e.id || openPeriodMap[String(e.id)] === 'none'}
                                >
                                  <StopCircleIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
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
