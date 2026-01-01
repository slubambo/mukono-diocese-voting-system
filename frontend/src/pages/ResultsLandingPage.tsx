import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Stack,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import LoadingState from '../components/common/LoadingState'
import EmptyState from '../components/common/EmptyState'
import StatusChip from '../components/common/StatusChip'
import { electionApi } from '../api/election.api'
import { useToast } from '../components/feedback/ToastProvider'
import { useAuth } from '../context/AuthContext'
import type { Election } from '../types/election'

const RESULT_STATUSES = ['CLOSED', 'TALLIED', 'COMPLETED', 'PUBLISHED', 'VOTING_CLOSED']

const ResultsLandingPage: React.FC = () => {
  const { user } = useAuth()
  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))
  const navigate = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Election[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await electionApi.list({ size: 200, page: 0 })
        const content = (res as any)?.content ?? (res as any) ?? []
        setItems(content)
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load elections')
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [toast])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return items
      .filter((e) => !e.status || RESULT_STATUSES.includes((e.status as string).toUpperCase()))
      .filter((e) => !term || (e.name || '').toLowerCase().includes(term))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  }, [items, search])

  const handleView = (id: string | number) => {
    navigate(isAdmin ? `/admin/elections/${id}/results` : `/ds/elections/${id}/results`)
  }

  return (
    <AppShell>
      <PageLayout
        title="Results & Tally"
        subtitle="Closed and tallied elections"
      >
        <Paper sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Search elections"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Chip size="small" label="Showing closed/tallied elections" />
        </Paper>

        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState title="No closed or tallied elections" description="When an election is closed, it will appear here for results and tallying." />
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Term</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((election) => (
                  <TableRow key={election.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={600}>{election.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell><StatusChip status={(election.status || 'pending') as any} /></TableCell>
                    <TableCell>{election.scope || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {election.termStartDate ? new Date(election.termStartDate).toLocaleDateString() : '—'}
                        {' '}–{' '}
                        {election.termEndDate ? new Date(election.termEndDate).toLocaleDateString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleView(election.id)}
                      >
                        View Results
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </PageLayout>
    </AppShell>
  )
}

export default ResultsLandingPage
