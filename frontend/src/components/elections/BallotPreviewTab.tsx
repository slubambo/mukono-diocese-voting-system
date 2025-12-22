import React, { useEffect, useState } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { electionApi } from '../../api/election.api'
import LoadingState from '../common/LoadingState'
import { useToast } from '../feedback/ToastProvider'
import type { BallotEntry } from '../../types/election'

const BallotPreviewTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<BallotEntry[]>([])
  const toast = useToast()

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await electionApi.listCandidatesBallot(electionId)
      // Expect an array of entries or paged; normalize to array
      const data = (res as any)?.content ?? res ?? []
      setEntries(data)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load ballot preview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [electionId])

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
