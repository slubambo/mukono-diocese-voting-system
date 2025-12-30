import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { eligibleVotersApi } from '../../api/eligibleVoters.api'
import type { EligibleVoterResponse, EligibleVoterStatus } from '../../types/eligibility'
import { useToast } from '../feedback/ToastProvider'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import StatusChip from '../common/StatusChip'

interface Props {
  electionId: number | string
  votingPeriodId: number | string
}

type StatusFilter = Exclude<EligibleVoterStatus, 'ALL'> | 'ALL'

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const EligibleVotersTab: React.FC<Props> = ({ electionId, votingPeriodId }) => {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<EligibleVoterResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState<{ total: number; voted: number; notVoted: number }>({ total: 0, voted: 0, notVoted: 0 })
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const debouncedSearch = useMemo(() => search.trim(), [search])

  const fetchCounts = async () => {
    try {
      const [totalRes, votedRes, notVotedRes] = await Promise.all([
        eligibleVotersApi.count(electionId, votingPeriodId),
        eligibleVotersApi.count(electionId, votingPeriodId, 'VOTED'),
        eligibleVotersApi.count(electionId, votingPeriodId, 'NOT_VOTED'),
      ])
      setCounts({
        total: totalRes.count ?? 0,
        voted: votedRes.count ?? 0,
        notVoted: notVotedRes.count ?? 0,
      })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load eligible voter counts')
      setCounts({ total: 0, voted: 0, notVoted: 0 })
    }
  }

  const fetchRows = async () => {
    setLoading(true)
    try {
      const res = await eligibleVotersApi.list(electionId, votingPeriodId, {
        page,
        size,
        sort: 'fullName,asc',
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        q: debouncedSearch || undefined,
      })
      const content = res.content || []
      setRows(content)
      setTotal(res.totalElements || content.length)
      setLastRefreshed(new Date())
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load eligible voters')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, votingPeriodId])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRows()
    }, 200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, votingPeriodId, page, size, statusFilter, debouncedSearch])

  const voteLabel = (row: EligibleVoterResponse) => {
    if (row.voted) {
      return `Voted${row.voteCastAt ? ` · ${formatDate(row.voteCastAt)}` : ''}`
    }
    return 'Not voted'
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ display: 'grid' }}>
            <Typography variant="caption" color="text.secondary">Eligible voters</Typography>
            <Typography variant="h5">{counts.total}</Typography>
          </Box>
          <Box sx={{ display: 'grid' }}>
            <Typography variant="caption" color="text.secondary">Voted</Typography>
            <Typography variant="h5">{counts.voted}</Typography>
          </Box>
          <Box sx={{ display: 'grid' }}>
            <Typography variant="caption" color="text.secondary">Not voted</Typography>
            <Typography variant="h5">{counts.notVoted}</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Refresh counts and list">
            <span>
              <Button startIcon={<RefreshIcon />} onClick={() => { fetchCounts(); fetchRows() }} disabled={loading}>
                Refresh
              </Button>
            </span>
          </Tooltip>
          {lastRefreshed && (
            <Typography variant="caption" color="text.secondary">
              Updated {lastRefreshed.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            SelectProps={{ native: true }}
            label="Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(0) }}
            sx={{ minWidth: 180 }}
          >
            <option value="ALL">All</option>
            <option value="VOTED">Voted</option>
            <option value="NOT_VOTED">Not voted</option>
          </TextField>
          <TextField
            label="Search name or contact"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Type to search"
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
            sx={{ minWidth: 280, flex: 1 }}
            helperText="Server-side search; leave blank to see all"
          />
          <Tooltip title="Clear filters">
            <span>
              <IconButton onClick={() => { setStatusFilter('ALL'); setSearch(''); setPage(0) }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {loading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No eligible voters"
            description="No voters found for this voting period and filters."
            action={<Button onClick={fetchRows}>Reload</Button>}
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Person</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Fellowship</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Vote Status</TableCell>
                    <TableCell>Last Code</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.personId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography>{row.fullName}</Typography>
                          <Chip size="small" label={`ID: ${row.personId}`} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'grid' }}>
                          <Typography variant="body2">{row.phoneNumber || '—'}</Typography>
                          <Typography variant="body2" color="text.secondary">{row.email || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{row.fellowshipName || '—'}</TableCell>
                      <TableCell>
                        {row.scopeName || row.scope || '—'}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={row.voted ? 'ACTIVE' : 'inactive'} label={voteLabel(row)} />
                        {row.voteCastAt && <Typography variant="caption" color="text.secondary">{formatDate(row.voteCastAt)}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'grid' }}>
                          <StatusChip status={(row.lastCodeStatus as any) || 'inactive'} label={row.lastCodeStatus || '—'} />
                          <Typography variant="caption" color="text.secondary">Issued: {formatDate(row.lastCodeIssuedAt)}</Typography>
                          <Typography variant="caption" color="text.secondary">Used: {formatDate(row.lastCodeUsedAt)}</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={size}
              onRowsPerPageChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
            />
          </>
        )}
      </Paper>
    </Box>
  )
}

export default EligibleVotersTab
