import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Paper, Tab, Tabs, Typography, IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CancelIcon from '@mui/icons-material/Cancel'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import LoadingState from '../components/common/LoadingState'
import StatusChip from '../components/common/StatusChip'
import { electionApi } from '../api/election.api'
import { useToast } from '../components/feedback/ToastProvider'
import { useAuth } from '../context/AuthContext'
import PositionsTab from '../components/elections/PositionsTab'

const ElectionDetailPage: React.FC = () => {
  const { electionId } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))

  const [loading, setLoading] = useState(true)
  const [election, setElection] = useState<any>(null)
  const [tab, setTab] = useState(0)

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

  const handleEdit = () => {
    // navigate to admin edit route - reuse list edit dialog would be better; for now redirect to list and open edit
    navigate('/admin/elections')
  }

  const handleCancel = async () => {
    if (!electionId) return
    if (!confirm('Cancel this election? This action cannot be undone.')) return
    try {
      await electionApi.cancel(electionId)
      toast.success('Election cancelled')
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
        actions={isAdmin ? (<>
          <IconButton onClick={handleEdit}><EditIcon /></IconButton>
          <IconButton onClick={handleCancel}><CancelIcon /></IconButton>
        </>) : undefined}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <StatusChip status={election.status || 'pending'} />
          {election.startDate && <Typography>Start: {new Date(election.startDate).toLocaleString()}</Typography>}
          {election.endDate && <Typography>End: {new Date(election.endDate).toLocaleString()}</Typography>}
        </Box>

        <Paper sx={{ mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Overview" />
            <Tab label="Positions" />
          </Tabs>
        </Paper>

        <Paper sx={{ p: 2 }}>
          {tab === 0 && (
            <Box>
              <Typography variant="h6">Overview</Typography>
              <Typography>{election.description}</Typography>
            </Box>
          )}

          {tab === 1 && (
            <PositionsTab electionId={electionId!} isAdmin={isAdmin} />
          )}
        </Paper>
      </PageLayout>
    </AppShell>
  )
}

export default ElectionDetailPage
