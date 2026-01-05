import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Skeleton,
  Chip,
  Stack,
  Avatar,
} from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import GroupIcon from '@mui/icons-material/Group'
import BallotIcon from '@mui/icons-material/Ballot'
import VoterLayout from '../components/layout/VoterLayout'
import { voteApi } from '../api/vote.api'
import type { BallotData, Position } from '../api/vote.api'
import { useVoterAuth } from '../context/VoterAuthContext'

/**
 * UI-F2: Ballot
 *
 * Display positions and candidates for voting.
 * Voters select their preferred candidates.
 */
const VoteBallotPage: React.FC = () => {
  const navigate = useNavigate()
  const { session, hasSessionExpired, clearSession } = useVoterAuth()

  const [ballot, setBallot] = useState<BallotData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection state: { [positionId]: [candidateIds] or candidateId }
  const [selections, setSelections] = useState<Record<number, number | number[]>>({})

  const ballotStats = useMemo(() => {
    if (!ballot) return { positions: 0, candidates: 0 }
    const candidates = ballot.positions.reduce((sum, pos) => sum + pos.candidates.length, 0)
    return { positions: ballot.positions.length, candidates }
  }, [ballot])

  // Load ballot on mount
  useEffect(() => {
    const loadBallot = async () => {
      // Check session expiry
      if (hasSessionExpired()) {
        clearSession()
        navigate('/vote/login', {
          state: { message: 'Session expired (Ebudde bwo liweddeko). Please log in again.' },
        })
        return
      }

      try {
        const data = await voteApi.getBallot({
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        })
        setBallot(data)
        setIsLoading(false)
      } catch (err: unknown) {
        console.error('Failed to load ballot:', err)

        if (err instanceof Error && err.message.includes('401')) {
          clearSession()
          navigate('/vote/login', {
            state: { message: 'Session expired. Please log in again.' },
          })
        } else {
          setError('Failed to load ballot. Please try again.')
          setIsLoading(false)
        }
      }
    }

    loadBallot()
  }, [session, hasSessionExpired, clearSession, navigate])

  // Handle candidate selection (single or multiple based on maxVotes)
  const handleSelectionChange = (positionId: number, candidateId: number, isMultiple: boolean) => {
    if (isMultiple) {
      const current = Array.isArray(selections[positionId]) ? (selections[positionId] as number[]) : []
      if (current.includes(candidateId)) {
        setSelections(prev => ({
          ...prev,
          [positionId]: current.filter(id => id !== candidateId),
        }))
      } else {
        setSelections(prev => ({
          ...prev,
          [positionId]: [...current, candidateId],
        }))
      }
    } else {
      setSelections(prev => ({
        ...prev,
        [positionId]: candidateId,
      }))
    }
  }

  // Check if all required selections are made
  const isValidSelection = () => {
    if (!ballot) return false
    return ballot.positions.every(pos => {
      const selected = selections[pos.id]
      if (pos.maxVotes === 1) {
        return typeof selected === 'number'
      } else {
        return Array.isArray(selected) && selected.length > 0
      }
    })
  }

  const handleContinue = () => {
    if (isValidSelection()) {
      navigate('/vote/review', { state: { selections, positions: ballot?.positions } })
    }
  }

  if (isLoading) {
    return (
      <VoterLayout maxWidth="lg" contentAlign="start">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={100} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </VoterLayout>
    )
  }

  if (error) {
    return (
      <VoterLayout maxWidth="lg" contentAlign="start">
        <Card elevation={3}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error">{error}</Alert>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </VoterLayout>
    )
  }

  return (
    <VoterLayout maxWidth="lg" contentAlign="start">
      {/* Progress Stepper */}
      <Stepper activeStep={1} sx={{ mb: 2, width: '100%' }}>
        <Step completed>
          <StepLabel sx={{ fontSize: { xs: '0.7rem', sm: 'inherit' } }}>Login</StepLabel>
        </Step>
        <Step active>
          <StepLabel sx={{ fontSize: { xs: '0.7rem', sm: 'inherit' } }}>
            Vote <span style={{ fontSize: '0.85em' }}>(Londa)</span>
          </StepLabel>
        </Step>
        <Step>
          <StepLabel sx={{ fontSize: { xs: '0.7rem', sm: 'inherit' } }}>
            Review <span style={{ fontSize: '0.85em' }}>(Kebera)</span>
          </StepLabel>
        </Step>
        <Step>
          <StepLabel sx={{ fontSize: { xs: '0.7rem', sm: 'inherit' } }}>Submit</StepLabel>
        </Step>
      </Stepper>

      {/* Ballot Hero */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          p: { xs: 2.5, sm: 3 },
          background: 'linear-gradient(135deg, rgba(143, 52, 147, 0.12) 0%, rgba(14, 97, 173, 0.12) 100%)',
          border: '1px solid rgba(143, 52, 147, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)',
          },
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
              boxShadow: '0 10px 24px rgba(143, 52, 147, 0.25)',
            }}
          >
            <HowToVoteIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Official Ballot
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select your preferred candidates below.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Chip icon={<GroupIcon />} label={`${ballotStats.positions} Positions`} />
          <Chip icon={<BallotIcon />} label={`${ballotStats.candidates} Candidates`} />
        </Stack>
      </Card>

      {/* Positions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ballot?.positions.map((position: Position) => (
          <PositionCard
            key={position.id}
            position={position}
            selected={selections[position.id]}
            onSelectionChange={candidateId =>
              handleSelectionChange(position.id, candidateId, position.maxVotes > 1)
            }
          />
        ))}
      </Box>

      {/* Continue Button */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={() => navigate('/vote/login')}
          sx={{ py: { xs: 1.25, sm: 1.5 }, fontSize: { xs: '0.9rem', sm: '1rem' } }}
        >
          Back (Ddayo)
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          disabled={!isValidSelection()}
          onClick={handleContinue}
          sx={{
            py: { xs: 1.25, sm: 1.5 },
            fontWeight: 600,
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          Review (Kebera)
        </Button>
      </Box>
    </VoterLayout>
  )
}

/**
 * Position Card Component
 */
interface PositionCardProps {
  position: Position
  selected: number | number[] | undefined
  onSelectionChange: (candidateId: number) => void
}

const PositionCard: React.FC<PositionCardProps> = ({ position, selected, onSelectionChange }) => {
  const isMultiple = position.maxVotes > 1
  const candidateCount = position.candidates.length
  const seatLabel = position.maxVotes === 1 ? '1 seat' : `${position.maxVotes} seats`

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 14px 30px rgba(18, 33, 62, 0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 18px 36px rgba(18, 33, 62, 0.12)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {position.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isMultiple ? `Choose up to ${position.maxVotes}` : 'Choose one candidate'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Chip size="small" label={seatLabel} sx={{ bgcolor: 'rgba(67, 160, 71, 0.12)' }} />
            <Chip size="small" label={`${candidateCount} candidates`} />
          </Stack>
        </Box>

        {/* Candidates */}
        {candidateCount === 0 ? (
          <Box
            sx={{
              mt: 2.5,
              p: 2,
              borderRadius: 2,
              border: '1px dashed rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">No candidates yet</Typography>
          </Box>
        ) : isMultiple ? (
          <FormGroup sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {position.candidates.map(candidate => (
              <FormControlLabel
                key={candidate.id}
                control={
                  <Checkbox
                    checked={
                      Array.isArray(selected) ? selected.includes(candidate.id) : false
                    }
                    onChange={() => onSelectionChange(candidate.id)}
                    sx={{
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {(candidate.name || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {candidate.name}
                    </Typography>
                  </Box>
                }
                sx={{
                  m: 0,
                  width: '100%',
                  px: { xs: 1.25, sm: 1.75 },
                  py: { xs: 1.25, sm: 1.5 },
                  border: '1px solid',
                  borderColor: Array.isArray(selected) && selected.includes(candidate.id) ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  background: Array.isArray(selected) && selected.includes(candidate.id)
                    ? 'linear-gradient(135deg, rgba(143, 52, 147, 0.12) 0%, rgba(14, 97, 173, 0.08) 100%)'
                    : 'rgba(255, 255, 255, 0.9)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(143, 52, 147, 0.08)',
                    borderColor: 'primary.main',
                  },
                }}
              />
            ))}
          </FormGroup>
        ) : (
          <RadioGroup
            value={selected || ''}
            onChange={e => onSelectionChange(Number(e.target.value))}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            {position.candidates.map(candidate => (
              <FormControlLabel
                key={candidate.id}
                value={candidate.id}
                control={
                  <Radio
                    sx={{
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {(candidate.name || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {candidate.name}
                    </Typography>
                  </Box>
                }
                sx={{
                  m: 0,
                  width: '100%',
                  px: { xs: 1.25, sm: 1.75 },
                  py: { xs: 1.25, sm: 1.5 },
                  border: '1px solid',
                  borderColor: selected === candidate.id ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  background: selected === candidate.id
                    ? 'linear-gradient(135deg, rgba(143, 52, 147, 0.12) 0%, rgba(14, 97, 173, 0.08) 100%)'
                    : 'rgba(255, 255, 255, 0.9)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(143, 52, 147, 0.08)',
                    borderColor: 'primary.main',
                  },
                }}
              />
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  )
}

export default VoteBallotPage
