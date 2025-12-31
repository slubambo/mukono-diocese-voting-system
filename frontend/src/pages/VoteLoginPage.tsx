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
      <Card elevation={3}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 1,
              textAlign: 'center',
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            Vote <span style={{ fontSize: '0.9em', fontWeight: 400 }}>(Londa)</span>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, textAlign: 'center', fontSize: { xs: '0.875rem', sm: '1rem' } }}
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
              placeholder="e.g., ABC123"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '16px', sm: 'inherit' }, // Prevent iOS zoom on input
                },
              }}
              InputProps={{
                endAdornment: isLoading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Helper Text */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Enter the voting code given to you by the polling officer.
            </Typography>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading || !code.trim()}
              sx={{
                mt: 2,
                py: { xs: 1.25, sm: 1.5 },
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue (Weyongereyo)'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          Your vote is secure and anonymous
        </Typography>
      </Box>
    </VoterLayout>
  )
}

export default VoteLoginPage
