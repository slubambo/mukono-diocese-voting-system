import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  Skeleton,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  AutoGraph as AutoGraphIcon,
  Ballot as BallotIcon,
  Groups as GroupsIcon,
  HowToVote as HowToVoteIcon,
  Leaderboard as LeaderboardIcon,
  Poll as PollIcon,
  RecentActors as RecentActorsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { electionApi } from '../../api/election.api'
import { peopleApi } from '../../api/people.api'
import { dioceseApi } from '../../api/diocese.api'
import { fellowshipApi } from '../../api/fellowship.api'
import { leadershipApi } from '../../api/leadership.api'
import StatusChip from '../common/StatusChip'
import type { Election } from '../../types/election'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../feedback/ToastProvider'

type SnapshotCounts = {
  elections: number
  activeElections: number
  closedElections: number
  people: number
  fellowships: number
  dioceses: number
  assignments: number
}

const ACTIVE_ELECTION_STATUSES = ['ACTIVE', 'VOTING_OPEN', 'ONGOING', 'SCHEDULED']
const CLOSED_ELECTION_STATUSES = ['CLOSED', 'COMPLETED', 'TALLIED', 'PUBLISHED', 'VOTING_CLOSED']

const OverviewDashboard: React.FC = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))
  const base = isAdmin ? '/admin' : '/ds'
  const theme = useTheme()

  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<SnapshotCounts>({
    elections: 0,
    activeElections: 0,
    closedElections: 0,
    people: 0,
    fellowships: 0,
    dioceses: 0,
    assignments: 0,
  })
  const [recentElections, setRecentElections] = useState<Election[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [
          electionsRes,
          peopleRes,
          diocesesRes,
          fellowshipsRes,
          assignmentsRes,
        ] = await Promise.all([
          electionApi.list({ page: 0, size: 8, sort: 'updatedAt,desc' } as any),
          peopleApi.list({ page: 0, size: 1, sort: 'id,desc' } as any),
          dioceseApi.list({ page: 0, size: 1, sort: 'id,desc' } as any),
          fellowshipApi.list({ page: 0, size: 1, sort: 'id,desc' } as any),
          leadershipApi.list({ page: 0, size: 1, sort: 'id,desc' } as any),
        ])

        const electionsContent = (electionsRes as any)?.content ?? electionsRes ?? []
        const electionList = Array.isArray(electionsContent) ? electionsContent : []
        const totalElections = (electionsRes as any)?.totalElements ?? electionList.length
        const activeCount = electionList.filter((e) => ACTIVE_ELECTION_STATUSES.includes(String(e.status || '').toUpperCase())).length
        const closedCount = electionList.filter((e) => CLOSED_ELECTION_STATUSES.includes(String(e.status || '').toUpperCase())).length

        setRecentElections(electionList.slice(0, 5))
        setCounts({
          elections: totalElections,
          activeElections: activeCount,
          closedElections: closedCount,
          people: (peopleRes as any)?.totalElements ?? 0,
          dioceses: (diocesesRes as any)?.totalElements ?? 0,
          fellowships: (fellowshipsRes as any)?.totalElements ?? 0,
          assignments: (assignmentsRes as any)?.totalElements ?? 0,
        })
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load dashboard snapshot')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [toast])

  const quickActions = useMemo(() => ([
    {
      label: 'Elections',
      description: 'Create, schedule, and manage elections.',
      icon: <PollIcon fontSize="small" />,
      path: `${base}/elections`,
    },
    {
      label: 'Results & Tally',
      description: 'Review results, tally, and certify.',
      icon: <LeaderboardIcon fontSize="small" />,
      path: `${base}/results`,
    },
    {
      label: 'Eligibility & Codes',
      description: 'Prepare voting day and generate codes.',
      icon: <HowToVoteIcon fontSize="small" />,
      path: `${base}/elections/eligibility-codes`,
    },
    {
      label: 'Master Data',
      description: 'Manage dioceses, churches, fellowships.',
      icon: <SettingsIcon fontSize="small" />,
      path: '/config',
    },
    {
      label: 'People Registry',
      description: 'Maintain people records and profiles.',
      icon: <RecentActorsIcon fontSize="small" />,
      path: `${base}/people`,
    },
  ]), [base])

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          color: 'common.white',
          position: 'relative',
          overflow: 'hidden',
          background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.dark, 0.95)} 0%, ${alpha(t.palette.primary.main, 0.82)} 45%, ${alpha(t.palette.secondary?.main || t.palette.primary.light, 0.85)} 100%)`,
          boxShadow: '0 22px 60px rgba(15, 23, 42, 0.25)',
          '&:before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(1200px 400px at -10% -40%, ${alpha('#ffffff', 0.15)} 0%, transparent 60%), radial-gradient(800px 300px at 120% 140%, ${alpha('#ffffff', 0.12)} 0%, transparent 60%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.85 }}>System snapshot</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Welcome back, {user?.username || 'Administrator'}.
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
              Monitor elections, master data, and leadership updates at a glance.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={`${counts.elections} elections`} sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.18)' }} />
            <Chip size="small" label={`${counts.people} people`} sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.18)' }} />
            <Chip size="small" label={`${counts.assignments} assignments`} sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.18)' }} />
          </Stack>
          {/* Primary CTAs */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: { xs: 1, md: 0 } }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate(`${base}/elections`)}
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.15),
                color: 'common.white',
                '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.25) },
              }}
            >
              Create election
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(`${base}/results`)}
              sx={{ borderColor: alpha('#fff', 0.4), color: 'common.white', '&:hover': { borderColor: '#fff', bgcolor: alpha('#fff', 0.08) } }}
            >
              View results
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' } }}>
            {[
              { label: 'Active elections', value: counts.activeElections, icon: <AutoGraphIcon fontSize="small" />, accent: 'rgba(34, 197, 94, 0.16)' },
              { label: 'Closed elections', value: counts.closedElections, icon: <BallotIcon fontSize="small" />, accent: 'rgba(59, 130, 246, 0.16)' },
              { label: 'People registry', value: counts.people, icon: <GroupsIcon fontSize="small" />, accent: 'rgba(249, 115, 22, 0.16)' },
              { label: 'Leadership roles', value: counts.assignments, icon: <RecentActorsIcon fontSize="small" />, accent: 'rgba(168, 85, 247, 0.16)' },
            ].map((card) => (
              <Paper
                key={card.label}
                tabIndex={0}
                role="article"
                aria-live="polite"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.100',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                  cursor: 'default',
                  '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[2] },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                  {card.icon}
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>{card.label}</Typography>
                </Stack>
                {loading ? (
                  <Skeleton variant="text" width={60} height={42} sx={{ mt: 0.5 }} />
                ) : (
                  <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>{card.value}</Typography>
                )}
                <Box sx={{ mt: 1, height: 6, borderRadius: 99, bgcolor: card.accent }} />
              </Paper>
            ))}
          </Box>

          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent elections</Typography>
              <Button size="small" onClick={() => navigate(`${base}/elections`)}>View all</Button>
            </Stack>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {loading && recentElections.length === 0 && (
                Array.from({ length: 4 }).map((_, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, borderColor: 'grey.100' }}>
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="25%" />
                  </Paper>
                ))
              )}
              {!loading && recentElections.length === 0 && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>No elections yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Start by creating your first election. You can configure positions, eligibility and more.
                  </Typography>
                  <Button variant="contained" startIcon={<PollIcon fontSize="small" />} onClick={() => navigate(`${base}/elections`)}>
                    Create election
                  </Button>
                </Paper>
              )}
              {recentElections.map((election) => (
                <Paper
                  key={election.id}
                  variant="outlined"
                  role="button"
                  onClick={() => navigate(`${base}/elections/${election.id}`)}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    borderColor: 'grey.100',
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 120ms ease, transform 120ms ease, box-shadow 120ms ease',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-1px)', boxShadow: theme.shadows[1] },
                    '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{election.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(election.scope || '—').toString()} · {election.termStartDate ? new Date(election.termStartDate).toLocaleDateString() : '—'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StatusChip status={(election.status || 'pending') as any} />
                    <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate(`${base}/elections/${election.id}`) }}>
                      Open
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: 'grid', gap: 2 }}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Master data snapshot</Typography>
            <Stack spacing={1.25}>
              {[
                { label: 'Dioceses', value: counts.dioceses },
                { label: 'Fellowships', value: counts.fellowships },
                { label: 'People', value: counts.people },
              ].map((row) => (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                  {loading ? (
                    <Skeleton variant="text" width={24} />
                  ) : (
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.value}</Typography>
                  )}
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Button size="small" variant="outlined" onClick={() => navigate('/config')} startIcon={<SettingsIcon fontSize="small" />}>
              Manage master data
            </Button>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Quick actions</Typography>
            <Stack spacing={1} role="list" aria-label="Quick actions">
              {quickActions.map((action) => (
                <Box
                  key={action.label}
                  role="listitem"
                  sx={{
                    border: '1px solid',
                    borderColor: 'grey.100',
                    borderRadius: 2,
                    p: 1,
                    transition: 'background 120ms ease, transform 120ms ease, box-shadow 120ms ease',
                    '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-1px)', boxShadow: theme.shadows[1] },
                  }}
                >
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate(action.path)}
                    startIcon={action.icon}
                    sx={{ justifyContent: 'flex-start', color: 'text.primary', textTransform: 'none' }}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{action.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{action.description}</Typography>
                    </Box>
                  </Button>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

export default OverviewDashboard
