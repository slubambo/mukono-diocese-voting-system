import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useToast } from '../components/feedback/ToastProvider'
import { useAuth } from '../context/AuthContext'

const VoteLoginPage = () => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginVoter } = useAuth()
  const toast = useToast()

  const handleVoterLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || code.length < 6) {
      toast.error('Voting code must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await loginVoter({ code: code.trim() })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
        <Paper elevation={3} sx={{ width: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #0E61AD 0%, #D7B161 100%)',
              color: 'white',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Mukono Diocese
              </Typography>
              <Typography variant="body2">Voter Login</Typography>
            </Box>
            <HowToVoteIcon sx={{ fontSize: 48 }} />
          </Box>

          {/* Content */}
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Enter your voting code to access the ballot. Your code was provided by the Diocese.
            </Typography>

            <form onSubmit={handleVoterLogin}>
              <TextField
                fullWidth
                label="Voting Code"
                placeholder="e.g., ABC123DEF456"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                disabled={loading}
                margin="normal"
                required
                inputProps={{
                  maxLength: 32,
                  style: { textTransform: 'uppercase', fontSize: '1.2rem', letterSpacing: '0.1em' },
                }}
                autoFocus
              />

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? 'Verifying...' : 'Enter Ballot'}
                </Button>
              </Box>
            </form>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default VoteLoginPage
