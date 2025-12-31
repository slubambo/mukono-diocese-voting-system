import React, { useEffect, useState } from 'react'
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
} from '@mui/material'
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
      <VoterLayout>
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
      <VoterLayout>
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
    <VoterLayout>
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

      {/* Ballot Instructions */}
      <Card elevation={2}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary">
            Select your preferred candidate for each position below.
          </Typography>
        </CardContent>
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

  return (
    <Card
      elevation={2}
      sx={{
        '&:hover': {
          elevation: 3,
        },
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Position Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {position.title}
        </Typography>

        {/* Instructions */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {isMultiple ? (
            <>Select your preferred candidates (up to {position.maxVotes})</>
          ) : (
            <>Select your preferred candidate</>
          )}
        </Typography>

        {/* Candidates */}
        {isMultiple ? (
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
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {candidate.name}
                    </Typography>
                  </Box>
                }
                sx={{
                  m: 0,
                  width: '100%',
                  px: 1.5,
                  py: 1,
                  border: '1px solid',
                  borderColor: Array.isArray(selected) && selected.includes(candidate.id) ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  backgroundColor:
                    Array.isArray(selected) && selected.includes(candidate.id) ? 'primary.light' : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'action.hover',
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
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {candidate.name}
                    </Typography>
                  </Box>
                }
                sx={{
                  m: 0,
                  width: '100%',
                  px: 1.5,
                  py: 1,
                  border: '1px solid',
                  borderColor: selected === candidate.id ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  backgroundColor: selected === candidate.id ? 'primary.light' : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'action.hover',
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
