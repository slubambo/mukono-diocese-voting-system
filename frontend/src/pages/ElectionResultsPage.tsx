import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
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
  MenuItem,
  Paper,
  Select,
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
  Stack,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import LoadingState from '../components/common/LoadingState'
import EmptyState from '../components/common/EmptyState'
import StatusChip from '../components/common/StatusChip'
import { electionApi } from '../api/election.api'
import resultsApi, {
  ElectionResultsSummaryResponse,
  PositionResultsResponse,
  RunTallyResponse,
  TallyStatusResponse,
} from '../api/results.api'
import { useToast } from '../components/feedback/ToastProvider'
import { useAuth } from '../context/AuthContext'
import type { VotingPeriod } from '../types/election'

const DS_ROLES = ['ROLE_DS', 'ROLE_BISHOP', 'ROLE_SENIOR_STAFF', 'ROLE_POLLING_OFFICER']

interface RankedCandidate {
  candidateId?: number
  personId?: number
  fullName?: string
  voteCount?: number
  voteSharePercent?: number
  rank: number
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
  const isDs = Boolean(user?.roles?.some((r) => DS_ROLES.includes(r)))

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

    const cards = [
      { label: 'Total votes cast', value: summary.totalBallotsCast ?? 0 },
      { label: 'Distinct voters', value: summary.totalDistinctVoters ?? 0 },
      { label: 'Positions', value: summary.totalPositions ?? 0 },
      { label: 'Selections cast', value: summary.totalSelectionsCast ?? 0 },
      { label: 'Status', value: summary.periodStatus || '—' },
      { label: 'Server time', value: summary.serverTime ? new Date(summary.serverTime).toLocaleString() : '—' },
    ]

    return (
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
        {cards.map((card) => (
          <Paper key={card.label} sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>{card.label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{card.value}</Typography>
          </Paper>
        ))}
      </Box>
    )
  }

  const renderPositionResults = () => {
    if (!selectedPeriodId) return <EmptyState title="Select a voting period" description="Choose a closed voting period to view results." />
    if (positionsLoading) return <LoadingState variant="row" />
    if (positions.length === 0) return <EmptyState title="No position results" description="No results were returned for this voting period." />

    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        {positions.map((pos) => (
          <Paper key={pos.positionId} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">{pos.positionName}</Typography>
              <Chip size="small" label={pos.scope || '—'} />
              <Chip size="small" label={`Seats: ${pos.seats ?? '—'}`} />
              {pos.hasTie && <Chip size="small" color="warning" label="Tie detected" />}
              {pos.hasZeroVotes && <Chip size="small" color="error" label="Zero votes" />}
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell align="right">Votes</TableCell>
                    <TableCell align="right">Vote %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pos.rankedCandidates.map((c) => (
                    <TableRow key={`${pos.positionId}-${c.candidateId || c.personId || c.rank}`} hover>
                      <TableCell>{c.rank}</TableCell>
                      <TableCell>{c.fullName}</TableCell>
                      <TableCell align="right">{c.voteCount ?? 0}</TableCell>
                      <TableCell align="right">
                        {typeof c.voteSharePercent === 'number' ? `${c.voteSharePercent.toFixed(2)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))}
      </Box>
    )
  }

  const renderCandidateBreakdown = () => {
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
    { label: 'Summary', render: renderSummary },
    { label: 'Position Results', render: renderPositionResults },
    { label: 'Candidate Breakdown', render: renderCandidateBreakdown },
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
