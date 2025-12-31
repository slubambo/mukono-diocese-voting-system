import React, { useEffect, useState } from 'react'
import { Box, Chip, Paper, Typography } from '@mui/material'
import { votingPeriodPositionsApi } from '../../api/votingPeriodPositions.api'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import type { VotingPeriodPositionsResponse } from '../../types/election'
import { useToast } from '../feedback/ToastProvider'

interface Props {
  electionId: number | string
  votingPeriodId: number | string
}

const PeriodPositionsTab: React.FC<Props> = ({ electionId, votingPeriodId }) => {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<VotingPeriodPositionsResponse | null>(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await votingPeriodPositionsApi.listByPeriod(electionId, votingPeriodId)
      setData(res)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load voting period positions')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, votingPeriodId])

  if (loading) return <LoadingState />

  if (!data || (data.byFellowship?.length ?? 0) === 0) {
    return <EmptyState title="No positions assigned" description="No positions are assigned to this voting period." />
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {(data.byFellowship || []).map((group, idx) => (
        <Paper key={`${group.fellowshipId || idx}`} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Typography variant="h6">{group.fellowshipName || 'Fellowship'}</Typography>
            {group.fellowshipId && <Chip size="small" label={`ID: ${group.fellowshipId}`} />}
          </Box>
          {(group.positions || []).length === 0 ? (
            <Typography variant="body2">No positions in this fellowship.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gap: 1 }}>
              {(group.positions || []).map((pos) => (
                <Box key={String(pos.electionPositionId)} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography variant="body1">{pos.positionTitle || 'Position'}</Typography>
                  {typeof pos.seats === 'number' && <Chip size="small" label={`${pos.seats} seat${pos.seats === 1 ? '' : 's'}`} />}
                  {typeof pos.maxVotesPerVoter === 'number' && <Chip size="small" label={`Max votes: ${pos.maxVotesPerVoter}`} />}
                  {pos.electionPositionId && <Chip size="small" label={`ID: ${pos.electionPositionId}`} />}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  )
}

export default PeriodPositionsTab
