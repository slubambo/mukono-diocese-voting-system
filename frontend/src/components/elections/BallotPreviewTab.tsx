import React, { useEffect, useState } from 'react'
import { Box, Paper, Typography, TextField, Button } from '@mui/material'
import { electionApi } from '../../api/election.api'
import LoadingState from '../common/LoadingState'
import { useToast } from '../feedback/ToastProvider'
import type { BallotEntry } from '../../types/election'

const BallotPreviewTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<BallotEntry[]>([])
  const toast = useToast()

  const fetch = async (params: Record<string, unknown> = {}) => {
    setLoading(true)
    try {
      const res = await electionApi.listCandidatesBallotWithParams(electionId, params)
      // Expect an array of entries or paged; normalize to array
      const data = (res as any)?.content ?? res ?? []
      setEntries(Array.isArray(data) ? data : [])
    } catch (err: any) {
      // If server errors due to missing param, surface a helpful message and allow selecting position
      const msg = err?.response?.data?.message || err?.message || 'Failed to load ballot preview'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [electionId])

  // If backend requires electionPositionId, fetch positions so user can select
  const [positions, setPositions] = useState<any[]>([])
  const [selectedPosition, setSelectedPosition] = useState<string | number | null>(null)

  useEffect(() => {
    const getPositions = async () => {
      try {
        const res = await electionApi.listPositions(electionId)
        const data = (res as any)?.content ?? res ?? []
        setPositions(Array.isArray(data) ? data : [])
      } catch (e) {
        // ignore
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
        <Box sx={{ mb: 2 }}>
          <TextField
            select
            SelectProps={{ native: true }}
            value={selectedPosition ?? ''}
            onChange={(e: any) => setSelectedPosition(e.target.value)}
            label="Position"
            helperText="Select a position to preview its ballot"
          >
            <option value="">All positions</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>{p.fellowshipPosition?.titleName || p.title || p.positionId}</option>
            ))}
          </TextField>
          <Button sx={{ ml: 2 }} variant="outlined" onClick={() => fetch(selectedPosition ? { electionPositionId: selectedPosition } : {})}>Load</Button>
        </Box>
      )}
      {Object.entries(grouped).map(([position, items]) => (
        <Paper key={position} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">{position}</Typography>
          {items.map(i => (
            <Typography key={String(i.candidateId)}>- {i.candidateName}</Typography>
          ))}
        </Paper>
      ))}
    </Box>
  )
}

export default BallotPreviewTab
