import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Autocomplete,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import StatusChip from '../components/common/StatusChip'
import { electionApi } from '../api/election.api'
import { useToast } from '../components/feedback/ToastProvider'
import { useAuth } from '../context/AuthContext'
import type { Election, VotingPeriod } from '../types/election'
import { ElectionResultsView } from './ElectionResultsPage'

const ResultsLandingPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))
  const [elections, setElections] = useState<Election[]>([])
  const [votingPeriods, setVotingPeriods] = useState<VotingPeriod[]>([])
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<VotingPeriod | null>(null)
  const [loadingElections, setLoadingElections] = useState(true)
  const [loadingPeriods, setLoadingPeriods] = useState(false)

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

  const autoSelectElection = (electionList: Election[]) => {
    if (electionList.length === 0) return null
    const now = new Date()
    const withinDateRange = electionList.find(
      (e) => e.votingStartAt && e.votingEndAt &&
        new Date(e.votingStartAt) <= now &&
        now <= new Date(e.votingEndAt)
    )
    if (withinDateRange) return withinDateRange
    return [...electionList].sort((a, b) => {
      const aDate = a.votingStartAt ? new Date(a.votingStartAt).getTime() : 0
      const bDate = b.votingStartAt ? new Date(b.votingStartAt).getTime() : 0
      return bDate - aDate
    })[0]
  }

  const autoSelectVotingPeriod = (periodList: VotingPeriod[]) => {
    if (periodList.length === 0) return null
    const now = new Date()
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
      const found = elections.find((e) => String(e.id) === electionIdParam)
      if (found) {
        setSelectedElection(found)
        loadPeriods(found.id)
      }
    } else {
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
  }, [elections])

  useEffect(() => {
    if (votingPeriods.length === 0) return

    const votingPeriodId = searchParams.get('votingPeriodId')
    if (votingPeriodId) {
      const found = votingPeriods.find((p) => String(p.id) === votingPeriodId)
      if (found) setSelectedPeriod(found)
    } else {
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

  const selectionReady = Boolean(selectedElection)

  return (
    <AppShell>
      <PageLayout
        title={selectedElection?.name || 'Results & Tally'}
        subtitle={selectedElection
          ? 'Closed voting period results, tallying, and leadership updates.'
          : 'Select an election and voting period to view live results, tallying, and certification.'}
      >
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
          </Box>
        </Paper>

        {!selectionReady ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Select an election to view results and tallying.</Typography>
          </Paper>
        ) : (
          <ElectionResultsView
            electionId={selectedElection?.id}
            initialVotingPeriodId={selectedPeriod?.id}
            showLayout={false}
            showInternalSelectors={false}
            hideBackButton
          />
        )}
      </PageLayout>
    </AppShell>
  )
}

export default ResultsLandingPage
