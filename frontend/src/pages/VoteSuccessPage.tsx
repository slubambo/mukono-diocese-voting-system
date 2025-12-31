import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Typography, Box, Button } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import VoterLayout from '../components/layout/VoterLayout'
import { useVoterAuth } from '../context/VoterAuthContext'

/**
 * UI-F4a: Vote Submission Success
 *
 * Display success message and prevent back navigation.
 */
const VoteSuccessPage: React.FC = () => {
  const navigate = useNavigate()
  const { clearSession } = useVoterAuth()

  // Prevent back navigation
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleFinish = () => {
    clearSession()
    navigate('/vote/login')
  }

  return (
    <VoterLayout showHeader={true}>
      <Card elevation={3}>
        <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          {/* Success Icon */}
          <CheckCircleIcon
            sx={{
              fontSize: { xs: 60, sm: 80 },
              color: 'success.main',
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
            Success <span style={{ fontSize: '0.9em', fontWeight: 400 }}>(Bikozeseddwa Bulungi)</span>
          </Typography>

          {/* Message */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your vote has been submitted successfully.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Akalulu kwo kasindikiddwa bulungi.
          </Typography>

          {/* Info Box */}
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(67, 160, 71, 0.08)',
              border: '1px solid',
              borderColor: 'success.light',
              borderRadius: 1,
              mb: 3,
              textAlign: 'left',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Your vote is secure and anonymous. Thank you for participating in this election.
            </Typography>
          </Box>

          {/* Finish Button */}
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            onClick={handleFinish}
            sx={{
              py: { xs: 1.25, sm: 1.5 },
              fontWeight: 600,
              fontSize: { xs: '0.9rem', sm: '1rem' },
            }}
          >
            Finish (Mala)
          </Button>
        </CardContent>
      </Card>

      {/* Footer Message */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textAlign: 'center',
          display: 'block',
          mt: 2,
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
        }}
      >
        This page will not allow back navigation.
      </Typography>
    </VoterLayout>
  )
}

export default VoteSuccessPage
