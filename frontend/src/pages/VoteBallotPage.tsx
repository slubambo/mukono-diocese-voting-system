import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  LinearProgress,
  Tooltip,
} from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import GroupIcon from '@mui/icons-material/Group'
import BallotIcon from '@mui/icons-material/Ballot'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import VoterLayout from '../components/layout/VoterLayout'
import { voteApi } from '../api/vote.api'
import type { BallotData, Position } from '../api/vote.api'
import { useVoterAuth } from '../context/VoterAuthContext'
import { alpha } from '@mui/material/styles'

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
  const positionRefs = useRef<Record<number, HTMLElement | null>>({})

  const ballotStats = useMemo(() => {
    if (!ballot) return { positions: 0, candidates: 0 }
    const candidates = ballot.positions.reduce((sum, pos) => sum + pos.candidates.length, 0)
    return { positions: ballot.positions.length, candidates }
  }, [ballot])

  const completedCount = useMemo(() => {
    if (!ballot) return 0
    return ballot.positions.reduce((sum, pos) => {
      const selected = selections[pos.id]
      if (pos.maxVotes === 1) return sum + (typeof selected === 'number' ? 1 : 0)
      return sum + (Array.isArray(selected) && selected.length > 0 ? 1 : 0)
    }, 0)
  }, [ballot, selections])

  const scrollToPosition = (index: number) => {
    if (!ballot) return
    const target = ballot.positions[index]
    if (!target) return
    const el = positionRefs.current[target.id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
      <Stepper
        activeStep={1}
        sx={{
          mb: 2.5,
          width: '100%',
          '& .MuiStepIcon-root': {
            color: 'rgba(0,0,0,0.14)',
            '&.Mui-active': {
              color: 'primary.main',
              filter: 'drop-shadow(0 6px 12px rgba(37, 99, 235, 0.25))',
            },
            '&.Mui-completed': {
              color: 'success.main',
            },
          },
          '& .MuiStepConnector-line': {
            borderColor: 'rgba(0,0,0,0.08)',
            borderWidth: 1.5,
          },
          '& .MuiStepLabel-label': {
            fontWeight: 600,
          },
        }}
      >
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
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.12)} 100%)`,
          border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }} alignItems="center">
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip icon={<GroupIcon />} label={`${ballotStats.positions} Positions`} />
            <Chip icon={<BallotIcon />} label={`${ballotStats.candidates} Candidates`} />
            <Chip icon={<CheckCircleIcon color="success" />} label={`${completedCount}/${ballotStats.positions} Completed`} />
          </Stack>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <LinearProgress
              variant="determinate"
              value={ballotStats.positions ? (completedCount / ballotStats.positions) * 100 : 0}
              sx={{ height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.6)' }}
            />
          </Box>
        </Stack>
      </Card>

      {/* Quick Nav Pills */}
      <Box
        sx={{
          mt: 2,
          mb: 1,
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 1,
          pr: 1,
          maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
        }}
      >
        {ballot?.positions.map((pos, idx) => {
          const isComplete = selections[pos.id] !== undefined && (pos.maxVotes === 1 ? typeof selections[pos.id] === 'number' : Array.isArray(selections[pos.id]) && (selections[pos.id] as number[]).length > 0)
          return (
            <Chip
              key={pos.id}
              size="small"
              icon={isComplete ? <CheckCircleIcon fontSize="small" color="success" /> : undefined}
              label={`${idx + 1}. ${pos.title}`}
              variant={isComplete ? 'filled' : 'outlined'}
              color={isComplete ? 'success' : 'default'}
              onClick={() => scrollToPosition(idx)}
              sx={{
                borderRadius: 2,
                backgroundColor: isComplete ? 'rgba(34,197,94,0.12)' : 'background.paper',
              }}
            />
          )
        })}
      </Box>

      {/* Positions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {ballot?.positions.map((position: Position, idx) => (
          <PositionCard
            key={position.id}
            ref={el => { positionRefs.current[position.id] = el }}
            position={position}
            index={idx}
            total={ballot.positions.length}
            selected={selections[position.id]}
            isComplete={position.maxVotes === 1 ? typeof selections[position.id] === 'number' : Array.isArray(selections[position.id]) && (selections[position.id] as number[]).length > 0}
            onSelectionChange={candidateId =>
              handleSelectionChange(position.id, candidateId, position.maxVotes > 1)
            }
            onNext={() => scrollToPosition(idx + 1)}
            onPrev={() => scrollToPosition(idx - 1)}
          />
        ))}
      </Box>

      {/* Continue Button */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mt: 2.5,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          position: { xs: 'static', md: 'sticky' },
          bottom: { md: 12 },
          zIndex: 2,
          background: { md: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0) 100%)' },
          backdropFilter: { md: 'blur(6px)' },
          pb: { md: 1 },
        }}
      >
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
  index: number
  total: number
  selected: number | number[] | undefined
  isComplete: boolean
  onSelectionChange: (candidateId: number) => void
  onNext: () => void
  onPrev: () => void
}
const PositionCard = React.forwardRef<HTMLDivElement, PositionCardProps>(
  ({ position, selected, onSelectionChange, index, total, onNext, onPrev, isComplete }, ref) => {
    const isMultiple = position.maxVotes > 1
    const candidateCount = position.candidates.length
    const seatLabel = position.maxVotes === 1 ? '1 seat' : `${position.maxVotes} seats`

    return (
      <Card
        ref={ref}
        elevation={0}
        id={`position-${position.id}`}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 12px 26px rgba(18, 33, 62, 0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 18px 36px rgba(18, 33, 62, 0.12)',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.75 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Stack spacing={0.4}>
              <Typography variant="overline" sx={{ letterSpacing: 0.5, color: 'text.secondary' }}>
                Position {index + 1} of {total}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {position.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isMultiple ? `Choose up to ${position.maxVotes}` : 'Choose one candidate'}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Chip size="small" label={seatLabel} sx={{ bgcolor: 'rgba(67, 160, 71, 0.12)' }} />
              <Chip size="small" label={`${candidateCount} candidates`} />
              {isComplete && <Chip size="small" color="success" label="Saved" icon={<CheckCircleIcon fontSize="small" />} />}
            </Stack>
          </Box>

          {/* Candidates */}
          {candidateCount === 0 ? (
            <Box
              sx={{
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
            <FormGroup sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
              {position.candidates.map(candidate => {
                const checked = Array.isArray(selected) ? selected.includes(candidate.id) : false
                return (
                  <FormControlLabel
                    key={candidate.id}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={() => onSelectionChange(candidate.id)}
                        sx={{
                          '&.Mui-checked': {
                            color: 'success.main',
                          },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
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
                      px: { xs: 1.25, sm: 1.5 },
                      py: { xs: 1.1, sm: 1.25 },
                      border: '1px solid',
                      borderColor: checked ? 'success.main' : 'divider',
                      borderRadius: 2,
                      background: checked
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(59,130,246,0.08) 100%)'
                        : 'rgba(255, 255, 255, 0.96)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.06)',
                        borderColor: 'primary.main',
                      },
                    }}
                  />
                )
              })}
            </FormGroup>
          ) : (
            <RadioGroup
              value={selected || ''}
              onChange={e => onSelectionChange(Number(e.target.value))}
              sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}
            >
              {position.candidates.map(candidate => {
                const checked = selected === candidate.id
                return (
                  <FormControlLabel
                    key={candidate.id}
                    value={candidate.id}
                    control={
                      <Radio
                        sx={{
                          '&.Mui-checked': {
                            color: 'success.main',
                          },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
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
                      px: { xs: 1.25, sm: 1.5 },
                      py: { xs: 1.1, sm: 1.25 },
                      border: '1px solid',
                      borderColor: checked ? 'success.main' : 'divider',
                      borderRadius: 2,
                      background: checked
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(59,130,246,0.08) 100%)'
                        : 'rgba(255, 255, 255, 0.96)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.06)',
                        borderColor: 'primary.main',
                      },
                    }}
                  />
                )
              })}
            </RadioGroup>
          )}

          {/* Local controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Previous position">
                <span>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<ArrowBackIosNewIcon fontSize="small" />}
                    onClick={onPrev}
                    disabled={index === 0}
                  >
                    Prev
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Next position">
                <span>
                  <Button
                    size="small"
                    variant="text"
                    endIcon={<ArrowForwardIosIcon fontSize="small" />}
                    onClick={onNext}
                    disabled={index === total - 1}
                  >
                    Next
                  </Button>
                </span>
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Auto-saved when selected
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }
)

export default VoteBallotPage
