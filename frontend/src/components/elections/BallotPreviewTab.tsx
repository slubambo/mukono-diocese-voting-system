import React, { useEffect, useMemo, useState } from 'react'
import { Box, Paper, Typography, TextField, Button, MenuItem, Chip, Card, CardContent } from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
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
    fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId])

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

  if (loading) return <LoadingState />

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          select
          value={selectedPeriod}
          onChange={(e: any) => setSelectedPeriod(e.target.value)}
          label="Voting Period"
          helperText="Filter by a voting period (optional)"
          size="small"
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="all">All periods</MenuItem>
          {votingPeriods.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name || p.label || `Period ${p.id}`}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          value={selectedPosition}
          onChange={(e: any) => setSelectedPosition(e.target.value)}
          label="Position"
          helperText="Filter by position (optional)"
          size="small"
          sx={{ minWidth: 260 }}
        >
          <MenuItem value="all">All positions</MenuItem>
          {positions.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.fellowshipPosition?.titleName || p.title || p.positionId}
              {p.fellowshipPosition?.fellowshipName ? ` — ${p.fellowshipPosition.fellowshipName}` : ''}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          size="small"
          onClick={() => fetch({
            votingPeriodId: selectedPeriod === 'all' ? undefined : Number(selectedPeriod),
            electionPositionId: selectedPosition === 'all' ? undefined : Number(selectedPosition),
          })}
        >
          Load Ballot
        </Button>
      </Box>

      {!preview ? (
        <Paper sx={{ p: 3, textAlign: 'center', border: '2px dashed rgba(88, 28, 135, 0.2)', borderRadius: 2 }}>
          <HowToVoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>Load Your Ballot</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Select a voting period and position (optional) to preview the ballot
          </Typography>
        </Paper>
      ) : positionsPreview.length === 0 ? (
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
          {groupedBallot.map(([fellowship, items]) => (
            <Box key={fellowship} sx={{ mb: 2.5 }}>
              <Paper sx={{ p: 1.5, mb: 1.5, backgroundColor: 'rgba(88, 28, 135, 0.06)', border: '1px solid rgba(88, 28, 135, 0.14)', borderRadius: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>{fellowship}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{items.length} position{items.length === 1 ? '' : 's'}</Typography>
              </Paper>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {items.map((pos) => {
                  const cardNumber = positionsPreview.indexOf(pos) + 1
                  return (
                    <Card
                      key={String(pos.electionPositionId)}
                      sx={{
                        borderRadius: 2,
                        border: '1px solid rgba(88, 28, 135, 0.15)',
                        boxShadow: '0 2px 8px rgba(88, 28, 135, 0.08)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(88, 28, 135, 0.12)',
                          borderColor: 'rgba(88, 28, 135, 0.25)',
                        },
                      }}
                    >
                      <CardContent>
                        {/* Position Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pb: 1.5, borderBottom: '2px solid rgba(88, 28, 135, 0.1)' }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main' }}>
                              {pos.positionTitle || 'Position'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {pos.fellowshipName && (
                                <Chip
                                  label={pos.fellowshipName}
                                  size="small"
                                  sx={{ backgroundColor: 'rgba(88, 28, 135, 0.1)', color: 'primary.main', fontWeight: 500 }}
                                />
                              )}
                              {pos.scope && (
                                <Chip
                                  label={pos.scope}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderColor: 'rgba(88, 28, 135, 0.2)', color: 'text.secondary' }}
                                />
                              )}
                              {typeof pos.seats === 'number' && (
                                <Chip
                                  label={`${pos.seats} seat${pos.seats === 1 ? '' : 's'}`}
                                  size="small"
                                  sx={{ backgroundColor: 'success.light', color: 'success.dark', fontWeight: 500 }}
                                />
                              )}
                            </Box>
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {cardNumber}
                          </Typography>
                        </Box>

                        {/* Candidates List */}
                        {(pos.candidates || []).length === 0 ? (
                          <Box sx={{ py: 3, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              No candidates yet
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: pos.candidates && pos.candidates.length <= 3 ? '1fr' : { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
                            {(pos.candidates || []).map((c, candIdx) => (
                              <Paper
                                key={String(c.candidateId)}
                                sx={{
                                  p: 1.5,
                                  backgroundColor: 'rgba(88, 28, 135, 0.03)',
                                  border: '1px solid rgba(88, 28, 135, 0.1)',
                                  borderRadius: 1.5,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: 'rgba(88, 28, 135, 0.08)',
                                    borderColor: 'rgba(88, 28, 135, 0.25)',
                                    transform: 'translateY(-2px)',
                                  },
                                }}
                              >
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Box
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      backgroundColor: 'primary.main',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.875rem',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {candIdx + 1}
                                  </Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
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
