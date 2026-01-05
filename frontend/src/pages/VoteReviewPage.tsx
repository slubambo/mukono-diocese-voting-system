import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material'
import VoterLayout from '../components/layout/VoterLayout'
import { voteApi } from '../api/vote.api'
import type { Position } from '../api/vote.api'
import { useVoterAuth } from '../context/VoterAuthContext'

/**
 * UI-F3: Review & Confirm
 *
 * Voter reviews their selections before submission.
 */
const VoteReviewPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, clearSession } = useVoterAuth()

  const { selections, positions } = location.state as {
    selections: Record<number, number | number[]>
    positions: Position[]
  }

  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!selections || !positions) {
    return (
      <VoterLayout>
        <Card>
          <CardContent>
            <Alert severity="error">Invalid state. Please restart the voting process.</Alert>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/vote/ballot')}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </VoterLayout>
    )
  }

  const handleSubmit = async () => {
    if (!isConfirmed) {
      setError('Please confirm your selections before submitting.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare submission payload
      const votes = Object.entries(selections).map(([positionId, candidateIds]) => ({
        positionId: Number(positionId),
        candidateIds: Array.isArray(candidateIds) ? candidateIds : [candidateIds],
      }))

      // Submit vote
      await voteApi.submitVote(
        { votes },
        { headers: { Authorization: `Bearer ${session?.accessToken}` } }
      )

      // Clear session and redirect to success
      navigate('/vote/success')
    } catch (err: unknown) {
      console.error('Submit error:', err)

      if (err instanceof Error && err.message.includes('401')) {
        clearSession()
        navigate('/vote/login')
      } else {
        setError('Failed to submit your vote. Please try again.')
      }

      setIsSubmitting(false)
    }
  }

  return (
    <VoterLayout>
      {/* Progress Stepper */}
      <Stepper activeStep={2} sx={{ mb: 2, width: '100%' }}>
        <Step completed>
          <StepLabel sx={{ fontSize: { xs: '0.7rem', sm: 'inherit' } }}>Login</StepLabel>
        </Step>
        <Step completed>
          <StepLabel sx={{ fontSize: { xs: '0.7rem', sm: 'inherit' } }}>Vote (Londa)</StepLabel>
        </Step>
        <Step active>
          <StepLabel sx={{ fontSize: { xs: '0.7rem', sm: 'inherit' } }}>
            Review <span style={{ fontSize: '0.85em' }}>(Kebera)</span>
          </StepLabel>
        </Step>
        <Step>
          <StepLabel sx={{ fontSize: { xs: '0.7rem', sm: 'inherit' } }}>Submit</StepLabel>
        </Step>
      </Stepper>

      {/* Summary Title */}
      <Card elevation={2}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Review Your Selections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please verify your choices below before confirming your vote.
          </Typography>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Position Summaries */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {positions.map((position: Position) => {
          const selectedIds = selections[position.positionId]
          const selectedArray = Array.isArray(selectedIds) ? selectedIds : [selectedIds]
          const selectedCandidates = position.candidates.filter(c => selectedArray.includes(c.candidateId))

          return (
            <Card key={position.positionId} elevation={1}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Position Title */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  {position.positionName}
                </Typography>

                {/* Selected Candidates */}
                <Box sx={{ mb: 2 }}>
                  {selectedCandidates.map(candidate => (
                    <Box
                      key={candidate.candidateId}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        backgroundColor: 'success.light',
                        borderRadius: 1,
                        borderLeft: '4px solid',
                        borderLeftColor: 'success.main',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {candidate.fullName}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Change Link */}
                <Button
                  size="small"
                  variant="text"
                  color="primary"
                  onClick={() => navigate('/vote/ballot', { state: { selections, positions } })}
                  sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  Change (Ddayo)
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 2 }} />

      {/* Confirmation Checkbox */}
      <Card elevation={2}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isConfirmed}
                onChange={e => setIsConfirmed(e.target.checked)}
                disabled={isSubmitting}
              />
            }
            label={
              <Typography variant="body2">
                I confirm that my selections are correct.
              </Typography>
            }
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={() => navigate('/vote/ballot', { state: { selections, positions } })}
          disabled={isSubmitting}
          sx={{ py: { xs: 1.25, sm: 1.5 }, fontSize: { xs: '0.9rem', sm: '1rem' } }}
        >
          Back (Ddayo)
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          disabled={!isConfirmed || isSubmitting}
          onClick={handleSubmit}
          sx={{
            py: { xs: 1.25, sm: 1.5 },
            fontWeight: 600,
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Confirm & Submit (Kakasa Osindike)'
          )}
        </Button>
      </Box>
    </VoterLayout>
  )
}

export default VoteReviewPage
