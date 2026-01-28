import React, { useEffect, useMemo, useState } from 'react'
import { Box, Paper, Typography, TextField, Button, MenuItem, Chip, Card, CardContent, InputAdornment, IconButton, Collapse, Stack, Divider, Badge, alpha } from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import SearchIcon from '@mui/icons-material/Search'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import GroupsIcon from '@mui/icons-material/Groups'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import EventIcon from '@mui/icons-material/Event'
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

  const totalCandidates = positionsPreview.reduce((sum, pos) => sum + (pos.candidates?.length || 0), 0)

  return (
    <Box>
      {/* Compact Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Stack spacing={1.5}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search position or candidate"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
              },
            }}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ flexWrap: 'wrap' }}
          >
            <TextField
              select
              value={fellowshipFilter}
              onChange={(e) => setFellowshipFilter(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <GroupsIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
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
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                minWidth: 160,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
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
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterAltIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
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
        </Stack>
      </Paper>

      {/* Expand/Collapse All - Only show if multiple fellowships */}
      {groupedBallot.length > 1 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            startIcon={Object.values(collapsedGroups).every(Boolean) ? <UnfoldMoreIcon /> : <UnfoldLessIcon />}
            onClick={() => {
              const allCollapsed = Object.values(collapsedGroups).every(Boolean)
              const next: Record<string, boolean> = {}
              groupedBallot.forEach(([key]) => { next[key] = !allCollapsed })
              setCollapsedGroups(next)
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
            }}
          >
            {Object.values(collapsedGroups).every(Boolean) ? 'Expand all' : 'Collapse all'}
          </Button>
        </Box>
      )}

      {!preview ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <HowToVoteIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Load Your Ballot</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
            Select a voting day and position (optional) to preview the ballot
          </Typography>
        </Paper>
      ) : filteredPositionsCount === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <SearchIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>No Positions Found</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
            There are no positions available for the selected criteria. Try adjusting your filters.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
          {/* Ballot Header */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
              borderRadius: 2,
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
              textAlign: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 0.5 }}>
              <HowToVoteIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Official Ballot
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Select your preferred candidates below
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Chip
                icon={<GroupsIcon />}
                label={`${filteredGroups.length} Fellowship${filteredGroups.length === 1 ? '' : 's'}`}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<AutoAwesomeIcon />}
                label={`${filteredPositionsCount} Position${filteredPositionsCount === 1 ? '' : 's'}`}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<AccountCircleIcon />}
                label={`${totalCandidates} Candidate${totalCandidates === 1 ? '' : 's'}`}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Paper>

          {/* Positions as Ballot Cards grouped by fellowship */}
          {filteredGroups.map(([fellowship, items]) => {
            const fellowshipCandidates = items.reduce((sum, pos) => sum + (pos.candidates?.length || 0), 0)
            
            return (
              <Box key={fellowship} sx={{ mb: 2.5 }}>
                {/* Fellowship Header */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 1.5,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06),
                    },
                  }}
                >
                  <Box
                    onClick={() => setCollapsedGroups((prev) => ({ ...prev, [fellowship]: !prev[fellowship] }))}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          backgroundColor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <GroupsIcon sx={{ color: 'white', fontSize: 22 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: 'primary.main',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {fellowship}
                        </Typography>
                        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {items.length} position{items.length === 1 ? '' : 's'}
                          </Typography>
                          <Divider orientation="vertical" flexItem />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {fellowshipCandidates} candidate{fellowshipCandidates === 1 ? '' : 's'}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      sx={{
                        transition: 'transform 0.2s ease',
                        transform: collapsedGroups[fellowship] ? 'rotate(0deg)' : 'rotate(180deg)',
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Box>
                </Paper>

                {/* Positions */}
                <Collapse in={!collapsedGroups[fellowship]} timeout="auto">
                  <Stack spacing={1.5}>
                    {items.map((pos) => {
                      const cardNumber = positionsPreview.indexOf(pos) + 1
                      const candidateCount = pos.candidates?.length || 0
                      
                      return (
                        <Card
                          key={String(pos.electionPositionId)}
                          elevation={0}
                          sx={{
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
                              boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                            },
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            {/* Position Header */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                mb: 1.5,
                                pb: 1.5,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontWeight: 700,
                                    mb: 0.5,
                                    color: 'text.primary',
                                  }}
                                >
                                  {pos.positionTitle || 'Position'}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  {pos.scope && (
                                    <Chip
                                      label={pos.scope}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        borderColor: 'divider',
                                      }}
                                    />
                                  )}
                                  {typeof pos.seats === 'number' && (
                                    <Chip
                                      label={`${pos.seats} seat${pos.seats === 1 ? '' : 's'}`}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
                                        color: 'success.dark',
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                                <Badge
                                  badgeContent={candidateCount}
                                  color="primary"
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      fontWeight: 700,
                                      fontSize: '0.7rem',
                                    },
                                  }}
                                >
                                  <AccountCircleIcon sx={{ color: 'text.secondary', fontSize: 24 }} />
                                </Badge>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                  }}
                                >
                                  #{cardNumber}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Candidates List */}
                            {candidateCount === 0 ? (
                              <Box
                                sx={{
                                  py: 2,
                                  textAlign: 'center',
                                  borderRadius: 1,
                                  border: '1px dashed',
                                  borderColor: 'divider',
                                  backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
                                }}
                              >
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                  No candidates yet
                                </Typography>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: 'grid',
                                  gap: 1,
                                  gridTemplateColumns: candidateCount <= 2
                                    ? '1fr'
                                    : { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                }}
                              >
                                {(pos.candidates || []).map((c, candIdx) => (
                                  <Paper
                                    key={String(c.candidateId)}
                                    elevation={0}
                                    sx={{
                                      p: 1.25,
                                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      transition: 'all 0.15s ease',
                                      '&:hover': {
                                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                        borderColor: 'primary.main',
                                        transform: 'translateX(4px)',
                                      },
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                                      <Box
                                        sx={{
                                          width: 32,
                                          height: 32,
                                          borderRadius: '50%',
                                          backgroundColor: 'primary.main',
                                          color: 'white',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 700,
                                          fontSize: '0.875rem',
                                          flexShrink: 0,
                                          boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                                        }}
                                      >
                                        {candIdx + 1}
                                      </Box>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 600,
                                          flex: 1,
                                          color: 'text.primary',
                                        }}
                                      >
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
                  </Stack>
                </Collapse>
              </Box>
            )
          })}

          {/* Ballot Footer */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mt: 3,
              backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.05),
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              This is a preview of the ballot. Actual voting interface may vary.
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  )
}

export default BallotPreviewTab
