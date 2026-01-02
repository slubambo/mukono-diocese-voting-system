import React, { useEffect, useMemo, useState } from 'react'
import { Box, Paper, Typography, TextField, Button, MenuItem, Chip, Card, CardContent, InputAdornment, IconButton, Collapse, Stack } from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import SearchIcon from '@mui/icons-material/Search'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import { electionApi } from '../../api/election.api'
import LoadingState from '../common/LoadingState'
import { useToast } from '../feedback/ToastProvider'
import { getErrorMessage } from '../../api/errorHandler'
import type { BallotPreviewResponse, Position } from '../../types/election'

const BallotPreviewTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<BallotPreviewResponse | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedPosition, setSelectedPosition] = useState<string | number>('all')
  const [votingPeriods, setVotingPeriods] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string | number>('all')
  const [search, setSearch] = useState('')
  const [fellowshipFilter, setFellowshipFilter] = useState<string>('all')
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const toast = useToast()

  const fetch = async (params: { votingPeriodId?: number; electionPositionId?: number } = {}) => {
    setLoading(true)
    try {
      const res = await electionApi.ballotPreview(electionId, params)
      setPreview(res)
    } catch (err: any) {
      const msg = getErrorMessage(err) || 'Failed to load ballot preview'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getPositions = async () => {
      try {
        const res = await electionApi.listPositions(electionId)
        const data = (res as any)?.content ?? res ?? []
        setPositions(Array.isArray(data) ? data : [])
      } catch (e) {
        setPositions([])
      }
    }
    getPositions()
  }, [electionId])

  useEffect(() => {
    fetch({
      votingPeriodId: selectedPeriod === 'all' ? undefined : Number(selectedPeriod),
      electionPositionId: selectedPosition === 'all' ? undefined : Number(selectedPosition),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, selectedPeriod, selectedPosition])

  useEffect(() => {
    const getPeriods = async () => {
      try {
        const res = await electionApi.listVotingPeriods(electionId)
        const data = (res as any)?.content ?? res ?? []
        setVotingPeriods(Array.isArray(data) ? data : [])
      } catch (e) {
        setVotingPeriods([])
      }
    }
    getPeriods()
  }, [electionId])

  const positionsPreview = preview?.positions || []
  const groupedBallot = useMemo(() => {
    const groups = positionsPreview.reduce<Record<string, typeof positionsPreview>>((acc, pos) => {
      const key = pos.fellowshipName || 'Other'
      acc[key] = acc[key] || []
      acc[key].push(pos)
      return acc
    }, {})
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [positionsPreview])

  useEffect(() => {
    // Collapse most groups by default when many fellowships exist to keep it compact
    if (groupedBallot.length <= 3) return
    const next: Record<string, boolean> = {}
    groupedBallot.forEach(([key], idx) => {
      next[key] = idx > 1 // keep first two open
    })
    setCollapsedGroups(next)
  }, [groupedBallot])

  const filteredGroups = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    return groupedBallot
      .filter(([fellowship]) => fellowshipFilter === 'all' || fellowshipFilter === fellowship)
      .map(([fellowship, items]) => {
        const filteredItems = items.filter((pos) => {
          const text = `${pos.positionTitle || ''} ${pos.fellowshipName || ''} ${(pos.candidates || []).map(c => c.fullName).join(' ')}`.toLowerCase()
          return searchTerm ? text.includes(searchTerm) : true
        })
        return [fellowship, filteredItems] as [string, typeof items]
      })
      .filter(([, items]) => items.length > 0)
  }, [groupedBallot, fellowshipFilter, search])
  const filteredPositionsCount = useMemo(
    () => filteredGroups.reduce((sum, [, items]) => sum + items.length, 0),
    [filteredGroups]
  )

  if (loading) return <LoadingState />

  return (
    <Box>
      <Paper
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          border: '1px solid rgba(88, 28, 135, 0.12)',
          background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.04) 0%, rgba(88, 28, 135, 0.02) 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
          sx={{ flexWrap: 'wrap' }}
        >
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            label="Search"
            placeholder="Search position or candidate"
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 240, flex: 1 }}
          />
          <TextField
            select
            value={fellowshipFilter}
            onChange={(e) => setFellowshipFilter(e.target.value)}
            label="Fellowship"
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><PeopleAltIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 220, flex: 1 }}
          >
            <MenuItem value="all">All fellowships</MenuItem>
            {groupedBallot.map(([fellowship]) => (
              <MenuItem key={fellowship} value={fellowship}>
                {fellowship}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            value={selectedPeriod}
            onChange={(e: any) => setSelectedPeriod(e.target.value)}
            label="Voting Day"
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><FilterAltIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 200, flex: 1 }}
          >
            <MenuItem value="all">All days</MenuItem>
            {votingPeriods.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name || p.label || `Day ${p.id}`}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            value={selectedPosition}
            onChange={(e: any) => setSelectedPosition(e.target.value)}
            label="Position"
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><AutoAwesomeIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 240, flex: 1 }}
          >
            <MenuItem value="all">All positions</MenuItem>
            {positions.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.fellowshipPosition?.titleName || p.title || p.positionId}
                {p.fellowshipPosition?.fellowshipName ? ` — ${p.fellowshipPosition.fellowshipName}` : ''}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {groupedBallot.length > 0 && groupedBallot.length > 3 && (
        <Paper sx={{ mb: 2, p: 1, borderRadius: 2, border: '1px solid rgba(88, 28, 135, 0.08)', backgroundColor: 'rgba(88, 28, 135, 0.03)' }}>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Button
              size="small"
              startIcon={Object.values(collapsedGroups).every(Boolean) ? <UnfoldMoreIcon /> : <UnfoldLessIcon />}
              onClick={() => {
                const allCollapsed = Object.values(collapsedGroups).every(Boolean)
                const next: Record<string, boolean> = {}
                groupedBallot.forEach(([key]) => { next[key] = !allCollapsed })
                setCollapsedGroups(next)
              }}
            >
              {Object.values(collapsedGroups).every(Boolean) ? 'Expand all' : 'Collapse all'}
            </Button>
          </Box>
        </Paper>
      )}

      {!preview ? (
        <Paper sx={{ p: 3, textAlign: 'center', border: '2px dashed rgba(88, 28, 135, 0.2)', borderRadius: 2 }}>
          <HowToVoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>Load Your Ballot</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Select a voting day and position (optional) to preview the ballot
          </Typography>
        </Paper>
      ) : filteredPositionsCount === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', border: '2px dashed rgba(88, 28, 135, 0.2)', borderRadius: 2 }}>
          <HowToVoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>No Positions Found</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            There are no positions available for the selected criteria
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          {/* Ballot Header */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.1) 0%, rgba(88, 28, 135, 0.05) 100%)',
              borderRadius: 2,
              border: '2px solid rgba(88, 28, 135, 0.2)',
              textAlign: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              <HowToVoteIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Official Ballot
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Select your preferred candidates below
            </Typography>
          </Paper>

          {/* Positions as Ballot Cards grouped by fellowship */}
          {filteredGroups.map(([fellowship, items]) => (
            <Box key={fellowship} sx={{ mb: 2 }}>
              <Paper sx={{ p: 1.25, mb: 1.25, background: 'linear-gradient(120deg, rgba(88,28,135,0.06) 0%, rgba(168,85,247,0.04) 100%)', border: '1px solid rgba(88, 28, 135, 0.14)', borderRadius: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>{fellowship}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{items.length} position{items.length === 1 ? '' : 's'}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setCollapsedGroups((prev) => ({ ...prev, [fellowship]: !prev[fellowship] }))}>
                    {collapsedGroups[fellowship] ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                  </IconButton>
                </Box>
              </Paper>
              <Collapse in={!collapsedGroups[fellowship]}>
                <Box sx={{ display: 'grid', gap: 1.25 }}>
                  {items.map((pos) => {
                    const cardNumber = positionsPreview.indexOf(pos) + 1
                    return (
                      <Card
                        key={String(pos.electionPositionId)}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid rgba(88, 28, 135, 0.15)',
                          boxShadow: '0 2px 10px rgba(88, 28, 135, 0.08)',
                          background: 'linear-gradient(150deg, rgba(88,28,135,0.02) 0%, rgba(168,85,247,0.05) 100%)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 6px 18px rgba(88, 28, 135, 0.16)',
                            borderColor: 'rgba(88, 28, 135, 0.3)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          {/* Position Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, pb: 1, borderBottom: '2px solid rgba(88, 28, 135, 0.08)' }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25, color: 'primary.main' }}>
                                {pos.positionTitle || 'Position'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                {pos.fellowshipName && (
                                  <Chip
                                    label={pos.fellowshipName}
                                    size="small"
                                    sx={{ backgroundColor: 'rgba(88, 28, 135, 0.12)', color: 'primary.main', fontWeight: 500, height: 24 }}
                                  />
                                )}
                                {pos.scope && (
                                  <Chip
                                    label={pos.scope}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderColor: 'rgba(88, 28, 135, 0.2)', color: 'text.secondary', height: 24 }}
                                  />
                                )}
                                {typeof pos.seats === 'number' && (
                                  <Chip
                                    label={`${pos.seats} seat${pos.seats === 1 ? '' : 's'}`}
                                    size="small"
                                    sx={{ backgroundColor: 'success.light', color: 'success.dark', fontWeight: 600, height: 24 }}
                                  />
                                )}
                              </Box>
                            </Box>
                            <Stack direction="column" spacing={0.5} alignItems="flex-end" sx={{ minWidth: 80 }}>
                              <Chip
                                icon={<PeopleAltIcon sx={{ fontSize: 16 }} />}
                                label={`${(pos.candidates || []).length} candidate${(pos.candidates || []).length === 1 ? '' : 's'}`}
                                size="small"
                                sx={{ height: 26, borderRadius: 999, backgroundColor: 'rgba(88, 28, 135, 0.08)', color: 'primary.main', fontWeight: 600 }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                #{cardNumber}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Candidates List */}
                          {(pos.candidates || []).length === 0 ? (
                            <Box sx={{ py: 2, textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                No candidates yet
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: pos.candidates && pos.candidates.length <= 3 ? '1fr' : { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
                              {(pos.candidates || []).map((c, candIdx) => (
                                <Paper
                                  key={String(c.candidateId)}
                                  sx={{
                                    p: 1.25,
                                    backgroundColor: 'rgba(88, 28, 135, 0.03)',
                                    border: '1px solid rgba(88, 28, 135, 0.1)',
                                    borderRadius: 1.25,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: 'rgba(88, 28, 135, 0.08)',
                                      borderColor: 'rgba(88, 28, 135, 0.24)',
                                      transform: 'translateY(-2px)',
                                    },
                                  }}
                                >
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Box
                                      sx={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: '50%',
                                        backgroundColor: 'primary.main',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {candIdx + 1}
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                      {c.fullName}
                                    </Typography>
                                  </Box>
                                </Paper>
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </Box>
              </Collapse>
            </Box>
          ))}

          {/* Ballot Footer */}
          <Paper
            sx={{
              p: 2,
              mt: 3,
              backgroundColor: 'rgba(88, 28, 135, 0.05)',
              border: '1px solid rgba(88, 28, 135, 0.1)',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              This is a preview of the ballot. Actual voting interface may vary.
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  )
}

export default BallotPreviewTab
