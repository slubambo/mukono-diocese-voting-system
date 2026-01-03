import React, { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import GroupIcon from '@mui/icons-material/Group'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { eligibleVotersApi } from '../../api/eligibleVoters.api'
import { codesApi } from '../../api/codes.api'
import { useToast } from '../feedback/ToastProvider'
import { getErrorMessage } from '../../api/errorHandler'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import StatusChip from '../common/StatusChip'
import type { EligibleVoterResponse } from '../../types/eligibility'
import type { VotingCodeResponse } from '../../types/eligibility'

interface Props {
  electionId: number | string
  votingPeriodId: number | string
  isAdmin: boolean
  votingPeriodStatus?: string
}

type VoteStatusFilter = 'ALL' | 'VOTED' | 'NOT_VOTED'
type SortField = 'fullName' | 'fellowshipName' | 'voted' | 'lastCodeStatus'
type SortDirection = 'asc' | 'desc'

interface VoterCodeRow extends EligibleVoterResponse {
  code?: VotingCodeResponse
  hasOverride?: boolean
}

const maskCode = (code?: string) => {
  if (!code) return '—'
  if (code.length <= 4) return '••••'
  const visible = code.slice(-4)
  return `••••••${visible}`
}

const UnifiedEligibleVotersCodesTab: React.FC<Props> = ({
  electionId,
  votingPeriodId,
  isAdmin,
  votingPeriodStatus,
}) => {
  const toast = useToast()

  // Voters and codes data
  const [voters, setVoters] = useState<VoterCodeRow[]>([])
  const [codes, setCodes] = useState<Map<number, VotingCodeResponse>>(new Map())
  const [overrides, setOverrides] = useState<Set<number>>(new Set())
  
  // Table state
  const [voteStatusFilter, setVoteStatusFilter] = useState<VoteStatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [sortField, setSortField] = useState<SortField>('fullName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [loading, setLoading] = useState(false)
  
  // Stats
  const [counts, setCounts] = useState<{ total: number; voted: number; notVoted: number }>({
    total: 0,
    voted: 0,
    notVoted: 0,
  })
  const [codeCounts, setCodeCounts] = useState<{ active: number; used: number; revoked: number }>({
    active: 0,
    used: 0,
    revoked: 0,
  })
  const [, setLastRefreshed] = useState<Date | null>(null)

  // Issue code state
  const [issuingFor, setIssuingFor] = useState<number | null>(null)
  const [issueResultDialog, setIssueResultDialog] = useState<{ code?: string; personName?: string; personId?: number } | null>(null)

  // Revoke/regenerate dialog
  const [reasonDialog, setReasonDialog] = useState<{ mode: 'regenerate' | 'revoke'; code: VotingCodeResponse } | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [reasonBusy, setReasonBusy] = useState(false)

  // Revealed codes
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  const debouncedSearch = useMemo(() => search.trim(), [search])

  // Load voter counts
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
      toast.error(getErrorMessage(err) || 'Failed to load counts')
    }
  }

  // Load code counts
  const fetchCodeCounts = async () => {
    try {
      const [activeRes, usedRes, revokedRes] = await Promise.all([
        codesApi.count(electionId, votingPeriodId, 'ACTIVE'),
        codesApi.count(electionId, votingPeriodId, 'USED'),
        codesApi.count(electionId, votingPeriodId, 'REVOKED'),
      ])
      setCodeCounts({
        active: activeRes.count ?? 0,
        used: usedRes.count ?? 0,
        revoked: revokedRes.count ?? 0,
      })
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to load code counts')
    }
  }

  // Load voters and codes
  const fetchVoters = async () => {
    setLoading(true)
    try {
      const votersRes = await eligibleVotersApi.list(electionId, votingPeriodId, {
        page,
        size,
        sort: `${sortField},${sortDirection}`,
        status: voteStatusFilter === 'ALL' ? undefined : voteStatusFilter,
        q: debouncedSearch || undefined,
      })
      const voterList = votersRes.content || []

      // Fetch codes for all voters
      const codesMap = new Map<number, VotingCodeResponse>()

      await Promise.all(
        voterList.map(async (voter) => {
          try {
            const codesRes = await codesApi.list(electionId, votingPeriodId, {
              page: 0,
              size: 1,
              sort: 'issuedAt,desc',
            } as any)
            // Filter codes by personId on client side if API doesn't support it
            const voterCode = codesRes.content?.find((c: any) => c.personId === voter.personId)
            if (voterCode) {
              codesMap.set(voter.personId, voterCode)
            }
          } catch {
            // ignore
          }
        })
      )

      setCodes(codesMap)
      setOverrides(new Set()) // Initialize empty for now - will be populated if needed
      setVoters(voterList)
      setTotal(votersRes.totalElements || voterList.length)
      setLastRefreshed(new Date())
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to load voters')
      setVoters([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()
    fetchCodeCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, votingPeriodId])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVoters()
    }, 200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, votingPeriodId, page, size, voteStatusFilter, sortField, sortDirection, debouncedSearch])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(0)
  }

  const handleIssueCode = async (personId: number, personName: string) => {
    if (!personId) {
      toast.error('Invalid person')
      return
    }
    setIssuingFor(personId)
    try {
      const res = await codesApi.issue(electionId, votingPeriodId, {
        personId,
        remarks: undefined,
      })
      setIssueResultDialog({
        code: res.code,
        personName,
        personId,
      })
      toast.success('Voting code issued')
      fetchCodeCounts()
      fetchVoters()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Unable to issue code')
    } finally {
      setIssuingFor(null)
    }
  }

  const handleCopyCode = async (code?: string) => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Code copied')
    } catch {
      toast.error('Failed to copy code')
    }
  }

  const handleRevoke = async () => {
    if (!reasonDialog || reasonDialog.mode !== 'revoke') return
    if (!reasonText.trim()) {
      toast.error('Reason is required')
      return
    }
    setReasonBusy(true)
    try {
      await codesApi.revoke(electionId, votingPeriodId, reasonDialog.code.id!, reasonText.trim())
      toast.success('Code revoked')
      setReasonDialog(null)
      fetchCodeCounts()
      fetchVoters()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to revoke code')
    } finally {
      setReasonBusy(false)
    }
  }

  const handleRegenerate = async () => {
    if (!reasonDialog || reasonDialog.mode !== 'regenerate') return
    if (!reasonText.trim()) {
      toast.error('Reason is required')
      return
    }
    setReasonBusy(true)
    try {
      const res = await codesApi.regenerate(electionId, votingPeriodId, {
        personId: reasonDialog.code.personId!,
        reason: reasonText.trim(),
      })
      setIssueResultDialog({
        code: res.code,
        personName: reasonDialog.code.personId ? `Person #${reasonDialog.code.personId}` : 'Unknown',
      })
      toast.success('Code regenerated')
      setReasonDialog(null)
      fetchCodeCounts()
      fetchVoters()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to regenerate code')
    } finally {
      setReasonBusy(false)
    }
  }

  const canIssue = isAdmin && votingPeriodStatus === 'OPEN'

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      {/* Stats Row with Colored Icons */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1.5 }}>
        <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <GroupIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Total Eligible
            </Typography>
            <Typography variant="h6" fontWeight="600">{counts.total}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
            <HowToVoteIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Voted
            </Typography>
            <Typography variant="h6" fontWeight="600">{counts.voted}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
            <PersonOffIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Not Voted
            </Typography>
            <Typography variant="h6" fontWeight="600">{counts.notVoted}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
            <VpnKeyIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Active Codes
            </Typography>
            <Typography variant="h6" fontWeight="600">{codeCounts.active}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
              <CheckCircleIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Used Codes
              </Typography>
              <Typography variant="h6" fontWeight="600">{codeCounts.used}</Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => { fetchCounts(); fetchCodeCounts(); fetchVoters() }} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      </Box>

      {/* Filters Section */}
      <Paper sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            select
            SelectProps={{ native: true }}
            label="Vote Status"
            value={voteStatusFilter}
            onChange={(e) => {
              setVoteStatusFilter(e.target.value as VoteStatusFilter)
              setPage(0)
            }}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <option value="ALL">All</option>
            <option value="VOTED">Voted</option>
            <option value="NOT_VOTED">Not Voted</option>
          </TextField>
          <TextField
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder="Name or contact..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <Tooltip title="Clear filters">
            <IconButton
              size="small"
              onClick={() => {
                setVoteStatusFilter('ALL')
                setSearch('')
                setPage(0)
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Table Section */}
      <Paper>
        {loading ? (
          <LoadingState />
        ) : voters.length === 0 ? (
          <EmptyState
            title="No eligible voters"
            description="No voters found for this voting period and filters."
            action={<Button onClick={fetchVoters}>Reload</Button>}
          />
        ) : (
          <>
            <TableContainer>
              <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main', '& .MuiTableCell-root': { color: 'primary.contrastText', fontWeight: 600 } }}>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'fullName'}
                        direction={sortField === 'fullName' ? sortDirection : 'asc'}
                        onClick={() => handleSort('fullName')}
                        sx={{ '&.MuiTableSortLabel-root': { color: 'inherit' }, '&.Mui-active': { color: 'inherit' }, '& .MuiTableSortLabel-icon': { color: 'inherit !important' } }}
                      >
                        Person
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'fellowshipName'}
                        direction={sortField === 'fellowshipName' ? sortDirection : 'asc'}
                        onClick={() => handleSort('fellowshipName')}
                        sx={{ '&.MuiTableSortLabel-root': { color: 'inherit' }, '&.Mui-active': { color: 'inherit' }, '& .MuiTableSortLabel-icon': { color: 'inherit !important' } }}
                      >
                        Fellowship
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'voted'}
                        direction={sortField === 'voted' ? sortDirection : 'asc'}
                        onClick={() => handleSort('voted')}
                        sx={{ '&.MuiTableSortLabel-root': { color: 'inherit' }, '&.Mui-active': { color: 'inherit' }, '& .MuiTableSortLabel-icon': { color: 'inherit !important' } }}
                      >
                        Vote Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Override</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'lastCodeStatus'}
                        direction={sortField === 'lastCodeStatus' ? sortDirection : 'asc'}
                        onClick={() => handleSort('lastCodeStatus')}
                        sx={{ '&.MuiTableSortLabel-root': { color: 'inherit' }, '&.Mui-active': { color: 'inherit' }, '& .MuiTableSortLabel-icon': { color: 'inherit !important' } }}
                      >
                        Code
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {voters.map((voter) => {
                    const code = codes.get(voter.personId)
                    const hasOverride = overrides.has(voter.personId)
                    return (
                      <TableRow key={voter.personId} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                              {voter.fullName}
                            </Typography>
                            <Chip size="small" label={`#${voter.personId}`} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">{voter.phoneNumber || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {voter.email || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{voter.fellowshipName || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{voter.scopeName || voter.scope || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            status={voter.voted ? 'ACTIVE' : 'inactive'}
                            label={voter.voted ? 'Voted' : 'Not Voted'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {hasOverride ? (
                            <Chip label="Override" size="small" variant="filled" color="warning" />
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {code ? (
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                              <Chip
                                label={
                                  revealed[code.id!] ? code.code : maskCode(code.code)
                                }
                                size="small"
                                variant="outlined"
                              />
                              <StatusChip
                                status={(code.status as any) || 'inactive'}
                                label={code.status || '—'}
                                size="small"
                              />
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            {code && (
                              <>
                                <Tooltip title={revealed[code.id!] ? 'Hide' : 'Show'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setRevealed((prev) => ({
                                        ...prev,
                                        [code.id!]: !prev[code.id!],
                                      }))
                                    }}
                                  >
                                    {revealed[code.id!] ? (
                                      <VisibilityOffIcon fontSize="small" />
                                    ) : (
                                      <VisibilityIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Copy code">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyCode(code.code)}
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {isAdmin && code.status === 'ACTIVE' && (
                                  <>
                                    <Tooltip title="Regenerate">
                                      <IconButton
                                        size="small"
                                        onClick={() => setReasonDialog({ mode: 'regenerate', code })}
                                      >
                                        <AutorenewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Revoke">
                                      <IconButton
                                        size="small"
                                        onClick={() => setReasonDialog({ mode: 'revoke', code })}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </>
                            )}
                            {canIssue && !code && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleIssueCode(voter.personId, voter.fullName)}
                                disabled={issuingFor === voter.personId}
                              >
                                Issue Code
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={size}
              onRowsPerPageChange={(e) => {
                setSize(Number(e.target.value))
                setPage(0)
              }}
            />
          </>
        )}
      </Paper>

      {/* Issue Result Dialog - Large and Clean */}
      <Dialog 
        open={Boolean(issueResultDialog)} 
        onClose={() => setIssueResultDialog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2,
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64 }}>
              <CheckCircleIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" fontWeight="600">Code Issued Successfully</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Person
              </Typography>
              <Typography variant="h6" fontWeight="500">{issueResultDialog?.personName}</Typography>
              <Chip 
                size="small" 
                label={`ID: ${issueResultDialog?.personId}`} 
                sx={{ mt: 0.5 }} 
              />
            </Box>
            <Box 
              sx={{ 
                textAlign: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                p: 4,
                borderRadius: 2,
                position: 'relative'
              }}
            >
              <Typography variant="caption" display="block" sx={{ mb: 1, opacity: 0.9 }}>
                VOTING CODE
              </Typography>
              <Typography 
                variant="h3" 
                fontWeight="700" 
                letterSpacing={4}
                sx={{ 
                  fontFamily: 'monospace',
                  userSelect: 'all',
                  wordBreak: 'break-all'
                }}
              >
                {issueResultDialog?.code}
              </Typography>
              <Button
                startIcon={<ContentCopyIcon />}
                onClick={() => handleCopyCode(issueResultDialog?.code)}
                variant="contained"
                sx={{ 
                  mt: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                Copy Code
              </Button>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Write down this code. The voter will need it to cast their vote.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, pt: 1 }}>
          <Button 
            onClick={() => setIssueResultDialog(null)} 
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reason Dialog for Revoke/Regenerate */}
      <Dialog open={Boolean(reasonDialog)} onClose={() => setReasonDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reasonDialog?.mode === 'revoke' ? 'Revoke Code' : 'Regenerate Code'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Explain why you are revoking or regenerating this code..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonDialog(null)} disabled={reasonBusy}>
            Cancel
          </Button>
          <Button
            onClick={reasonDialog?.mode === 'revoke' ? handleRevoke : handleRegenerate}
            variant="contained"
            disabled={reasonBusy || !reasonText.trim()}
          >
            {reasonDialog?.mode === 'revoke' ? 'Revoke' : 'Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UnifiedEligibleVotersCodesTab
