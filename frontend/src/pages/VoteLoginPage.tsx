import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import LockIcon from '@mui/icons-material/Lock'
import VoterLayout from '../components/layout/VoterLayout'
import { voteApi } from '../api/vote.api'
import { useVoterAuth } from '../context/VoterAuthContext'

/**
 * UI-F1: Voter Code Login
 *
 * Voters enter their voting code to access the ballot.
 * Simple, bilingual interface with Luganda keywords.
 */
const VoteLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setSession } = useVoterAuth()

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code.trim()) {
      setError('Please enter your voting code.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await voteApi.login({ code: code.trim() })

      // Calculate expiry time in milliseconds
      const expiresAt = Date.now() + response.expiresIn * 1000

      // Store session
      setSession({
        accessToken: response.accessToken,
        tokenType: response.tokenType,
        expiresAt,
        personId: response.personId,
        electionId: response.electionId,
        votingPeriodId: response.votingPeriodId,
      })

      // Redirect to ballot
      navigate('/vote/ballot')
    } catch (err: unknown) {
      console.error('Login error:', err)

      // Handle specific error messages
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('invalid')) {
          setError('This voting code is invalid or has already been used.')
        } else {
          setError('Failed to log in. Please try again.')
        }
      } else {
        setError('This voting code is invalid or has already been used.')
      }

      setCode('')
      setIsLoading(false)
    }
  }

  return (
    <VoterLayout>
      {/* Login Card */}
      <Card 
        elevation={8}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #8F3493 0%, #0E61AD 100%)',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 }, pt: { xs: 4, sm: 6 } }}>
          {/* Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8F3493 0%, #6B2670 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 3,
              boxShadow: '0 8px 16px rgba(143, 52, 147, 0.25)',
            }}
          >
            <HowToVoteIcon sx={{ fontSize: 48, color: 'white' }} />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              textAlign: 'center',
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              color: 'primary.main',
            }}
          >
            Vote <span style={{ fontSize: '0.85em', fontWeight: 500, color: '#666' }}>(Londa)</span>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ 
              mb: 4, 
              textAlign: 'center', 
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              lineHeight: 1.6,
            }}
          >
            Enter your voting code to get started
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Code Input */}
            <TextField
              id="voting-code"
              label={
                <span>
                  Voting Code <span style={{ fontSize: '0.9em' }}>(Koodi y'Okulonda)</span>
                </span>
              }
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
              autoFocus
              placeholder="Enter your code (e.g., ABC123)"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '16px', sm: 'inherit' },
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px',
                    },
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px',
                    },
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1.75,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                },
              }}
              InputProps={{
                endAdornment: isLoading && (
                  <InputAdornment position="end">
                    <CircularProgress size={24} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Helper Text */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(0, 0, 0, 0.03)',
                p: 1.5,
                borderRadius: 1.5,
                mt: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' }, lineHeight: 1.5 }}
              >
                💡 Enter the voting code given to you by the polling officer.
              </Typography>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading || !code.trim()}
              sx={{
                mt: 3,
                py: { xs: 1.75, sm: 2 },
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(143, 52, 147, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(143, 52, 147, 0.4)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  opacity: 0.6,
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue to Ballot (Weyongereyo) →'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mt: 3,
          p: 2.5,
          bgcolor: 'rgba(67, 160, 71, 0.08)',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'rgba(67, 160, 71, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
          <LockIcon sx={{ fontSize: 18, color: 'success.main' }} />
          <Typography
            variant="body2"
            sx={{ 
              fontSize: { xs: '0.85rem', sm: '0.9rem' },
              fontWeight: 600,
              color: 'success.dark',
            }}
          >
            Your vote is secure and anonymous
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
        >
          We use industry-standard encryption to protect your privacy
        </Typography>
      </Box>
    </VoterLayout>
  )
}

export default VoteLoginPage
