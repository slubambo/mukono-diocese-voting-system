import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Paper, Tab, Tabs, Typography, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Chip, Stack } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Button } from '@mui/material'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import LoadingState from '../components/common/LoadingState'
import StatusChip from '../components/common/StatusChip'
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
            {isAdmin ? (
              <>
                <IconButton onClick={handleEdit}><EditIcon /></IconButton>
                <IconButton onClick={() => { setCancelReason(''); setCancelOpen(true) }}><CancelIcon /></IconButton>
              </>
            ) : null}
          </>
        )}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <StatusChip status={election.status || 'pending'} />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip label={`Scope: ${election.scope || '—'}`} size="small" />
            <Chip label={`Target: ${getTargetLabel()}`} size="small" />
            <Chip label={`Fellowship: ${election.fellowship?.name || election.fellowshipName || 'All fellowships'}`} size="small" />
          </Stack>
          {election.termStartDate && <Typography>Term Start: {new Date(election.termStartDate).toLocaleDateString()}</Typography>}
          {election.termEndDate && <Typography>Term End: {new Date(election.termEndDate).toLocaleDateString()}</Typography>}
          {election.votingStartAt && <Typography>Voting Start: {new Date(election.votingStartAt).toLocaleString()}</Typography>}
          {election.votingEndAt && <Typography>Voting End: {new Date(election.votingEndAt).toLocaleString()}</Typography>}
        </Box>

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
          {tab === 2 && <VotingPeriodsTab electionId={electionId!} />}
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
