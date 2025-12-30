import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import { electionApi } from '../api/election.api'
import { useToast } from '../components/feedback/ToastProvider'
import EligibilityTab from '../components/eligibility/EligibilityTab'
import CodesTab from '../components/eligibility/CodesTab'
import PeriodPositionsTab from '../components/eligibility/PeriodPositionsTab'
import StatusChip from '../components/common/StatusChip'
import LoadingState from '../components/common/LoadingState'
import type { BallotPreviewResponse, Election, VotingPeriod } from '../types/election'
import { useAuth } from '../context/AuthContext'

const EligibilityCodesPage: React.FC = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const isAdmin = useMemo(() => Boolean(user?.roles?.includes('ROLE_ADMIN')), [user])

  const [tab, setTab] = useState(0)
  const [elections, setElections] = useState<Election[]>([])
  const [votingPeriods, setVotingPeriods] = useState<VotingPeriod[]>([])
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<VotingPeriod | null>(null)
  const [loadingElections, setLoadingElections] = useState(true)
  const [loadingPeriods, setLoadingPeriods] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<BallotPreviewResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const loadElections = async () => {
    setLoadingElections(true)
    try {
      const res = await electionApi.list({ page: 0, size: 100, sort: 'name,asc' } as any)
      const content = (res as any)?.content ?? res ?? []
      setElections(Array.isArray(content) ? content : [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load elections')
    } finally {
      setLoadingElections(false)
    }
  }

  const loadPeriods = async (electionId: number | string) => {
    setLoadingPeriods(true)
    try {
      const res = await electionApi.listVotingPeriods(electionId)
      const content = (res as any)?.content ?? res ?? []
      setVotingPeriods(Array.isArray(content) ? content : [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load voting periods')
      setVotingPeriods([])
    } finally {
      setLoadingPeriods(false)
    }
  }

  useEffect(() => {
    loadElections()
  }, [])

  useEffect(() => {
    const electionIdParam = searchParams.get('electionId')
    if (electionIdParam && elections.length > 0) {
      const found = elections.find((e) => String(e.id) === electionIdParam)
      if (found) {
        setSelectedElection(found)
        loadPeriods(found.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, elections])

  useEffect(() => {
    const votingPeriodId = searchParams.get('votingPeriodId')
    if (votingPeriodId && votingPeriods.length > 0) {
      const found = votingPeriods.find((p) => String(p.id) === votingPeriodId)
      if (found) setSelectedPeriod(found)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, votingPeriods])

  const handleElectionChange = (_: any, value: Election | null) => {
    setSelectedElection(value)
    setSelectedPeriod(null)
    if (value?.id) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('electionId', String(value.id))
        next.delete('votingPeriodId')
        return next
      })
      loadPeriods(value.id)
    } else {
      setVotingPeriods([])
      setSearchParams(new URLSearchParams())
    }
  }

  const handleVotingPeriodChange = (_: any, value: VotingPeriod | null) => {
    setSelectedPeriod(value)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value?.id) {
        next.set('votingPeriodId', String(value.id))
      } else {
        next.delete('votingPeriodId')
      }
      return next
    })
  }

  const openElectionDetail = () => {
    if (!selectedElection?.id) return
    const base = isAdmin ? '/admin' : '/ds'
    navigate(`${base}/elections/${selectedElection.id}`)
  }

  const openPreview = async () => {
    if (!selectedElection?.id) return
    setPreviewOpen(true)
    setPreviewLoading(true)
    try {
      const res = await electionApi.ballotPreview(selectedElection.id, selectedPeriod?.id ? { votingPeriodId: Number(selectedPeriod.id) } : {})
      setPreview(res)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load ballot preview')
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const selectionReady = Boolean(selectedElection)
  const votingPeriodReady = Boolean(selectedElection && selectedPeriod)

  return (
    <AppShell>
      <PageLayout
        title="Eligibility & Codes"
        subtitle="Prepare voting day operations: verify eligibility, manage overrides, and issue voting codes."
      >
        <Paper sx={{ p: 2, position: 'sticky', top: 0, zIndex: 1, mb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Autocomplete
              sx={{ minWidth: 260, flex: 1 }}
              loading={loadingElections}
              options={elections}
              getOptionLabel={(option) => option.name}
              value={selectedElection}
              onChange={handleElectionChange}
              renderInput={(params) => <TextField {...params} label="Election" placeholder="Select election" />}
            />
            <Autocomplete
              sx={{ minWidth: 240, flex: 1 }}
              loading={loadingPeriods}
              options={votingPeriods}
              getOptionLabel={(option) => option.name || option.label || `Period ${option.id}`}
              value={selectedPeriod}
              onChange={handleVotingPeriodChange}
              disabled={!selectedElection}
              renderInput={(params) => <TextField {...params} label="Voting period" placeholder="Select period" />}
            />
            {selectedPeriod?.status && (
              <StatusChip status={(selectedPeriod.status as any) || 'inactive'} label={`Status: ${selectedPeriod.status}`} />
            )}
            <Button
              startIcon={<OpenInNewIcon />}
              onClick={openElectionDetail}
              disabled={!selectedElection}
            >
              Open Election Detail
            </Button>
            <Button
              startIcon={<VisibilityIcon />}
              onClick={openPreview}
              disabled={!selectedElection}
            >
              Ballot Preview
            </Button>
          </Box>
        </Paper>

        {!selectionReady ? (
          <Paper sx={{ p: 3 }}>
            <Typography>Select an election to continue.</Typography>
          </Paper>
        ) : (
          <>
            <Paper sx={{ mb: 2 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab label="Eligibility" />
                <Tab label="Voting Codes" />
                <Tab label="Today’s Positions" />
              </Tabs>
            </Paper>

            {tab === 0 && selectedElection && (
              <EligibilityTab electionId={selectedElection.id} isAdmin={isAdmin} />
            )}
            {tab === 1 && (
              votingPeriodReady ? (
                <CodesTab
                  electionId={selectedElection!.id}
                  votingPeriodId={selectedPeriod!.id}
                  isAdmin={isAdmin}
                  votingPeriodStatus={selectedPeriod?.status}
                />
              ) : (
                <Paper sx={{ p: 3 }}>
                  <Typography>Select a voting period to manage codes.</Typography>
                </Paper>
              )
            )}
            {tab === 2 && (
              votingPeriodReady ? (
                <PeriodPositionsTab electionId={selectedElection!.id} votingPeriodId={selectedPeriod!.id} />
              ) : (
                <Paper sx={{ p: 3 }}>
                  <Typography>Select a voting period to view positions.</Typography>
                </Paper>
              )
            )}
          </>
        )}
      </PageLayout>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Ballot Preview</DialogTitle>
        <DialogContent>
          {previewLoading ? (
            <LoadingState />
          ) : !preview ? (
            <Typography>No preview available.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gap: 2 }}>
              {(preview.positions || []).map((pos) => (
                <Paper key={String(pos.electionPositionId)} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                    <Typography variant="h6">{pos.positionTitle || 'Position'}</Typography>
                    {pos.fellowshipName && <Chip size="small" label={pos.fellowshipName} />}
                    {pos.scope && <Chip size="small" label={pos.scope} />}
                    {typeof pos.seats === 'number' && <Chip size="small" label={`${pos.seats} seat${pos.seats === 1 ? '' : 's'}`} />}
                  </Box>
                  {(pos.candidates || []).length === 0 ? (
                    <Typography variant="body2">No candidates.</Typography>
                  ) : (
                    (pos.candidates || []).map((c) => (
                      <Typography key={String(c.candidateId)} variant="body2">- {c.fullName}</Typography>
                    ))
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  )
}

export default EligibilityCodesPage
