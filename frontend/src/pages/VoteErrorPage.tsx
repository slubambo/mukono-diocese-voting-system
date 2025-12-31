import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, Typography, Box, Button, Alert } from '@mui/material'
import ErrorIcon from '@mui/icons-material/Error'
import VoterLayout from '../components/layout/VoterLayout'
import { useVoterAuth } from '../context/VoterAuthContext'

/**
 * UI-F4b: Vote Submission Error
 *
 * Display error message with recovery options.
 */
const VoteErrorPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearSession } = useVoterAuth()

  const errorMessage = (location.state?.message as string) || 'Something went wrong while submitting your vote.'

  const handleBackToReview = () => {
    navigate('/vote/review')
  }

  const handleBackToLogin = () => {
    clearSession()
    navigate('/vote/login')
  }

  return (
    <VoterLayout>
      <Card elevation={3}>
        <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          {/* Error Icon */}
          <ErrorIcon
            sx={{
              fontSize: { xs: 60, sm: 80 },
              color: 'error.main',
              mb: 2,
            }}
          />

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            Error <span style={{ fontSize: '0.9em', fontWeight: 400 }}>(Wabaddewo Kizibu)</span>
          </Typography>

          {/* Error Message */}
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            {errorMessage}
          </Alert>

          {/* Helper Text */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your vote has not been submitted. Please try again.
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleBackToReview}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              Back to Review (Ddayo)
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={handleBackToLogin}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              Back to Login
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
          }}
        >
          If the problem persists, please contact the polling officer.
        </Typography>
      </Box>
    </VoterLayout>
  )
}

export default VoteErrorPage
