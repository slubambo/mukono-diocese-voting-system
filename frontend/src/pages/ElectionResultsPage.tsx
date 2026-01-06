import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AccessTime as AccessTimeIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  ArrowBack as ArrowBackIcon,
  HowToVote as HowToVoteIcon,
  EventAvailable as EventAvailableIcon,
  Insights as InsightsIcon,
  TrendingUp as TrendingUpIcon,
  MilitaryTech as MilitaryTechIcon,
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
  ElectionResultsSummaryResponse,
  PositionResultsResponse,
  RunTallyResponse,
  TallyStatusResponse,
} from '../api/results.api'
import { useToast } from '../components/feedback/ToastProvider'
import { useAuth } from '../context/AuthContext'
import type { VotingPeriod } from '../types/election'

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

const ElectionResultsPage: React.FC = () => {
  const { electionId } = useParams()
  const toast = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))

  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [election, setElection] = useState<any>(null)
  const [votingPeriods, setVotingPeriods] = useState<VotingPeriod[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | number | undefined>(undefined)
  const [summary, setSummary] = useState<ElectionResultsSummaryResponse | null>(null)
  const [positions, setPositions] = useState<RankedPosition[]>([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState<string>('')
  const [tallyStatus, setTallyStatus] = useState<TallyStatusResponse | null>(null)
  const [tallyLoading, setTallyLoading] = useState(false)
  const [tallyConfirmOpen, setTallyConfirmOpen] = useState(false)
  const [tallyRemarks, setTallyRemarks] = useState('')
  const [lastTallyRun, setLastTallyRun] = useState<RunTallyResponse | null>(null)
  const [refreshCountdown, setRefreshCountdown] = useState<number | null>(null)
  const refreshTimerRef = useRef<number | null>(null)
  const REFRESH_MS = 5 * 60 * 1000

  useEffect(() => {
    const loadElection = async () => {
      if (!electionId) return
      setLoading(true)
      try {
        const res = await electionApi.get(electionId)
        setElection(res)
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load election')
      } finally {
        setLoading(false)
      }
    }

    loadElection()
  }, [electionId, toast])

  useEffect(() => {
    const loadPeriods = async () => {
      if (!electionId) return
      try {
        const res = await electionApi.listVotingPeriods(electionId)
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
  }, [electionId, toast])

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
    if (!electionId || !periodId) return
    try {
      const res = await resultsApi.getSummary(electionId, periodId)
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
    if (!electionId || !periodId) return
    setPositionsLoading(true)
    try {
      const res = await resultsApi.getPositions(electionId, periodId)
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
    if (!electionId || !periodId || !isAdmin) return
    setTallyLoading(true)
    try {
      const res = await resultsApi.tallyStatus(electionId, periodId)
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
    if (!electionId || !selectedPeriodId) return
    setTallyLoading(true)
    try {
      const res = await resultsApi.runTally(electionId, selectedPeriodId, tallyRemarks ? { remarks: tallyRemarks } : {})
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

  const filteredCandidates = useMemo(() => {
    const term = candidateSearch.toLowerCase().trim()
    return positions
      .filter((p) => !positionFilter || String(p.positionId) === positionFilter)
      .flatMap((p) =>
        p.rankedCandidates.map((c) => ({
          ...c,
          positionId: p.positionId,
          positionName: p.positionName,
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

    const avgSelectionsPerBallot = (summary.totalBallotsCast ?? 0) > 0
      ? (summary.totalSelectionsCast ?? 0) / (summary.totalBallotsCast ?? 1)
      : null

    const tieCount = positions.filter((p) => p.hasTie).length
    const zeroVotePositions = positions.filter((p) => p.hasZeroVotes).length
    const livePositions = [...positions].sort((a, b) => (b.totalBallotsForPosition ?? 0) - (a.totalBallotsForPosition ?? 0)).slice(0, 6)
    const lastTallyCompletedAt = tallyStatus?.completedAt
    const serverTimeLabel = summary.serverTime ? new Date(summary.serverTime).toLocaleString() : '—'
    const nextUpdateLabel = refreshCountdown !== null ? `${Math.floor(refreshCountdown / 60000)}:${String(Math.floor((refreshCountdown % 60000) / 1000)).padStart(2, '0')}` : 'Paused'
    const isLive = (summary.periodStatus || '').toUpperCase().includes('OPEN')

    const metricCards = [
      {
        label: 'Votes cast',
        value: summary.totalBallotsCast,
        icon: <HowToVoteIcon fontSize="small" />,
        available: summary.totalBallotsCast !== undefined && summary.totalBallotsCast !== null,
      },
      {
        label: 'Distinct voters',
        value: summary.totalDistinctVoters,
        icon: <SupervisorAccountIcon fontSize="small" />,
        available: summary.totalDistinctVoters !== undefined && summary.totalDistinctVoters !== null,
      },
      {
        label: 'Selections cast',
        value: summary.totalSelectionsCast,
        icon: <InsightsIcon fontSize="small" />,
        available: summary.totalSelectionsCast !== undefined && summary.totalSelectionsCast !== null,
      },
      {
        label: 'Positions',
        value: summary.totalPositions,
        icon: <EventAvailableIcon fontSize="small" />,
        available: summary.totalPositions !== undefined && summary.totalPositions !== null,
      },
      {
        label: 'Avg selections / ballot',
        value: avgSelectionsPerBallot !== null ? avgSelectionsPerBallot.toFixed(2) : null,
        icon: <TrendingUpIcon fontSize="small" />,
        available: avgSelectionsPerBallot !== null,
      },
      {
        label: 'Ties detected',
        value: tieCount,
        icon: <MilitaryTechIcon fontSize="small" />,
        available: positions.length > 0,
      },
      {
        label: 'Zero-vote positions',
        value: zeroVotePositions,
        icon: <AccessTimeIcon fontSize="small" />,
        available: positions.length > 0,
      },
      {
        label: 'Period status',
        value: summary.periodStatus || election?.status || null,
        icon: <EventAvailableIcon fontSize="small" />,
        available: Boolean(summary.periodStatus || election?.status),
      },
    ].filter((card) => card.available)

    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Paper
          sx={{
            p: { xs: 2.5, md: 3 },
            position: 'relative',
            overflow: 'hidden',
            background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.9)} 100%)`,
            color: 'common.white',
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="overline" sx={{ letterSpacing: 1 }}>Live tally dashboard</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{election.name || 'Election results'}</Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {summary.totalPositions ?? 0} positions · {summary.totalBallotsCast ?? 0} ballots · {summary.totalDistinctVoters ?? 0} voters
              </Typography>
              {summary.serverTime && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Updated at {new Date(summary.serverTime).toLocaleString()}
                </Typography>
              )}
            </Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ flexWrap: 'wrap' }}>
              <StatusChip status={(election.status || 'pending') as any} />
              <Chip size="small" color="default" variant="filled" label={`Period: ${summary.periodStatus || '—'}`} sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'common.white' }} />
              <Chip size="small" color={isLive ? 'success' : 'default'} variant="filled" label={isLive ? 'Live updates' : 'Paused'} sx={{ bgcolor: isLive ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.14)', color: 'common.white' }} />
              <Chip
                size="small"
                color="secondary"
                variant="filled"
                label={`Next update: ${nextUpdateLabel}`}
                icon={<AccessTimeIcon fontSize="small" />}
                sx={{ bgcolor: 'rgba(0,0,0,0.25)' }}
              />
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
              gap: 1.5,
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
            }}
          >
            {metricCards.slice(0, 4).map((card) => (
              <Box key={card.label} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'inherit' }}>
                  {card.icon}
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{card.label}</Typography>
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{card.value}</Typography>
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
          <Paper sx={{ p: 2, display: 'grid', gap: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <InsightsIcon fontSize="small" />
              <Typography variant="h6">Key metrics</Typography>
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              {metricCards.map((card) => (
                <Paper key={card.label} elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.100' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {card.icon}
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{card.label}</Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{card.value}</Typography>
                </Paper>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 2, display: 'grid', gap: 1.25 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeIcon fontSize="small" />
              <Typography variant="h6">Period health</Typography>
            </Stack>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Voting period</Typography>
                <Chip size="small" label={summary.periodStatus || '—'} color="primary" variant="outlined" />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Server time</Typography>
                <Typography variant="body2">{serverTimeLabel}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Next refresh</Typography>
                <Typography variant="body2">{nextUpdateLabel}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Tally status</Typography>
                <Typography variant="body2">{tallyStatus?.status || 'Not started'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Positions certified</Typography>
                <Typography variant="body2">{tallyStatus?.totalPositionsCertified ?? 0}</Typography>
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
              {lastTallyCompletedAt && (
                <Typography variant="caption" color="text.secondary">
                  Last tally run: {new Date(lastTallyCompletedAt).toLocaleString()}
                </Typography>
              )}
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
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              {livePositions.map((pos) => {
                const ballots = pos.totalBallotsForPosition ?? 0
                const totalBallots = summary.totalBallotsCast ?? 0
                const percent = totalBallots > 0 ? Math.min(100, (ballots / totalBallots) * 100) : 0
                return (
                  <Paper
                    key={pos.positionId}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      borderColor: alpha('#5b21b6', 0.15),
                      background: 'linear-gradient(135deg, rgba(91, 33, 182, 0.04), rgba(59, 130, 246, 0.04))',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{pos.positionName}</Typography>
                      <Chip size="small" label={`${ballots} votes`} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Turnout vs ballots cast
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{ height: 8, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { transition: 'width 0.6s ease' } }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                      <Chip size="small" variant="outlined" label={pos.scope || '—'} />
                      <Chip size="small" variant="outlined" label={`Seats: ${pos.seats ?? '—'}`} />
                    </Stack>
                  </Paper>
                )
              })}
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
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{pos.positionName}</Typography>
                  <Chip size="small" label={`${ballots} votes`} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Position turnout compared to total ballots cast
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={percent}
                  sx={{ height: 8, borderRadius: 99, '& .MuiLinearProgress-bar': { transition: 'width 0.6s ease' } }}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" variant="outlined" label={pos.scope || '—'} />
                  <Chip size="small" variant="outlined" label={`Seats: ${pos.seats ?? '—'}`} />
                  {pos.hasTie && <Chip size="small" color="warning" label="Tie detected" />}
                  {pos.hasZeroVotes && <Chip size="small" color="error" label="Zero votes" />}
                </Stack>
              </Stack>
            </Paper>
          )
        })}
      </Box>
    )
  }

  const renderCandidateBreakdown = () => {
    if (!isAdmin) return <EmptyState title="Restricted" description="Candidate-level results are hidden during live tally." />
    if (!selectedPeriodId) return <EmptyState title="Select a voting period" description="Choose a closed voting period to view results." />
    if (positionsLoading) return <LoadingState variant="row" />
    if (filteredCandidates.length === 0) return <EmptyState title="No candidates" description="No candidates match your filters." />

    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
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
        <TableContainer>
          <Table size="small">
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
              {filteredCandidates.map((c) => (
                <TableRow key={`${c.positionId}-${c.candidateId || c.personId || c.rank}`} hover>
                  <TableCell>{c.fullName}</TableCell>
                  <TableCell>{c.positionName}</TableCell>
                  <TableCell align="right">{c.rank}</TableCell>
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
  }

  const renderTally = () => {
    if (!isAdmin) return null
    if (!selectedPeriodId) return <EmptyState title="Select a voting period" description="Tally actions require a closed voting period." />

    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
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
          ) : (
            <EmptyState title="No tally has been run" description="Run tally to lock the results." />
          )}

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
              startIcon={<AssignmentTurnedInIcon />}
              disabled
              title="Certification endpoint is not provided in the current Swagger spec"
            >
              Certify Election
            </Button>
          </Box>
          {!canTally && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Tally is enabled only after voting periods are closed. Current status: {election?.status || 'Unknown'}
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
      </Box>
    )
  }

  const renderLeadershipPreview = () => (
    <Paper sx={{ p: 2, display: 'grid', gap: 1 }}>
      <Typography variant="h6" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <SupervisorAccountIcon fontSize="small" /> Leadership Update Preview
      </Typography>
      <Alert severity="warning">
        The Swagger specification available to the UI does not expose a leadership preview or apply-winners endpoint. This section remains read-only until the backend provides those endpoints.
      </Alert>
      <Box>
        <Button variant="contained" disabled title="Awaiting backend apply-winners endpoint">
          Apply Winners to Leadership
        </Button>
      </Box>
    </Paper>
  )

  if (loading) {
    return (
      <AppShell>
        <PageLayout title="Election Results"><LoadingState /></PageLayout>
      </AppShell>
    )
  }

  if (!election) {
    return (
      <AppShell>
        <PageLayout title="Election Results">
          <EmptyState title="Election not found" description="The requested election could not be located." />
        </PageLayout>
      </AppShell>
    )
  }

  const tabs = [
    { label: 'Dashboard', render: renderSummary },
    { label: 'Position Results', render: renderPositionResults },
    ...(isAdmin ? [{ label: 'Candidate Breakdown', render: renderCandidateBreakdown }] : []),
    ...(isAdmin ? [{ label: 'Tally & Certification', render: renderTally }] : []),
    ...(isAdmin ? [{ label: 'Leadership Update Preview', render: renderLeadershipPreview }] : []),
  ]

  return (
    <AppShell>
      <PageLayout
        title={election.name || 'Election Results'}
        subtitle="Closed voting period results, tallying, and leadership updates"
        actions={(
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(isAdmin ? '/admin/elections' : '/ds/elections')}>
            Back to Elections
          </Button>
        )}
      >
        <Paper sx={{ p: 2, mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <StatusChip status={(election.status || 'pending') as any} />
            <Chip size="small" label={`Scope: ${election.scope || '—'}`} />
            {election.termStartDate && <Chip size="small" label={`Term start: ${new Date(election.termStartDate).toLocaleDateString()}`} />}
            {election.termEndDate && <Chip size="small" label={`Term end: ${new Date(election.termEndDate).toLocaleDateString()}`} />}
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

        <Paper sx={{ mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            {tabs.map((t) => (
              <Tab key={t.label} label={t.label} />
            ))}
          </Tabs>
        </Paper>

        <Box sx={{ p: 1 }}>{tabs[tab]?.render()}</Box>
      </PageLayout>

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
    </AppShell>
  )
}

export default ElectionResultsPage
