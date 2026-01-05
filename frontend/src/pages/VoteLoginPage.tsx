import React, { useEffect, useMemo, useState } from 'react'
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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import LockIcon from '@mui/icons-material/Lock'
import VoterLayout from '../components/layout/VoterLayout'
import { voteApi } from '../api/vote.api'
import type { VoteLoginResponse } from '../api/vote.api'
import { useVoterAuth } from '../context/VoterAuthContext'
import axios from 'axios'

/**
 * UI-F1: Voter Code Login
 *
 * Voters enter their voting code to access the ballot.
 * Simple, bilingual interface with Luganda keywords.
 */
const VoteLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setSession } = useVoterAuth()

  const CODE_LENGTH = 8
  const MAX_ATTEMPTS = 5
  const LOCKOUT_MS = 5 * 60 * 1000
  const [code, setCode] = useState('')
  const [phoneLast3, setPhoneLast3] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [step, setStep] = useState<'code' | 'phone'>('code')
  const [loginResponse, setLoginResponse] = useState<VoteLoginResponse | null>(null)
  const [codeAttempts, setCodeAttempts] = useState(0)
  const [phoneAttempts, setPhoneAttempts] = useState(0)
  const [codeLockedUntil, setCodeLockedUntil] = useState<number | null>(null)
  const [phoneLockedUntil, setPhoneLockedUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  const normalizedCode = useMemo(() => {
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
  }, [code, CODE_LENGTH])

  const normalizeCodeInput = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
  const normalizeLast3 = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 3)
  const formatRemaining = (remainingMs: number) => {
    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const isCodeLocked = codeLockedUntil !== null && codeLockedUntil > now
  const isPhoneLocked = phoneLockedUntil !== null && phoneLockedUntil > now

  useEffect(() => {
    if (!isCodeLocked && !isPhoneLocked) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [isCodeLocked, isPhoneLocked])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isCodeLocked) {
      setError(`Too many attempts. Try again in ${formatRemaining(codeLockedUntil - now)}.`)
      return
    }

    if (!normalizedCode.trim()) {
      setError('Please enter your voting code.')
      return
    }

    setError(null)
    setPhoneError(null)
    setIsLoading(true)

    try {
      const response = await voteApi.login({ code: normalizedCode.trim() })

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

      setLoginResponse(response)

      setCodeAttempts(0)
      setCodeLockedUntil(null)

      if (response.hasPhone) {
        setPhoneLast3('')
        setPhoneAttempts(0)
        setPhoneLockedUntil(null)
        setStep('phone')
      } else {
        // Redirect to ballot
        navigate('/vote/ballot')
      }
    } catch (err: unknown) {
      console.error('Login error:', err)

      setCodeAttempts(prev => {
        const next = prev + 1
        if (next >= MAX_ATTEMPTS) {
          setCodeLockedUntil(Date.now() + LOCKOUT_MS)
          return MAX_ATTEMPTS
        }
        return next
      })

      if (axios.isAxiosError(err)) {
        const apiMessage = err.response?.data?.message
        if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
          setError(apiMessage)
        } else if (err.response?.status === 401 || err.response?.status === 400) {
          setError('This voting code is invalid or has already been used.')
        } else {
          setError('Failed to log in. Please try again.')
        }
      } else if (err instanceof Error) {
        setError('Failed to log in. Please try again.')
      } else {
        setError('This voting code is invalid or has already been used.')
      }

      setCode('')
      setStep('code')
      setLoginResponse(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isPhoneLocked) {
      setPhoneError(`Too many attempts. Try again in ${formatRemaining(phoneLockedUntil - now)}.`)
      return
    }

    const cleaned = normalizeLast3(phoneLast3)
    if (cleaned.length !== 3) {
      setPhoneError('Please enter the last 3 digits of your phone number.')
      return
    }

    if (!loginResponse?.accessToken) {
      setPhoneError('Session missing. Please log in again.')
      setStep('code')
      return
    }

    setPhoneError(null)
    setIsVerifying(true)

    try {
      const response = await voteApi.verifyPhone(
        { last3: cleaned },
        { headers: { Authorization: `Bearer ${loginResponse.accessToken}` } }
      )

      if (!response.verified) {
        setPhoneAttempts(prev => {
          const next = prev + 1
          if (next >= MAX_ATTEMPTS) {
            setPhoneLockedUntil(Date.now() + LOCKOUT_MS)
            return MAX_ATTEMPTS
          }
          return next
        })
        setPhoneError(response.reason ? `Verification failed: ${response.reason}` : 'Verification failed.')
        return
      }

      setPhoneAttempts(0)
      setPhoneLockedUntil(null)
      navigate('/vote/ballot')
    } catch (err: unknown) {
      console.error('Phone verification error:', err)
      setPhoneAttempts(prev => {
        const next = prev + 1
        if (next >= MAX_ATTEMPTS) {
          setPhoneLockedUntil(Date.now() + LOCKOUT_MS)
          return MAX_ATTEMPTS
        }
        return next
      })
      if (axios.isAxiosError(err)) {
        const apiMessage = err.response?.data?.message
        if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
          setPhoneError(apiMessage)
        } else {
          setPhoneError('Failed to verify phone. Please try again.')
        }
      } else {
        setPhoneError('Failed to verify phone. Please try again.')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <VoterLayout>
      {/* Login Card */}
      <Card 
        elevation={10}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 16px 40px rgba(143, 52, 147, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
        <CardContent sx={{ p: { xs: 3.5, sm: 5 }, pt: { xs: 4, sm: 5.5 } }}>
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
          {step === 'code' ? 'Enter your voting code to get started' : 'Verify your phone to continue'}
          </Typography>

          <Stepper activeStep={step === 'code' ? 0 : 1} alternativeLabel sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Code</StepLabel>
            </Step>
            <Step>
              <StepLabel>Phone</StepLabel>
            </Step>
            <Step>
              <StepLabel>Ballot</StepLabel>
            </Step>
          </Stepper>

          {/* Error Alert */}
          {error && step === 'code' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {phoneError && step === 'phone' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {phoneError}
            </Alert>
          )}

          {step === 'code' ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Voting Code <span style={{ fontSize: '0.9em' }}>(Koodi y'Okulonda)</span>
              </Typography>

              {loginResponse?.fullName && (
                <Typography variant="body2" color="text.secondary">
                  Welcome, {loginResponse.fullName}
                </Typography>
              )}

              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 0.5,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(4, minmax(0, 1fr)) auto repeat(4, minmax(0, 1fr))`,
                    gap: { xs: 0.75, sm: 1 },
                    width: '100%',
                    maxWidth: 520,
                    alignItems: 'center',
                  }}
                >
                  {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                    const char = normalizedCode[index] || ''
                    const isActive = normalizedCode.length === index && !isLoading
                    const box = (
                      <Box
                        key={`code-box-${index}`}
                        sx={{
                          height: { xs: 42, sm: 48 },
                          borderRadius: 1.5,
                          border: '2px solid',
                          borderColor: isActive ? 'primary.main' : 'rgba(0, 0, 0, 0.15)',
                          bgcolor: isActive ? 'rgba(143, 52, 147, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '0.95rem', sm: '1.05rem' },
                          fontWeight: 600,
                          color: 'text.primary',
                          boxShadow: isActive ? '0 4px 12px rgba(143, 52, 147, 0.2)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {char}
                      </Box>
                    )

                    if (index === 3) {
                      return [
                        box,
                        <Box
                          key="code-dash"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            textAlign: 'center',
                            px: { xs: 0.25, sm: 0.5 },
                          }}
                        >
                          -
                        </Box>,
                      ]
                    }

                    return box
                  })}
                </Box>

                <Box
                  component="input"
                  type="text"
                  value={normalizedCode}
                  onChange={e => setCode(normalizeCodeInput(e.target.value))}
                  onPaste={e => {
                    e.preventDefault()
                    setCode(normalizeCodeInput(e.clipboardData.getData('text')))
                  }}
                  disabled={isLoading}
                  autoComplete="off"
                  autoFocus
                  inputMode="text"
                  aria-label="Voting code"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'text',
                  }}
                />
              </Box>

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
                  💡 Paste or type your code (e.g., 95LUE3GA). Only letters and numbers are accepted.
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Attempts: {codeAttempts}/{MAX_ATTEMPTS}
                {isCodeLocked && codeLockedUntil
                  ? ` • Try again in ${formatRemaining(codeLockedUntil - now)}`
                  : ''}
              </Typography>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={isLoading || normalizedCode.length !== CODE_LENGTH || isCodeLocked}
                sx={{
                  mt: 3,
                  py: { xs: 1.75, sm: 2 },
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(143, 52, 147, 0.25)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(143, 52, 147, 0.35)',
                    transform: 'translateY(-3px)',
                  },
                  '&:active': {
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    opacity: 0.6,
                  },
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue →'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleVerifyPhone} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(14, 97, 173, 0.08)',
                  border: '1px solid rgba(14, 97, 173, 0.2)',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Hello{loginResponse?.fullName ? `, ${loginResponse.fullName}` : ''}. One more step.
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                  Phone number: {loginResponse?.phoneMasked ?? '---'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enter the last 3 digits to confirm your identity.
                </Typography>
              </Box>

              {loginResponse?.positions?.length ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.03)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Your positions
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    These describe your current roles, not the ballot options.
                  </Typography>
                  {loginResponse.positions.map(position => (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      key={`${position.positionName}-${position.fellowshipName}-${position.scopeName}`}
                    >
                      {position.positionName} • {position.fellowshipName} • {position.scopeName}
                    </Typography>
                  ))}
                </Box>
              ) : null}

              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Last 3 digits
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 0.5,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(3, minmax(0, 1fr))`,
                    gap: { xs: 0.75, sm: 1 },
                    width: '100%',
                    maxWidth: 220,
                  }}
                >
                  {Array.from({ length: 3 }).map((_, index) => {
                    const char = phoneLast3[index] || ''
                    const isActive = phoneLast3.length === index && !isVerifying
                    return (
                      <Box
                        key={`phone-box-${index}`}
                        sx={{
                          height: { xs: 42, sm: 48 },
                          borderRadius: 1.5,
                          border: '2px solid',
                          borderColor: isActive ? 'primary.main' : 'rgba(0, 0, 0, 0.15)',
                          bgcolor: isActive ? 'rgba(14, 97, 173, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          fontWeight: 600,
                          color: 'text.primary',
                          boxShadow: isActive ? '0 4px 12px rgba(14, 97, 173, 0.2)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {char}
                      </Box>
                    )
                  })}
                </Box>

                <Box
                  component="input"
                  type="tel"
                  value={phoneLast3}
                  onChange={e => setPhoneLast3(normalizeLast3(e.target.value))}
                  onPaste={e => {
                    e.preventDefault()
                    setPhoneLast3(normalizeLast3(e.clipboardData.getData('text')))
                  }}
                  disabled={isVerifying}
                  autoComplete="off"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label="Last 3 digits"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'text',
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={isVerifying || phoneLast3.length !== 3 || isPhoneLocked}
                sx={{
                  mt: 2,
                  py: { xs: 1.6, sm: 1.9 },
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.05rem' },
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(14, 97, 173, 0.25)',
                }}
              >
                {isVerifying ? <CircularProgress size={24} color="inherit" /> : 'Verify and Continue →'}
              </Button>

              <Typography variant="caption" color="text.secondary">
                Attempts: {phoneAttempts}/{MAX_ATTEMPTS}
                {isPhoneLocked && phoneLockedUntil
                  ? ` • Try again in ${formatRemaining(phoneLockedUntil - now)}`
                  : ''}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Info Section */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mt: 3.5,
          p: 2.5,
          bgcolor: 'rgba(67, 160, 71, 0.08)',
          borderRadius: 2,
          border: '1.5px solid',
          borderColor: 'rgba(67, 160, 71, 0.25)',
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: 'rgba(67, 160, 71, 0.12)',
            borderColor: 'rgba(67, 160, 71, 0.35)',
          },
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
