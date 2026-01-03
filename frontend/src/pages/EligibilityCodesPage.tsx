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
import UnifiedEligibleVotersCodesTab from '../components/eligibility/UnifiedEligibleVotersCodesTab.tsx'
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

  // Auto-select election: first try current date within voting period, fallback to most recent
  const autoSelectElection = (electionList: Election[]) => {
    if (electionList.length === 0) return null
    const now = new Date()
    const withinDateRange = electionList.find(
      (e) => e.votingStartAt && e.votingEndAt &&
        new Date(e.votingStartAt) <= now &&
        now <= new Date(e.votingEndAt)
    )
    if (withinDateRange) return withinDateRange
    // Fallback: most recent by voting start date
    return [...electionList].sort((a, b) => {
      const aDate = a.votingStartAt ? new Date(a.votingStartAt).getTime() : 0
      const bDate = b.votingStartAt ? new Date(b.votingStartAt).getTime() : 0
      return bDate - aDate
    })[0]
  }

  // Auto-select voting period: first try closest to current time, fallback to most recent
  const autoSelectVotingPeriod = (periodList: VotingPeriod[]) => {
    if (periodList.length === 0) return null
    const now = new Date()
    // Find closest period to current time using startAt field if available
    const closest = [...periodList].sort((a, b) => {
      const aDate = (a as any).startAt ? new Date((a as any).startAt).getTime() : Number.MAX_VALUE
      const bDate = (b as any).startAt ? new Date((b as any).startAt).getTime() : Number.MAX_VALUE
      return Math.abs(aDate - now.getTime()) - Math.abs(bDate - now.getTime())
    })[0]
    return closest
  }

  useEffect(() => {
    loadElections()
  }, [])

  useEffect(() => {
    if (elections.length === 0) return
    
    const electionIdParam = searchParams.get('electionId')
    if (electionIdParam) {
      // Load from param
      const found = elections.find((e) => String(e.id) === electionIdParam)
      if (found) {
        setSelectedElection(found)
        loadPeriods(found.id)
      }
    } else {
      // Auto-select election
      const autoElection = autoSelectElection(elections)
      if (autoElection) {
        setSelectedElection(autoElection)
        loadPeriods(autoElection.id)
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.set('electionId', String(autoElection.id))
          return next
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elections])

  useEffect(() => {
    if (votingPeriods.length === 0) return
    
    const votingPeriodId = searchParams.get('votingPeriodId')
    if (votingPeriodId) {
      // Load from param
      const found = votingPeriods.find((p) => String(p.id) === votingPeriodId)
      if (found) setSelectedPeriod(found)
    } else {
      // Auto-select voting period
      const autoPeriod = autoSelectVotingPeriod(votingPeriods)
      if (autoPeriod) {
        setSelectedPeriod(autoPeriod)
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.set('votingPeriodId', String(autoPeriod.id))
          return next
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votingPeriods])

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
        {/* Selection Controls - Compact and Sticky */}
        <Paper sx={{ p: 1.5, position: 'sticky', top: 0, zIndex: 10, mb: 3, boxShadow: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <Autocomplete
              sx={{ minWidth: 240, flex: { xs: 1, sm: 'auto' } }}
              loading={loadingElections}
              options={elections}
              getOptionLabel={(option) => option.name}
              value={selectedElection}
              onChange={handleElectionChange}
              size="small"
              renderInput={(params) => <TextField {...params} label="Election" />}
            />
            <Autocomplete
              sx={{ minWidth: 200, flex: { xs: 1, sm: 'auto' } }}
              loading={loadingPeriods}
              options={votingPeriods}
              getOptionLabel={(option) => option.name || option.label || `Period ${option.id}`}
              value={selectedPeriod}
              onChange={handleVotingPeriodChange}
              disabled={!selectedElection}
              size="small"
              renderInput={(params) => <TextField {...params} label="Voting Period" />}
            />
            {selectedPeriod?.status && (
              <StatusChip status={(selectedPeriod.status as any) || 'inactive'} label={selectedPeriod.status} />
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              startIcon={<OpenInNewIcon />}
              onClick={openElectionDetail}
              disabled={!selectedElection}
              variant="outlined"
            >
              Election Detail
            </Button>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={openPreview}
              disabled={!selectedElection}
              variant="outlined"
            >
              Ballot Preview
            </Button>
          </Box>
        </Paper>

        {!selectionReady ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Select an election to continue.</Typography>
          </Paper>
        ) : (
          <>
            {/* Tab Navigation - Compact */}
            <Paper sx={{ mb: 2 }}>
              <Tabs 
                value={tab} 
                onChange={(_, v) => setTab(v)} 
                variant="scrollable" 
                scrollButtons="auto"
                sx={{ '& .MuiTab-root': { py: 1, minHeight: 'auto' } }}
              >
                <Tab label="Eligible Voters & Codes" />
                <Tab label="Eligibility" />
              </Tabs>
            </Paper>

            {/* Tab Content */}
            {tab === 0 && selectedElection && selectedPeriod && (
              votingPeriodReady ? (
                <UnifiedEligibleVotersCodesTab 
                  electionId={selectedElection.id} 
                  votingPeriodId={selectedPeriod.id}
                  isAdmin={isAdmin}
                  votingPeriodStatus={selectedPeriod.status}
                />
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">Select a voting period to view eligible voters and manage codes.</Typography>
                </Paper>
              )
            )}
            {tab === 1 && selectedElection && (
              <EligibilityTab electionId={selectedElection.id} isAdmin={isAdmin} />
            )}
          </>
        )}
      </PageLayout>

      {/* Ballot Preview Dialog */}
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
                <Paper key={String(pos.electionPositionId)} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                    <Typography variant="h6">{pos.positionTitle || 'Position'}</Typography>
                    {pos.fellowshipName && <Chip size="small" label={pos.fellowshipName} />}
                    {pos.scope && <Chip size="small" label={pos.scope} />}
                    {typeof pos.seats === 'number' && <Chip size="small" label={`${pos.seats} seat${pos.seats === 1 ? '' : 's'}`} />}
                  </Box>
                  {(pos.candidates || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No candidates.</Typography>
                  ) : (
                    (pos.candidates || []).map((c) => (
                      <Typography key={String(c.candidateId)} variant="body2">
                        • {c.fullName}
                      </Typography>
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
