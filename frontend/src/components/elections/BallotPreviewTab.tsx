import React, { useEffect, useState } from 'react'
import { Box, Paper, Typography, TextField, Button, MenuItem, Chip } from '@mui/material'
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

  if (loading) return <LoadingState />

  const positionsPreview = preview?.positions || []

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
        <Paper sx={{ p: 2 }}>
          <Typography>Select filters and load to preview the ballot.</Typography>
        </Paper>
      ) : positionsPreview.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography>No positions found for this selection.</Typography>
        </Paper>
      ) : (
        positionsPreview.map((pos) => (
          <Paper key={String(pos.electionPositionId)} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6">{pos.positionTitle || 'Position'}</Typography>
              {pos.fellowshipName && <Chip size="small" label={pos.fellowshipName} />}
              {pos.scope && <Chip size="small" label={pos.scope} />}
              {typeof pos.seats === 'number' && <Chip size="small" label={`${pos.seats} seat${pos.seats === 1 ? '' : 's'}`} />}
            </Box>
            {(pos.candidates || []).length === 0 ? (
              <Typography variant="body2">No candidates yet.</Typography>
            ) : (
              (pos.candidates || []).map((c) => (
                <Typography key={String(c.candidateId)}>- {c.fullName}</Typography>
              ))
            )}
          </Paper>
        ))
      )}
    </Box>
  )
}

export default BallotPreviewTab
