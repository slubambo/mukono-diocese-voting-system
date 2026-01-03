import React, { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
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
import { eligibleVotersApi } from '../../api/eligibleVoters.api'
import { codesApi } from '../../api/codes.api'
import { useToast } from '../feedback/ToastProvider'
import { getErrorMessage } from '../../api/errorHandler'
import usePersonSearch from './usePersonSearch'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import StatusChip from '../common/StatusChip'
import type { EligibleVoterResponse } from '../../types/eligibility'
import type { VotingCodeResponse } from '../../types/eligibility'
import type { PersonResponse } from '../../types/leadership'

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
  const { options: personOptions, search: searchPeople, loading: searchingPeople } = usePersonSearch()

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

  // Issue code dialog
  const [issuePerson, setIssuePerson] = useState<PersonResponse | null>(null)
  const [remarks, setRemarks] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [issueResultDialog, setIssueResultDialog] = useState<{ code?: string; personName?: string } | null>(null)

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

  const handleIssueCode = async () => {
    if (!issuePerson?.id) {
      toast.error('Select a person')
      return
    }
    setIssuing(true)
    try {
      const res = await codesApi.issue(electionId, votingPeriodId, {
        personId: issuePerson.id,
        remarks: remarks.trim() || undefined,
      })
      setIssueResultDialog({
        code: res.code,
        personName: issuePerson.fullName,
      })
      toast.success('Voting code issued')
      setRemarks('')
      setIssuePerson(null)
      fetchCodeCounts()
      fetchVoters()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Unable to issue code')
    } finally {
      setIssuing(false)
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
    <Box sx={{ display: 'grid', gap: 3 }}>
      {/* Stats Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1.5 }}>
        <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Total Eligible
          </Typography>
          <Typography variant="h6">{counts.total}</Typography>
        </Paper>
        <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Voted
          </Typography>
          <Typography variant="h6">{counts.voted}</Typography>
        </Paper>
        <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Not Voted
          </Typography>
          <Typography variant="h6">{counts.notVoted}</Typography>
        </Paper>
        <Paper sx={{ p: 1.5, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Codes Active
          </Typography>
          <Typography variant="h6">{codeCounts.active}</Typography>
        </Paper>
        <Paper sx={{ p: 1.5, bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Codes Used
            </Typography>
            <Typography variant="h6">{codeCounts.used}</Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => { fetchCounts(); fetchCodeCounts(); fetchVoters() }} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      </Box>

      {/* Issue Code Section */}
      {canIssue && (
        <Paper sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Autocomplete
              sx={{ minWidth: 240, flex: 1 }}
              options={personOptions}
              loading={searchingPeople}
              getOptionLabel={(option) => option.fullName || ''}
              onInputChange={(_, value) => searchPeople(value)}
              value={issuePerson}
              onChange={(_, value) => setIssuePerson(value)}
              size="small"
              renderInput={(params) => (
                <TextField {...params} label="Person" placeholder="Search people" helperText="Type 2+ characters" />
              )}
            />
            <TextField
              label="Remarks (optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              size="small"
              sx={{ minWidth: 200, flex: 1 }}
            />
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={handleIssueCode}
              disabled={issuing}
            >
              Issue Code
            </Button>
          </Box>
        </Paper>
      )}

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
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'fullName'}
                        direction={sortField === 'fullName' ? sortDirection : 'asc'}
                        onClick={() => handleSort('fullName')}
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
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {voter.fullName}
                            </Typography>
                            <Chip size="small" label={`#${voter.personId}`} variant="outlined" />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'grid', gap: 0.25 }}>
                            <Typography variant="caption">{voter.phoneNumber || '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {voter.email || '—'}
                            </Typography>
                          </Box>
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
                              <Tooltip title="Issue code">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() => {
                                    setIssuePerson({
                                      id: voter.personId,
                                      fullName: voter.fullName,
                                    } as PersonResponse)
                                  }}
                                >
                                  Issue
                                </Button>
                              </Tooltip>
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

      {/* Issue Result Dialog */}
      <Dialog open={Boolean(issueResultDialog)} onClose={() => setIssueResultDialog(null)}>
        <DialogTitle>Code Issued Successfully</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Person
              </Typography>
              <Typography variant="body2">{issueResultDialog?.personName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Code
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={issueResultDialog?.code} />
                <Tooltip title="Copy">
                  <IconButton
                    size="small"
                    onClick={() => handleCopyCode(issueResultDialog?.code)}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueResultDialog(null)}>Done</Button>
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
