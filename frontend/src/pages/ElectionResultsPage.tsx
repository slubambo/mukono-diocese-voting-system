import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AccessTime as AccessTimeIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  ArrowBack as ArrowBackIcon,
  FactCheck as FactCheckIcon,
  HowToVote as HowToVoteIcon,
  EventAvailable as EventAvailableIcon,
  Insights as InsightsIcon,
  MilitaryTech as MilitaryTechIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh,
  SupervisorAccount as SupervisorAccountIcon,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import EmptyState from '../components/common/EmptyState'
import LoadingState from '../components/common/LoadingState'
import StatusChip from '../components/common/StatusChip'
import { electionApi } from '../api/election.api'
import { resultsApi } from '../api/results.api'
import type {
  CandidateResultsResponse,
  CertificationResponse,
  ElectionResultsSummaryResponse,
  PositionResultsResponse,
  RunTallyResponse,
  TallyStatusResponse,
} from '../api/results.api'
import { useToast } from '../components/feedback/ToastProvider'
import { useAuth } from '../context/AuthContext'
import type { VotingPeriod } from '../types/election'
import type { LeadershipAssignmentResponse } from '../types/leadership'

interface RankedCandidate extends CandidateResultsResponse {
  rank: number
  fullName: string
  voteCount: number
  voteSharePercent?: number
}

interface RankedPosition extends PositionResultsResponse {
  rankedCandidates: RankedCandidate[]
  hasTie: boolean
  hasZeroVotes: boolean
}

const buildRankedPosition = (position: PositionResultsResponse): RankedPosition => {
  const totalVotes = position.totalBallotsForPosition ?? 0
  const candidates = [...(position.candidates || [])].map((c) => ({
    ...c,
    voteCount: c.voteCount ?? 0,
    fullName: c.fullName || 'Unknown candidate',
    voteSharePercent:
      typeof c.voteSharePercent === 'number'
        ? c.voteSharePercent
        : totalVotes > 0
          ? ((c.voteCount ?? 0) / totalVotes) * 100
          : undefined,
  }))

  candidates.sort((a, b) => {
    const byVotes = (b.voteCount ?? 0) - (a.voteCount ?? 0)
    if (byVotes !== 0) return byVotes
    return (a.fullName || '').localeCompare(b.fullName || '')
  })

  let currentRank = 0
  let lastVotes: number | undefined
  const rankedCandidates: RankedCandidate[] = candidates.map((c, index) => {
    if (lastVotes === undefined || c.voteCount !== lastVotes) {
      currentRank = index + 1
      lastVotes = c.voteCount
    }
    return { ...c, rank: currentRank }
  })

  const topVote = rankedCandidates[0]?.voteCount ?? 0
  const hasTie = rankedCandidates.filter((c) => c.voteCount === topVote).length > 1 && topVote > 0
  const hasZeroVotes = totalVotes === 0

  return { ...position, rankedCandidates, hasTie, hasZeroVotes }
}

type ElectionResultsViewProps = {
  electionId?: string | number
  initialVotingPeriodId?: string | number
  showLayout?: boolean
  showInternalSelectors?: boolean
  hideBackButton?: boolean
}

export const ElectionResultsView: React.FC<ElectionResultsViewProps> = ({
  electionId: electionIdProp,
  initialVotingPeriodId,
  showLayout = true,
  showInternalSelectors = true,
  hideBackButton = false,
}) => {
  const { electionId: electionIdParam } = useParams()
  const resolvedElectionId = electionIdProp ?? electionIdParam
  const toast = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))

  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [election, setElection] = useState<any>(null)
  const [votingPeriods, setVotingPeriods] = useState<VotingPeriod[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | number | undefined>(initialVotingPeriodId)
  const [summary, setSummary] = useState<ElectionResultsSummaryResponse | null>(null)
  const [positions, setPositions] = useState<RankedPosition[]>([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState<string>('')
  const [tallyStatus, setTallyStatus] = useState<TallyStatusResponse | null>(null)
  const [tallyLoading, setTallyLoading] = useState(false)
  const [tallyConfirmOpen, setTallyConfirmOpen] = useState(false)
  const [tallyRemarks, setTallyRemarks] = useState('')
  const [expandedFellowships, setExpandedFellowships] = useState<Record<string, boolean>>({})
  const [lastTallyRun, setLastTallyRun] = useState<RunTallyResponse | null>(null)
  const [certifyLoading, setCertifyLoading] = useState(false)
  const [certifyConfirmOpen, setCertifyConfirmOpen] = useState(false)
  const [certificationResult, setCertificationResult] = useState<CertificationResponse | null>(null)
  const [certifiedAssignments, setCertifiedAssignments] = useState<LeadershipAssignmentResponse[]>([])
  const [refreshCountdown, setRefreshCountdown] = useState<number | null>(null)
  const refreshTimerRef = useRef<number | null>(null)
  const REFRESH_MS = 5 * 60 * 1000
  const selectedPeriod = useMemo(
    () => votingPeriods.find((vp) => String(vp.id) === String(selectedPeriodId)),
    [votingPeriods, selectedPeriodId]
  )
  const normalizedPeriodStatus = String(summary?.periodStatus || selectedPeriod?.status || '').toUpperCase()
  const isPeriodClosed = normalizedPeriodStatus.includes('CLOSED') || ['TALLIED', 'PUBLISHED', 'COMPLETED', 'ENDED'].includes(normalizedPeriodStatus)
  const scopeChipColor = useMemo(() => {
    const scope = String(election?.scope || '').toUpperCase()
    if (scope === 'DIOCESE') return 'primary' as const
    if (scope === 'ARCHDEACONRY') return 'warning' as const
    if (scope === 'CHURCH') return 'secondary' as const
    return 'default' as const
  }, [election?.scope])

  useEffect(() => {
    const loadElection = async () => {
      if (!resolvedElectionId) return
      setLoading(true)
      try {
        const res = await electionApi.get(resolvedElectionId)
        setElection(res)
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load election')
      } finally {
        setLoading(false)
      }
    }

    loadElection()
  }, [resolvedElectionId, toast])

  useEffect(() => {
    const loadPeriods = async () => {
      if (!resolvedElectionId) return
      try {
        const res = await electionApi.listVotingPeriods(resolvedElectionId)
        const items: VotingPeriod[] = (res as any)?.content ?? (res as any) ?? []
        setVotingPeriods(items)
        const closed = items.filter((p) => (p.status || '').toUpperCase() === 'CLOSED')
        const defaultPeriod = closed[0] || items[0]
        setSelectedPeriodId((prev) => prev || defaultPeriod?.id)
      } catch (err: any) {
        setVotingPeriods([])
        toast.error(err?.message || 'Failed to load voting periods')
      }
    }

    loadPeriods()
  }, [resolvedElectionId, toast])

  useEffect(() => {
    setSelectedPeriodId(initialVotingPeriodId)
  }, [initialVotingPeriodId, resolvedElectionId])

  // Auto-refresh when period is open and summary is available
  useEffect(() => {
    if (!selectedPeriodId || !summary) {
      setRefreshCountdown(null)
      return
    }

    const isOpen = (summary.periodStatus || '').toUpperCase().includes('OPEN')
    if (!isOpen) {
      setRefreshCountdown(null)
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      return
    }

    setRefreshCountdown(REFRESH_MS)
    if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current)

    refreshTimerRef.current = window.setInterval(() => {
      setRefreshCountdown((prev) => {
        const next = prev !== null ? prev - 1000 : REFRESH_MS
        if (next <= 0) {
          fetchSummary(selectedPeriodId)
          fetchPositions(selectedPeriodId)
          fetchTallyStatus(selectedPeriodId)
          return REFRESH_MS
        }
        return next
      })
    }, 1000)

    return () => {
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [selectedPeriodId, summary])

  const fetchSummary = async (periodId?: string | number) => {
    if (!resolvedElectionId || !periodId) return
    try {
      const res = await resultsApi.getSummary(resolvedElectionId, periodId)
      setSummary(res)
    } catch (err: any) {
      setSummary(null)
      toast.error(err?.message || 'Failed to load summary')
    }
  }

  const refreshNow = () => {
    if (!selectedPeriodId) return
    fetchSummary(selectedPeriodId)
    fetchPositions(selectedPeriodId)
    fetchTallyStatus(selectedPeriodId)
    setRefreshCountdown(REFRESH_MS)
  }

  const fetchPositions = async (periodId?: string | number) => {
    if (!resolvedElectionId || !periodId) return
    setPositionsLoading(true)
    try {
      const res = await resultsApi.getPositions(resolvedElectionId, periodId)
      const ranked = (res || []).map(buildRankedPosition)
      setPositions(ranked)
    } catch (err: any) {
      setPositions([])
      toast.error(err?.message || 'Failed to load position results')
    } finally {
      setPositionsLoading(false)
    }
  }

  const fetchTallyStatus = async (periodId?: string | number) => {
    if (!resolvedElectionId || !periodId || !isAdmin) return
    setTallyLoading(true)
    try {
      const res = await resultsApi.tallyStatus(resolvedElectionId, periodId)
      setTallyStatus(res)
    } catch (err: any) {
      setTallyStatus(null)
      toast.error(err?.message || 'Failed to load tally status')
    } finally {
      setTallyLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedPeriodId) return
    fetchSummary(selectedPeriodId)
    fetchPositions(selectedPeriodId)
    fetchTallyStatus(selectedPeriodId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriodId])

  const handleRunTally = async () => {
    if (!resolvedElectionId || !selectedPeriodId) return
    setTallyLoading(true)
    try {
      const res = await resultsApi.runTally(resolvedElectionId, selectedPeriodId, tallyRemarks ? { remarks: tallyRemarks } : {})
      setLastTallyRun(res)
      toast.success(res?.message || 'Tally completed')
      fetchTallyStatus(selectedPeriodId)
      fetchSummary(selectedPeriodId)
      fetchPositions(selectedPeriodId)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to run tally')
    } finally {
      setTallyLoading(false)
      setTallyConfirmOpen(false)
      setTallyRemarks('')
    }
  }

  const handleCertify = async () => {
    if (!resolvedElectionId || !selectedPeriodId) return
    setCertifyLoading(true)
    try {
      const res = await resultsApi.certifyResults(resolvedElectionId, selectedPeriodId)
      setCertificationResult(res)
      setCertifiedAssignments(res?.assignments ?? [])
      toast.success(res?.message || 'Results certified')
      fetchSummary(selectedPeriodId)
      fetchPositions(selectedPeriodId)
      fetchTallyStatus(selectedPeriodId)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to certify results')
    } finally {
      setCertifyLoading(false)
      setCertifyConfirmOpen(false)
    }
  }

  const filteredCandidates = useMemo(() => {
    const term = candidateSearch.toLowerCase().trim()
    return positions
      .filter((p) => !positionFilter || String(p.positionId) === positionFilter)
      .flatMap((p) =>
        p.rankedCandidates.map((c) => ({
          ...c,
          positionId: p.positionId,
          positionName: p.positionName,
          fellowshipName: p.fellowshipName,
          locationName: p.locationName,
          positionTurnout: p.turnoutForPosition,
          totalBallots: p.totalBallotsForPosition,
        }))
      )
      .filter((c) => !term || (c.fullName || '').toLowerCase().includes(term))
  }, [positions, positionFilter, candidateSearch])

  const canTally = Boolean(
    isAdmin &&
      selectedPeriodId &&
      election?.status &&
      ['VOTING_CLOSED', 'CLOSED', 'TALLIED', 'PUBLISHED'].some((s) => (election.status as string)?.toUpperCase() === s)
  )

  const renderSummary = () => {
    if (!selectedPeriodId) {
      return <EmptyState title="Select a voting period" description="Choose a closed voting period to view results." />
    }

    if (!summary) {
      return <EmptyState title="No results yet" description="Results are not available for this voting period." />
    }

    const tieCount = positions.filter((p) => p.hasTie).length
    const zeroVotePositions = positions.filter((p) => p.hasZeroVotes).length
    const livePositions = [...positions].sort((a, b) => (b.totalBallotsForPosition ?? 0) - (a.totalBallotsForPosition ?? 0))
    const positionsByScope = livePositions.reduce<Record<string, Record<string, RankedPosition[]>>>((acc, pos) => {
      const scopeKey = pos.scope || 'OTHER'
      const fellowshipKey = `${pos.fellowshipId ?? 'unknown'}:${pos.fellowshipName ?? 'Unassigned fellowship'}`
      if (!acc[scopeKey]) acc[scopeKey] = {}
      if (!acc[scopeKey][fellowshipKey]) acc[scopeKey][fellowshipKey] = []
      acc[scopeKey][fellowshipKey].push(pos)
      return acc
    }, {})
    const orderedScopes = ['DIOCESE', 'ARCHDEACONRY', 'CHURCH', 'OTHER'].filter((scope) => Object.keys(positionsByScope[scope] || {}).length > 0)
    const lastTallyCompletedAt = tallyStatus?.completedAt
    const lastTallyUpdatedAt = tallyStatus?.lastUpdatedAt
    const serverTimeLabel = summary.serverTime ? new Date(summary.serverTime).toLocaleString() : '—'
    const nextUpdateLabel = refreshCountdown !== null ? `${Math.floor(refreshCountdown / 60000)}:${String(Math.floor((refreshCountdown % 60000) / 1000)).padStart(2, '0')}` : 'Paused'
    const isLive = (summary.periodStatus || '').toUpperCase().includes('OPEN')
    const formatNumber = (value?: number | null) => (value === null || value === undefined ? '—' : value.toLocaleString())
    const periodWindowLabel = summary.periodStartTime || summary.periodEndTime
      ? `${summary.periodStartTime ? new Date(summary.periodStartTime).toLocaleString() : '—'} → ${summary.periodEndTime ? new Date(summary.periodEndTime).toLocaleString() : '—'}`
      : '—'
    const turnoutRate = summary.totalEligibleVoters === null || summary.totalEligibleVoters === undefined
      ? null
      : Math.min(100, ((summary.totalBallotsCast ?? 0) / Math.max(summary.totalEligibleVoters, 1)) * 100)
    const positionsInTie = tallyStatus?.positionsInTie ?? tieCount
    const positionsWithZeroVotes = tallyStatus?.positionsWithZeroVotes ?? zeroVotePositions
    const getScopeColor = (scope?: string) => {
      const normalized = String(scope || '').toUpperCase()
      if (normalized === 'DIOCESE') return 'primary' as const
      if (normalized === 'ARCHDEACONRY') return 'warning' as const
      if (normalized === 'CHURCH') return 'secondary' as const
      return 'default' as const
    }

    const headlineCards = [
      {
        label: 'Eligible voters',
        value: formatNumber(summary.totalEligibleVoters),
        icon: <SupervisorAccountIcon fontSize="small" />,
      },
      {
        label: 'Ballots cast',
        value: formatNumber(summary.totalBallotsCast),
        icon: <HowToVoteIcon fontSize="small" />,
      },
      {
        label: 'Turnout rate',
        value: turnoutRate !== null ? `${turnoutRate.toFixed(1)}%` : '—',
        icon: <InsightsIcon fontSize="small" />,
      },
      {
        label: 'Positions',
        value: formatNumber(summary.totalPositions),
        icon: <EventAvailableIcon fontSize="small" />,
      },
    ]

    return (
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            position: 'relative',
            overflow: 'hidden',
            background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.85)} 45%, ${alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.85)} 100%)`,
            color: 'common.white',
            borderRadius: 3,
            boxShadow: '0 24px 70px rgba(12, 9, 30, 0.28)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'grid', gap: 0.75, minWidth: { xs: '100%', md: 420 } }}>
              <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.9 }}>Live tally display</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>{election.name || 'Election results'}</Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                {summary.votingPeriodName ? `${summary.votingPeriodName} · ` : ''}{summary.periodStatus || 'Status —'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Voting window: {periodWindowLabel}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Server time: {serverTimeLabel}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} alignItems={{ xs: 'center', md: 'flex-end' }} sx={{ flexWrap: 'wrap' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <StatusChip status={(election.status || 'pending') as any} />
                <Chip size="small" color="default" variant="filled" label={isLive ? 'Live updates' : 'Paused'} sx={{ bgcolor: isLive ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.14)', color: 'common.white' }} />
                <Chip
                  size="small"
                  color="secondary"
                  variant="filled"
                  label={`Next update: ${nextUpdateLabel}`}
                  icon={<AccessTimeIcon fontSize="small" />}
                  sx={{ bgcolor: 'rgba(0,0,0,0.25)' }}
                />
              </Stack>
              <Button
                variant="outlined"
                color="inherit"
                onClick={refreshNow}
                startIcon={<Refresh fontSize="small" />}
                sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.4)' }}
              >
                Refresh now
              </Button>
            </Stack>
          </Box>
          <Box
            sx={{
              mt: 3,
              display: 'grid',
              gap: 1.25,
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
            }}
          >
            {headlineCards.map((card) => (
              <Box
                key={card.label}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'inherit' }}>
                  {card.icon}
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>{card.label}</Typography>
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{card.value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            alignItems: 'stretch',
          }}
        >
          <Paper sx={{ p: 2.5, display: 'grid', gap: 1.75 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <InsightsIcon fontSize="small" />
              <Typography variant="h6">Integrity & tally</Typography>
            </Stack>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Tally status</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{tallyStatus?.status || 'Not started'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Positions certified</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatNumber(tallyStatus?.totalPositionsCertified ?? 0)}</Typography>
              </Stack>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Tally completion</Typography>
                <LinearProgress
                  variant={tallyStatus?.status ? 'determinate' : 'indeterminate'}
                  value={tallyStatus?.status ? Math.min(100, ((tallyStatus?.totalPositionsCertified ?? 0) / Math.max(summary.totalPositions ?? 1, 1)) * 100) : undefined}
                  sx={{
                    height: 8,
                    borderRadius: 99,
                    '& .MuiLinearProgress-bar': { transition: 'width 0.6s ease' },
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.100' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MilitaryTechIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">Ties detected</Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatNumber(positionsInTie)}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.100' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">Zero-vote positions</Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatNumber(positionsWithZeroVotes)}</Typography>
                </Paper>
              </Box>
              <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.100' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SupervisorAccountIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">Distinct voters</Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatNumber(summary.totalDistinctVoters)}</Typography>
              </Paper>
              {lastTallyCompletedAt && (
                <Typography variant="caption" color="text.secondary">
                  Last tally run: {new Date(lastTallyCompletedAt).toLocaleString()}
                </Typography>
              )}
              {lastTallyUpdatedAt && (
                <Typography variant="caption" color="text.secondary">
                  Status updated: {new Date(lastTallyUpdatedAt).toLocaleString()}
                </Typography>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 2.5, display: 'grid', gap: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeIcon fontSize="small" />
              <Typography variant="h6">Period timing</Typography>
            </Stack>
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Voting period</Typography>
                <Chip size="small" label={summary.periodStatus || '—'} color="primary" variant="outlined" />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Window</Typography>
                <Typography variant="body2">{periodWindowLabel}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Server time</Typography>
                <Typography variant="body2">{serverTimeLabel}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Next refresh</Typography>
                <Typography variant="body2">{nextUpdateLabel}</Typography>
              </Stack>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Turnout progress</Typography>
                <LinearProgress
                  variant="determinate"
                  value={turnoutRate ?? 0}
                  sx={{
                    height: 8,
                    borderRadius: 99,
                    '& .MuiLinearProgress-bar': { transition: 'width 0.6s ease' },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatNumber(summary.totalBallotsCast)} ballots of {formatNumber(summary.totalEligibleVoters)} eligible voters
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Paper sx={{ p: 2, display: 'grid', gap: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <MilitaryTechIcon fontSize="small" />
            <Typography variant="h6">Live position activity</Typography>
          </Stack>
          {livePositions.length === 0 ? (
            <EmptyState title="No positions yet" description="Position progress will appear once votes are cast." />
          ) : (
            <Box sx={{ display: 'grid', gap: 2 }}>
              {orderedScopes.map((scopeKey) => {
                const fellowshipGroups = Object.entries(positionsByScope[scopeKey] || {})
                  .map(([key, items]) => ({
                    key,
                    fellowshipName: items[0]?.fellowshipName || 'Unassigned fellowship',
                    locationName: items[0]?.locationName || '—',
                    items,
                  }))
                  .sort((a, b) => a.fellowshipName.localeCompare(b.fellowshipName))
                const totalPositions = fellowshipGroups.reduce((count, group) => count + group.items.length, 0)

                return (
                <Box key={scopeKey} sx={{ display: 'grid', gap: 1.25 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      label={scopeKey === 'DIOCESE' ? 'Diocese positions' : scopeKey === 'ARCHDEACONRY' ? 'Archdeaconry positions' : scopeKey === 'CHURCH' ? 'Church positions' : 'Other positions'}
                      color={getScopeColor(scopeKey)}
                      variant="outlined"
                      sx={(theme) => {
                        const chipColor = getScopeColor(scopeKey)
                        return {
                          fontWeight: 600,
                          bgcolor: chipColor === 'default'
                            ? alpha(theme.palette.grey[500], 0.12)
                            : alpha(theme.palette[chipColor].main, 0.12),
                          borderColor: chipColor === 'default'
                            ? alpha(theme.palette.grey[500], 0.4)
                            : alpha(theme.palette[chipColor].main, 0.4),
                          color: chipColor === 'default'
                            ? theme.palette.text.primary
                            : theme.palette[chipColor].dark,
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {totalPositions} positions
                    </Typography>
                  </Stack>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {fellowshipGroups.map((group) => (
                      (() => {
                        const expanded = expandedFellowships[group.key] ?? true
                        return (
                      <Paper
                        key={group.key}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          borderColor: 'grey.100',
                          background: 'rgba(248, 250, 252, 0.7)',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {group.fellowshipName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {group.locationName}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              label={`${group.items.length} positions`}
                              color="info"
                              variant="outlined"
                              sx={(theme) => ({
                                fontWeight: 600,
                                bgcolor: alpha(theme.palette.info.main, 0.12),
                                borderColor: alpha(theme.palette.info.main, 0.35),
                                color: theme.palette.info.dark,
                              })}
                            />
                            <IconButton
                              size="small"
                              onClick={() => {
                                setExpandedFellowships((prev) => ({ ...prev, [group.key]: !expanded }))
                              }}
                              aria-label={expanded ? 'Collapse fellowship' : 'Expand fellowship'}
                            >
                              <ExpandMoreIcon
                                fontSize="small"
                                sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                              />
                            </IconButton>
                          </Stack>
                        </Stack>
                        <Box
                          sx={{
                            display: expanded ? 'grid' : 'none',
                            gap: 1,
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                          }}
                        >
                          {group.items.map((pos) => {
                            const ballots = pos.totalBallotsForPosition ?? 0
                            const totalBallots = summary.totalBallotsCast ?? 0
                            const percent = pos.positionVoteShareOfTotal ?? (totalBallots > 0 ? Math.min(100, (ballots / totalBallots) * 100) : 0)
                            return (
                              <Paper
                                key={pos.positionId}
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  borderColor: alpha('#5b21b6', 0.12),
                                  background: 'linear-gradient(135deg, rgba(91, 33, 182, 0.04), rgba(59, 130, 246, 0.04))',
                                }}
                              >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{pos.positionName}</Typography>
                                  <Chip
                                    size="small"
                                    label={`${ballots} ballots`}
                                    color="success"
                                    variant="outlined"
                                    sx={(theme) => ({
                                      fontWeight: 600,
                                      bgcolor: alpha(theme.palette.success.main, 0.12),
                                      borderColor: alpha(theme.palette.success.main, 0.35),
                                      color: theme.palette.success.dark,
                                    })}
                                  />
                                </Stack>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Share of all ballots
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {percent.toFixed(0)}%
                                  </Typography>
                                </Stack>
                                <LinearProgress
                                  variant="determinate"
                                  value={percent}
                                  sx={{ height: 8, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { transition: 'width 0.6s ease' } }}
                                />
                                <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={pos.scope || '—'}
                                    color={getScopeColor(pos.scope)}
                                    sx={(theme) => {
                                      const chipColor = getScopeColor(pos.scope)
                                      return {
                                        fontWeight: 600,
                                        bgcolor: chipColor === 'default'
                                          ? alpha(theme.palette.grey[500], 0.1)
                                          : alpha(theme.palette[chipColor].main, 0.12),
                                        borderColor: chipColor === 'default'
                                          ? alpha(theme.palette.grey[500], 0.35)
                                          : alpha(theme.palette[chipColor].main, 0.35),
                                        color: chipColor === 'default'
                                          ? theme.palette.text.primary
                                          : theme.palette[chipColor].dark,
                                      }
                                    }}
                                  />
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`Seats: ${pos.seats ?? '—'}`}
                                    color="secondary"
                                    sx={(theme) => ({
                                      fontWeight: 600,
                                      bgcolor: alpha(theme.palette.secondary.main, 0.12),
                                      borderColor: alpha(theme.palette.secondary.main, 0.35),
                                      color: theme.palette.secondary.dark,
                                    })}
                                  />
                                </Stack>
                              </Paper>
                            )
                          })}
                        </Box>
                      </Paper>
                        )
                      })()
                    ))}
                  </Box>
                </Box>
              )})}
            </Box>
          )}
        </Paper>
      </Box>
    )
  }

  const renderPositionResults = () => {
    if (!selectedPeriodId) return <EmptyState title="Select a voting period" description="Choose a closed voting period to view results." />
    if (positionsLoading) return <LoadingState variant="row" />
    if (positions.length === 0) return <EmptyState title="No position results" description="No results were returned for this voting period." />

    return (
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'grey.100',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.02), rgba(59, 130, 246, 0.04))',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Position Results</Typography>
              <Typography variant="body2" color="text.secondary">
                {isPeriodClosed ? 'Final tallied results by position.' : 'Turnout by position while voting is still open.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                label={normalizedPeriodStatus || 'Status —'}
                color={isPeriodClosed ? 'success' : 'warning'}
                variant="outlined"
                sx={(theme) => ({
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette[isPeriodClosed ? 'success' : 'warning'].main, 0.12),
                  borderColor: alpha(theme.palette[isPeriodClosed ? 'success' : 'warning'].main, 0.35),
                  color: theme.palette[isPeriodClosed ? 'success' : 'warning'].dark,
                })}
              />
              <Chip size="small" label={`${positions.length} positions`} />
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {positions.map((pos) => {
            const ballots = pos.totalBallotsForPosition ?? 0
            const totalBallots = summary?.totalBallotsCast ?? 0
            const percent = totalBallots > 0 ? Math.min(100, (ballots / totalBallots) * 100) : 0
            const leader = pos.rankedCandidates?.[0]
            const leaderLabel = leader?.fullName ? `${leader.fullName}` : '—'
            const leaderVotes = leader?.voteCount ?? 0
            const leaderShare = typeof leader?.voteSharePercent === 'number' ? `${leader.voteSharePercent.toFixed(1)}%` : '—'
            return (
              <Paper
                key={pos.positionId}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.100',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                }}
              >
                <Stack spacing={1.25}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{pos.positionName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pos.scope || '—'} · Seats: {pos.seats ?? '—'}
                      </Typography>
                    </Box>
                    <Chip size="small" label={`${ballots} ${isPeriodClosed ? 'votes' : 'ballots'}`} />
                  </Box>

                  {!isPeriodClosed ? (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Position turnout compared to total ballots cast
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{ height: 8, borderRadius: 99, '& .MuiLinearProgress-bar': { transition: 'width 0.6s ease' } }}
                      />
                    </>
                  ) : (
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: alpha('#16a34a', 0.2),
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(16, 185, 129, 0.05))',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Leading candidate
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{leaderLabel}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip size="small" color="success" variant="outlined" label={`${leaderVotes} votes`} />
                        <Chip size="small" color="info" variant="outlined" label={`${leaderShare} share`} />
                        {pos.hasTie && <Chip size="small" color="warning" label="Tie detected" />}
                      </Stack>
                    </Box>
                  )}

                  {pos.hasZeroVotes && isPeriodClosed && <Chip size="small" color="error" label="Zero votes" />}
                </Stack>
              </Paper>
            )
          })}
        </Box>
      </Box>
    )
  }

  const renderCandidateBreakdown = () => {
    if (!isAdmin) return <EmptyState title="Restricted" description="Candidate-level results are hidden during live tally." />
    if (!selectedPeriodId) return <EmptyState title="Select a voting period" description="Choose a closed voting period to view results." />
    if (!isPeriodClosed) return <EmptyState title="Voting still open" description="Candidate breakdown is available once the voting period is closed." />
    if (positionsLoading) return <LoadingState variant="row" />
    if (filteredCandidates.length === 0) return <EmptyState title="No candidates" description="No candidates match your filters." />

    const fellowshipGroups = filteredCandidates.reduce<Record<string, typeof filteredCandidates>>((acc, candidate) => {
      const key = candidate.fellowshipName || 'Unassigned fellowship'
      if (!acc[key]) acc[key] = []
      acc[key].push(candidate)
      return acc
    }, {})
    const orderedFellowships = Object.keys(fellowshipGroups).sort((a, b) => a.localeCompare(b))

    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Candidate Breakdown</Typography>
            <Typography variant="body2" color="text.secondary">Final vote distribution by candidate and position.</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by position</InputLabel>
            <Select
              label="Filter by position"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <MenuItem value="">All positions</MenuItem>
              {positions.map((p) => (
                <MenuItem key={p.positionId} value={String(p.positionId)}>{p.positionName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Search candidate"
            value={candidateSearch}
            onChange={(e) => setCandidateSearch(e.target.value)}
          />
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {orderedFellowships.map((fellowshipName) => {
            const rows = fellowshipGroups[fellowshipName]
            const locationLabel = rows?.[0]?.locationName
            return (
              <Paper
                key={fellowshipName}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 1.5, borderColor: 'grey.100', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{fellowshipName}</Typography>
                    <Typography variant="caption" color="text.secondary">{locationLabel || '—'}</Typography>
                  </Box>
                  <Chip size="small" label={`${rows.length} candidates`} />
                </Stack>
                <TableContainer sx={{ borderRadius: 1.5, border: '1px solid', borderColor: 'grey.100' }}>
                  <Table size="small" sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.08)', fontWeight: 700 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Candidate</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell align="right">Rank</TableCell>
                        <TableCell align="right">Votes</TableCell>
                        <TableCell align="right">Vote %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((c) => (
                        <TableRow key={`${c.positionId}-${c.candidateId || c.personId || c.rank}`} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.rank === 1 ? 'success.main' : 'grey.400' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.fullName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{c.positionName}</TableCell>
                          <TableCell align="right">
                            <Chip size="small" label={`#${c.rank}`} color={c.rank === 1 ? 'success' : 'default'} />
                          </TableCell>
                          <TableCell align="right">{c.voteCount ?? 0}</TableCell>
                          <TableCell align="right">
                            {typeof c.voteSharePercent === 'number' && (c.totalBallots ?? 0) > 0
                              ? `${c.voteSharePercent.toFixed(2)}%`
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )
          })}
        </Box>
      </Paper>
    )
  }

  const renderTally = () => {
    if (!isAdmin) return null
    if (!selectedPeriodId) return <EmptyState title="Select a voting period" description="Tally actions require a closed voting period." />

    const hasVoting = (summary?.totalBallotsCast ?? 0) > 0
    const canCertify = Boolean(isAdmin && selectedPeriodId && isPeriodClosed && hasVoting)
    const certificationCount = certifiedAssignments.length
    const certificationTime = certificationResult?.certifiedAt
      ? new Date(certificationResult.certifiedAt).toLocaleString()
      : null

    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        {(tallyLoading || tallyStatus) && (
          <Paper sx={{ p: 2, display: 'grid', gap: 1 }}>
            <Typography variant="h6">Tally Status</Typography>
            {tallyLoading ? (
              <LoadingState variant="text" count={3} />
            ) : tallyStatus ? (
              <Box sx={{ display: 'grid', gap: 0.5 }}>
                <Typography variant="body2">Status: {tallyStatus.status || '—'}</Typography>
                <Typography variant="body2">Tally Run ID: {tallyStatus.tallyRunId || '—'}</Typography>
                <Typography variant="body2">Started: {tallyStatus.startedAt ? new Date(tallyStatus.startedAt).toLocaleString() : '—'}</Typography>
                <Typography variant="body2">Completed: {tallyStatus.completedAt ? new Date(tallyStatus.completedAt).toLocaleString() : '—'}</Typography>
                <Typography variant="body2">Positions certified: {tallyStatus.totalPositionsCertified ?? 0}</Typography>
                <Typography variant="body2">Winners applied: {tallyStatus.totalWinnersApplied ?? 0}</Typography>
              </Box>
            ) : null}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<HowToVoteIcon />}
                onClick={() => setTallyConfirmOpen(true)}
                disabled={!canTally || tallyLoading}
              >
                Tally Results
              </Button>
              <Button
                variant="outlined"
                startIcon={<FactCheckIcon />}
                onClick={() => setCertifyConfirmOpen(true)}
                disabled={!canCertify || certifyLoading}
              >
                Certify Results
              </Button>
            </Box>
            {!canTally && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Tally is enabled only after voting periods are closed. Current period status: {normalizedPeriodStatus || 'Unknown'}
              </Alert>
            )}
          </Paper>
        )}

        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'rgba(22, 163, 74, 0.2)',
            background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.9), rgba(236, 253, 245, 0.6))',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="h6" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <AssignmentTurnedInIcon fontSize="small" /> Certification
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certify a closed voting period to assign winners to their leadership positions.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                <Chip
                  size="small"
                  label={isPeriodClosed ? 'Period closed' : 'Period open'}
                  color={isPeriodClosed ? 'success' : 'warning'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={hasVoting ? 'Votes recorded' : 'No votes recorded'}
                  color={hasVoting ? 'info' : 'default'}
                  variant="outlined"
                />
                {certificationCount > 0 && (
                  <Chip size="small" color="success" label={`${certificationCount} assignments created`} />
                )}
              </Stack>
            </Box>
            <Button
              variant="contained"
              color="success"
              startIcon={<FactCheckIcon />}
              onClick={() => setCertifyConfirmOpen(true)}
              disabled={!canCertify || certifyLoading}
            >
              Certify & Assign Winners
            </Button>
          </Stack>
          {!canCertify && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Certification is available once the voting period is closed and at least one ballot has been cast.
            </Alert>
          )}
        </Paper>

        {lastTallyRun && (
          <Paper sx={{ p: 2, display: 'grid', gap: 0.5 }}>
            <Typography variant="subtitle1">Last Tally Run</Typography>
            <Typography variant="body2">Run ID: {lastTallyRun.tallyRunId}</Typography>
            <Typography variant="body2">Message: {lastTallyRun.message || '—'}</Typography>
            <Typography variant="body2">Positions tallied: {lastTallyRun.totalPositionsTallied ?? 0}</Typography>
            <Typography variant="body2">Winners applied: {lastTallyRun.totalWinnersApplied ?? 0}</Typography>
            <Typography variant="body2">Ties detected: {lastTallyRun.tiesDetectedCount ?? 0}</Typography>
          </Paper>
        )}

        {certificationResult && (
          <Paper sx={{ p: 2, display: 'grid', gap: 0.75 }}>
            <Typography variant="subtitle1">Certification Summary</Typography>
            <Typography variant="body2">Message: {certificationResult.message || 'Results certified.'}</Typography>
            {certificationTime && <Typography variant="body2">Certified at: {certificationTime}</Typography>}
            <Typography variant="body2">Assignments created: {certificationCount}</Typography>
          </Paper>
        )}

        {certifiedAssignments.length > 0 && (
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <SupervisorAccountIcon fontSize="small" />
              <Typography variant="h6">Position Assignments</Typography>
              <Chip size="small" label={`${certifiedAssignments.length} assignments`} />
            </Stack>
            <TableContainer sx={{ borderRadius: 1.5, border: '1px solid', borderColor: 'grey.100' }}>
              <Table size="small" sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.08)', fontWeight: 700 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Person</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Fellowship</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Term</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certifiedAssignments.map((assignment) => {
                    const positionTitle =
                      (assignment.fellowshipPosition as any)?.title?.name ||
                      (assignment.fellowshipPosition as any)?.titleName ||
                      '—'
                    const scopeLabel =
                      (assignment.fellowshipPosition as any)?.scope ||
                      (assignment.fellowshipPosition as any)?.scopeName ||
                      '—'
                    const termStart = assignment.termStartDate ? new Date(assignment.termStartDate).toLocaleDateString() : '—'
                    const termEnd = assignment.termEndDate ? new Date(assignment.termEndDate).toLocaleDateString() : '—'
                    return (
                      <TableRow key={assignment.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {assignment.person?.fullName || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{positionTitle}</TableCell>
                        <TableCell>{assignment.fellowship?.name || (assignment.fellowshipPosition as any)?.fellowship?.name || '—'}</TableCell>
                        <TableCell>{scopeLabel}</TableCell>
                        <TableCell>{termStart} → {termEnd}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    )
  }

  if (loading) {
    return showLayout ? (
      <PageLayout title="Election Results"><LoadingState /></PageLayout>
    ) : (
      <LoadingState />
    )
  }

  if (!election) {
    return showLayout ? (
      <PageLayout title="Election Results">
        <EmptyState title="Election not found" description="The requested election could not be located." />
      </PageLayout>
    ) : (
      <EmptyState title="Election not found" description="The requested election could not be located." />
    )
  }

  const tabs = [
    { label: 'Dashboard', render: renderSummary },
    { label: 'Position Results', render: renderPositionResults },
    ...(isAdmin ? [{ label: 'Candidate Breakdown', render: renderCandidateBreakdown }] : []),
    ...(isAdmin ? [{ label: 'Tally & Certification', render: renderTally }] : []),
  ]

  const resultsContent = (
    <>
      {showInternalSelectors && (
        <Paper sx={{ p: 1.5, mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <StatusChip status={(election.status || 'pending') as any} />
            <Chip
              size="small"
              label={`Scope: ${election.scope || '—'}`}
              color={scopeChipColor}
              variant="outlined"
              sx={(theme) => ({
                fontWeight: 600,
                bgcolor: scopeChipColor === 'default'
                  ? alpha(theme.palette.grey[500], 0.12)
                  : alpha(theme.palette[scopeChipColor].main, 0.12),
                borderColor: scopeChipColor === 'default'
                  ? alpha(theme.palette.grey[500], 0.4)
                  : alpha(theme.palette[scopeChipColor].main, 0.4),
                color: scopeChipColor === 'default'
                  ? theme.palette.text.primary
                  : theme.palette[scopeChipColor].dark,
              })}
            />
            {election.termStartDate && (
              <Chip
                size="small"
                label={`Term start: ${new Date(election.termStartDate).toLocaleDateString()}`}
                color="info"
                variant="outlined"
                sx={(theme) => ({
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.info.main, 0.12),
                  borderColor: alpha(theme.palette.info.main, 0.4),
                  color: theme.palette.info.dark,
                })}
              />
            )}
            {election.termEndDate && (
              <Chip
                size="small"
                label={`Term end: ${new Date(election.termEndDate).toLocaleDateString()}`}
                color="success"
                variant="outlined"
                sx={(theme) => ({
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.success.main, 0.12),
                  borderColor: alpha(theme.palette.success.main, 0.4),
                  color: theme.palette.success.dark,
                })}
              />
            )}
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Voting period</InputLabel>
              <Select
                label="Voting period"
                value={selectedPeriodId ? String(selectedPeriodId) : ''}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
              >
                {votingPeriods.map((vp) => (
                  <MenuItem key={vp.id} value={String(vp.id)}>
                    {vp.name || vp.label || `Period ${vp.id}`} ({vp.status || '—'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!votingPeriods.length && <Alert severity="warning">No voting periods found for this election.</Alert>}
          </Box>
        </Paper>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {tabs.map((t) => (
            <Tab key={t.label} label={t.label} />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ p: 1 }}>{tabs[tab]?.render()}</Box>
    </>
  )

  const layout = showLayout ? (
    <PageLayout
      title={election.name || 'Election Results'}
      subtitle="Closed voting period results, tallying, and leadership updates"
      actions={hideBackButton ? undefined : (
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(isAdmin ? '/admin/elections' : '/ds/elections')}>
          Back to Elections
        </Button>
      )}
    >
      {resultsContent}
    </PageLayout>
  ) : resultsContent

  return (
    <>
      {layout}
      <Dialog open={tallyConfirmOpen} onClose={() => setTallyConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Tally</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <Alert severity="warning">
            This will tally and lock election results for the selected voting period. This action cannot be undone.
          </Alert>
          <TextField
            label="Remarks (optional)"
            value={tallyRemarks}
            onChange={(e) => setTallyRemarks(e.target.value)}
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTallyConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleRunTally} variant="contained" color="error" disabled={tallyLoading}>
            Confirm Tally
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={certifyConfirmOpen} onClose={() => setCertifyConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Certify Results</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <Alert severity="info">
            Certifying will create leadership assignments for the winning candidates in this voting period.
          </Alert>
          <Typography variant="body2">
            This action assigns winners to positions for the election term and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertifyConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleCertify} variant="contained" color="success" disabled={certifyLoading}>
            Confirm Certification
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const ElectionResultsPage: React.FC = () => {
  const { electionId } = useParams()

  return (
    <AppShell>
      <ElectionResultsView electionId={electionId} />
    </AppShell>
  )
}

export default ElectionResultsPage
