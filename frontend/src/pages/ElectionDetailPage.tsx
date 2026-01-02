import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Paper, Tab, Tabs, Typography, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Chip, Stack } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Button } from '@mui/material'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import LoadingState from '../components/common/LoadingState'
import { electionApi } from '../api/election.api'
import { useToast } from '../components/feedback/ToastProvider'
import { useAuth } from '../context/AuthContext'
import PositionsTab from '../components/elections/PositionsTab'
import ApplicantsTab from '../components/elections/ApplicantsTab'
import CandidatesTab from '../components/elections/CandidatesTab'
import BallotPreviewTab from '../components/elections/BallotPreviewTab'
import VotingPeriodsTab from '../components/elections/VotingPeriodsTab'

const ElectionDetailPage: React.FC = () => {
  const { electionId } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))

  const [loading, setLoading] = useState(true)
  const [election, setElection] = useState<any>(null)
  const [tab, setTab] = useState(0)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [periodSummaries, setPeriodSummaries] = useState<Array<{ id: number | string; name: string; positionsCount: number }>>([])

  const fetch = async () => {
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

  useEffect(() => { fetch() }, [electionId])

  useEffect(() => {
    const loadSummaries = async () => {
      if (!electionId || !isAdmin) return
      try {
        const res = await electionApi.listVotingPeriods(electionId)
        const periods = (res as any)?.content ?? res ?? []
        const summaries = await Promise.all(
          (periods as any[]).map(async (p) => {
            try {
              const positions = await electionApi.getVotingPeriodPositions(electionId, p.id)
              const count = positions.electionPositionIds?.length ?? 0
              return { id: p.id, name: p.name || p.label || `Period ${p.id}`, positionsCount: count }
            } catch (err) {
              return { id: p.id, name: p.name || p.label || `Period ${p.id}`, positionsCount: 0 }
            }
          })
        )
        setPeriodSummaries(summaries)
      } catch (err) {
        setPeriodSummaries([])
      }
    }
    loadSummaries()
  }, [electionId, isAdmin])

  const getTargetLabel = () => {
    if (!election?.scope) return '—'
    if (election.scope === 'DIOCESE') return election.dioceseId ? `Diocese #${election.dioceseId}` : '—'
    if (election.scope === 'ARCHDEACONRY') return election.archdeaconryId ? `Archdeaconry #${election.archdeaconryId}` : '—'
    if (election.scope === 'CHURCH') return election.churchId ? `Church #${election.churchId}` : '—'
    return '—'
  }

  const calcDays = (start?: string, end?: string): number | null => {
    if (!start || !end) return null
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    if (Number.isNaN(s) || Number.isNaN(e)) return null
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24))
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' })
    const month = date.toLocaleDateString('en-GB', { month: 'long' })
    const day = date.getDate()
    const time = date
      .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
      .toLowerCase()
      .replace(':00', '')
    const ordinal = (n: number) => {
      const mod100 = n % 100
      if (mod100 >= 11 && mod100 <= 13) return `${n}th`
      switch (n % 10) {
        case 1: return `${n}st`
        case 2: return `${n}nd`
        case 3: return `${n}rd`
        default: return `${n}th`
      }
    }
    return `${weekday}, ${ordinal(day)} ${month} ${time}`
  }

  const formatTermDuration = (start?: string | null, end?: string | null) => {
    const days = calcDays(start ?? undefined, end ?? undefined)
    if (days === null) return '—'
    if (days >= 365) {
      const years = Math.round(days / 365)
      return `${years} ${years === 1 ? 'Year' : 'Years'}`
    }
    if (days >= 30) {
      const months = Math.round(days / 30)
      return `${months} ${months === 1 ? 'Month' : 'Months'}`
    }
    if (days >= 7) {
      const weeks = Math.round(days / 7)
      return `${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`
    }
    return `${days} ${days === 1 ? 'Day' : 'Days'}`
  }

  const formatVotingDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return '—'
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    if (Number.isNaN(s) || Number.isNaN(e)) return '—'
    const ms = e - s
    const hours = ms / (1000 * 60 * 60)
    if (hours < 24) {
      const rounded = Math.round(hours)
      return `${rounded} ${rounded === 1 ? 'Hour' : 'Hours'}`
    }
    const days = Math.round(hours / 24)
    if (days >= 7) {
      const weeks = Math.round(days / 7)
      return `${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`
    }
    return `${days} ${days === 1 ? 'Day' : 'Days'}`
  }

  const statusChipProps = useMemo(() => {
    const status = String(election?.status || '').toUpperCase()
    if (status === 'ACTIVE') return { color: 'success' as const, variant: 'filled' as const }
    if (status === 'DRAFT') return { color: 'default' as const, variant: 'outlined' as const }
    if (status === 'CANCELLED') return { color: 'error' as const, variant: 'filled' as const }
    if (status === 'VOTING_OPEN') return { color: 'primary' as const, variant: 'filled' as const }
    if (status === 'VOTING_CLOSED') return { color: 'warning' as const, variant: 'filled' as const }
    return { color: 'default' as const, variant: 'outlined' as const }
  }, [election?.status])

  const scopeChipColor = useMemo(() => {
    const scope = String(election?.scope || '').toUpperCase()
    if (scope === 'DIOCESE') return 'primary' as const
    if (scope === 'ARCHDEACONRY') return 'warning' as const
    if (scope === 'CHURCH') return 'secondary' as const
    return 'default' as const
  }, [election?.scope])

  const targetChipColor = useMemo(() => {
    const scope = String(election?.scope || '').toUpperCase()
    if (scope === 'DIOCESE') return 'primary' as const
    if (scope === 'ARCHDEACONRY') return 'warning' as const
    if (scope === 'CHURCH') return 'secondary' as const
    return 'default' as const
  }, [election?.scope])

  const fellowshipChipColor = election?.fellowship?.name || election?.fellowshipName ? ('info' as const) : ('default' as const)

  const handleEdit = () => {
    // navigate to admin edit route - reuse list edit dialog would be better; for now redirect to list and open edit
    navigate('/admin/elections')
  }

  const handleCancel = async () => {
    if (!electionId) return
    if (!cancelReason.trim()) {
      toast.error('Cancellation reason is required')
      return
    }
    try {
      await electionApi.cancel(electionId, { reason: cancelReason.trim() })
      toast.success('Election cancelled')
      setCancelOpen(false)
      setCancelReason('')
      fetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel election')
    }
  }

  if (loading) return (
    <AppShell>
      <PageLayout title="Election"> <LoadingState /> </PageLayout>
    </AppShell>
  )

  if (!election) return (
    <AppShell>
      <PageLayout title="Election"> <Paper sx={{ p: 3 }}><Typography>Election not found</Typography></Paper> </PageLayout>
    </AppShell>
  )

  return (
    <AppShell>
      <PageLayout
        title={election.name}
        subtitle={election.description}
        actions={(
          <>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(isAdmin ? '/admin/elections' : '/ds/elections')}>Back</Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircleIcon />}
              onClick={() => navigate(isAdmin ? `/admin/elections/${electionId}/results` : `/ds/elections/${electionId}/results`)}
            >
              Results & Tally
            </Button>
            {isAdmin ? (
              <>
                <IconButton onClick={handleEdit}><EditIcon /></IconButton>
                <IconButton onClick={() => { setCancelReason(''); setCancelOpen(true) }}><CancelIcon /></IconButton>
              </>
            ) : null}
          </>
        )}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          <Chip
            label={String(election.status || 'PENDING')}
            size="small"
            color={statusChipProps.color}
            variant={statusChipProps.variant}
          />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip label={`Scope: ${election.scope || '—'}`} size="small" color={scopeChipColor} variant="outlined" />
            <Chip label={`Target: ${getTargetLabel()}`} size="small" color={targetChipColor} variant="outlined" />
            <Chip
              label={`Fellowship: ${election.fellowship?.name || election.fellowshipName || 'All'}`}
              size="small"
              color={fellowshipChipColor}
              variant={fellowshipChipColor === 'default' ? 'outlined' : 'filled'}
            />
          </Stack>
        </Box>

        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>Term Dates</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {election.termStartDate && election.termEndDate
                  ? `${formatDateTime(election.termStartDate)} – ${formatDateTime(election.termEndDate)}`
                  : election.termStartDate
                    ? formatDateTime(election.termStartDate)
                    : '—'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Duration: {formatTermDuration(election.termStartDate, election.termEndDate)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>Voting Period</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {election.votingStartAt && election.votingEndAt
                  ? `${formatDateTime(election.votingStartAt)} – ${formatDateTime(election.votingEndAt)}`
                  : election.votingStartAt
                    ? formatDateTime(election.votingStartAt)
                    : '—'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Duration: {formatVotingDuration(election.votingStartAt, election.votingEndAt)}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Overview" />
            <Tab label="Positions" />
            <Tab label="Voting Periods" />
            <Tab label="Applicants" />
            <Tab label="Candidates" />
            <Tab label="Ballot Preview" />
          </Tabs>
        </Paper>

        <Paper sx={{ p: 2 }}>
          {tab === 0 && (
            <Box>
              <Typography variant="h6">Overview</Typography>
              <Typography>{election.description}</Typography>
              {isAdmin && periodSummaries.length > 0 && (
                <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
                  <Typography variant="subtitle2">Voting period positions</Typography>
                  {periodSummaries.map((p) => (
                    <Typography key={String(p.id)} variant="body2">
                      {p.name}: {p.positionsCount} position{p.positionsCount === 1 ? '' : 's'}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {tab === 1 && <PositionsTab electionId={electionId!} isAdmin={isAdmin} />}
          {tab === 2 && <VotingPeriodsTab electionId={electionId!} electionStart={election.votingStartAt} electionEnd={election.votingEndAt} />}
          {tab === 3 && <ApplicantsTab electionId={electionId!} />}
          {tab === 4 && <CandidatesTab electionId={electionId!} />}
          {tab === 5 && <BallotPreviewTab electionId={electionId!} />}
        </Paper>

        <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="sm">
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
            <Button onClick={() => setCancelOpen(false)}>Close</Button>
            <Button variant="contained" color="error" onClick={handleCancel}>Cancel Election</Button>
          </DialogActions>
        </Dialog>
      </PageLayout>
    </AppShell>
  )
}

export default ElectionDetailPage
