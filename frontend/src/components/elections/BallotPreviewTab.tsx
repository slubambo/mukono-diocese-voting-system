import React, { useEffect, useState } from 'react'
import { Box, Paper, Typography, TextField, Button, MenuItem } from '@mui/material'
import { electionApi } from '../../api/election.api'
import LoadingState from '../common/LoadingState'
import { useToast } from '../feedback/ToastProvider'
import type { BallotEntry, Candidate, Position } from '../../types/election'

const BallotPreviewTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<BallotEntry[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedPosition, setSelectedPosition] = useState<string | number>('all')
  const toast = useToast()

  const mapCandidatesToEntries = (candidates: Candidate[]): BallotEntry[] => (
    candidates.map((c) => ({
      positionTitle: (c as any)?.positionTitle || c.positionTitle,
      candidateName: c.person?.fullName || c.personName,
      candidateId: c.id,
      positionId: c.electionPositionId || c.positionId,
    }))
  )

  const fetch = async (params: Record<string, unknown> = {}) => {
    setLoading(true)
    try {
      const res = await electionApi.listCandidatesBallotWithParams(electionId, params)
      const data = (res as any)?.content ?? res ?? []
      const candidates = Array.isArray(data) ? data : []
      setEntries(mapCandidatesToEntries(candidates))
    } catch (err: any) {
      // If server errors due to missing param, surface a helpful message and allow selecting position
      const msg = err?.response?.data?.message || err?.message || 'Failed to load ballot preview'
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

  if (loading) return <LoadingState />

  // Group by positionTitle
  const grouped = entries.reduce<Record<string, BallotEntry[]>>((acc, cur) => {
    const key = cur.positionTitle || 'Unassigned'
    acc[key] = acc[key] || []
    acc[key].push(cur)
    return acc
  }, {})

  return (
    <Box>
      {positions.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            value={selectedPosition}
            onChange={(e: any) => setSelectedPosition(e.target.value)}
            label="Position"
            helperText="Select a position to preview its ballot"
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
            disabled={!selectedPosition}
            onClick={async () => {
              if (selectedPosition === 'all') {
                setLoading(true)
                try {
                  const results = await Promise.all(
                    positions.map(async (p) => {
                      const res = await electionApi.listCandidatesBallotWithParams(electionId, { electionPositionId: p.id })
                      const data = (res as any)?.content ?? res ?? []
                      const candidates = Array.isArray(data) ? data : []
                      return mapCandidatesToEntries(candidates).map((entry) => ({
                        ...entry,
                        positionTitle: entry.positionTitle || (p.fellowshipPosition?.titleName || p.title || p.positionId),
                      }))
                    })
                  )
                  setEntries(results.flat())
                } catch (err: any) {
                  const msg = err?.response?.data?.message || err?.message || 'Failed to load ballot preview'
                  toast.error(msg)
                } finally {
                  setLoading(false)
                }
              } else {
                await fetch({ electionPositionId: selectedPosition })
              }
            }}
          >
            Load Ballot
          </Button>
        </Box>
      )}
      {selectedPosition && entries.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography>No candidates found for this position.</Typography>
        </Paper>
      ) : (
        Object.entries(grouped).map(([position, items]) => (
          <Paper key={position} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">{position}</Typography>
            {items.map(i => (
              <Typography key={String(i.candidateId)}>- {i.candidateName}</Typography>
            ))}
          </Paper>
        ))
      )}
    </Box>
  )
}

export default BallotPreviewTab
