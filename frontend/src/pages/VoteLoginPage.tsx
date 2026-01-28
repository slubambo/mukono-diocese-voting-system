import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent, Button,
  Typography,
  Box,
  Alert,
  CircularProgress, Stepper,
  Step,
  StepLabel
} from '@mui/material'
import { alpha } from '@mui/material/styles'
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
        elevation={0}
        sx={{
          borderRadius: 3.5,
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f7fb 100%)',
          border: '1px solid rgba(76, 29, 149, 0.08)',
          boxShadow: '0 18px 50px rgba(76, 29, 149, 0.14)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 24px 60px rgba(76, 29, 149, 0.18)',
            transform: 'translateY(-2px)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #7e22ce 0%, #2563eb 100%)',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 3.5, sm: 5 }, pt: { xs: 4.5, sm: 6 } }}>
          {/* Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7e22ce 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 3,
              boxShadow: '0 10px 30px rgba(76, 29, 149, 0.28)',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -10,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(126,34,206,0.25) 0%, rgba(37,99,235,0) 65%)',
                filter: 'blur(8px)',
                zIndex: 0,
              },
              '& > svg': {
                position: 'relative',
                zIndex: 1,
              },
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

          <Stepper
            activeStep={step === 'code' ? 0 : 1}
            alternativeLabel
            sx={{
              mb: 3.5,
              px: { xs: 1, sm: 2 },
              '& .MuiStepIcon-root': {
                color: 'rgba(0,0,0,0.15)',
                '&.Mui-active': {
                  color: 'primary.main',
                  filter: 'drop-shadow(0 6px 14px rgba(37, 99, 235, 0.28))',
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
                color: 'text.secondary',
                '&.Mui-active': {
                  color: 'text.primary',
                },
              },
            }}
          >
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
                    const hasValue = Boolean(char)
                    const box = (
                      <Box
                        key={`code-box-${index}`}
                        sx={{
                          height: { xs: 42, sm: 48 },
                          borderRadius: 1.5,
                          border: '2px solid',
                          borderColor: hasValue ? 'success.main' : isActive ? 'primary.main' : 'divider',
                          bgcolor: theme =>
                            hasValue
                              ? alpha(theme.palette.success.main, 0.12)
                              : isActive
                                ? alpha(theme.palette.primary.main, 0.1)
                                : alpha(theme.palette.grey[900], 0.04),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '0.95rem', sm: '1.05rem' },
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          color: 'text.primary',
                          boxShadow: theme =>
                            hasValue
                              ? `0 0 0 2px ${alpha(theme.palette.success.main, 0.2)}`
                              : isActive
                                ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.16)}`
                                : 'none',
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
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.06),
                  p: 1.5,
                  borderRadius: 1.5,
                  mt: 1,
                  border: theme => `1px dashed ${alpha(theme.palette.primary.main, 0.28)}`,
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
                  backgroundImage: 'linear-gradient(120deg, #7e22ce 0%, #2563eb 100%)',
                  backgroundSize: '200% 100%',
                  boxShadow: '0 12px 24px rgba(55, 65, 81, 0.18)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundPosition: '100% 0',
                    boxShadow: '0 16px 30px rgba(55, 65, 81, 0.24)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    backgroundImage: 'none',
                    backgroundColor: 'grey.300',
                    color: 'grey.600',
                    boxShadow: 'none',
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
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.06),
                  border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  boxShadow: theme => `0 8px 20px ${alpha(theme.palette.primary.main, 0.12)}`,
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
                    p: 2.25,
                    borderRadius: 2,
                    bgcolor: theme => alpha(theme.palette.grey[900], 0.03),
                    border: theme => `1px solid ${alpha(theme.palette.grey[900], 0.08)}`,
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
                    const hasValue = Boolean(char)
                    return (
                      <Box
                        key={`phone-box-${index}`}
                        sx={{
                          height: { xs: 42, sm: 48 },
                          borderRadius: 1.5,
                          border: '2px solid',
                          borderColor: hasValue ? 'success.main' : isActive ? 'primary.main' : 'divider',
                          bgcolor: theme =>
                            hasValue
                              ? alpha(theme.palette.success.main, 0.12)
                              : isActive
                                ? alpha(theme.palette.primary.main, 0.1)
                                : alpha(theme.palette.grey[900], 0.04),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          fontWeight: 600,
                          color: 'text.primary',
                          boxShadow: theme =>
                            hasValue
                              ? `0 0 0 2px ${alpha(theme.palette.success.main, 0.2)}`
                              : isActive
                                ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.16)}`
                                : 'none',
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
                  backgroundImage: 'linear-gradient(120deg, #2563eb 0%, #16a34a 100%)',
                  backgroundSize: '200% 100%',
                  boxShadow: '0 10px 22px rgba(55, 65, 81, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundPosition: '100% 0',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 14px 26px rgba(55, 65, 81, 0.25)',
                  },
                  '&:disabled': {
                    backgroundImage: 'none',
                    backgroundColor: 'grey.300',
                    color: 'grey.600',
                    boxShadow: 'none',
                  },
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
          p: { xs: 2.25, sm: 2.75 },
          borderRadius: 2.5,
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.07)} 100%)`,
          border: theme => `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
          boxShadow: theme => `0 12px 30px ${alpha(theme.palette.success.main, 0.18)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
          <LockIcon sx={{ fontSize: 18, color: 'success.dark' }} />
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.86rem', sm: '0.95rem' },
              fontWeight: 700,
              color: 'success.dark',
            }}
          >
            Your vote is secure and anonymous
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.76rem', sm: '0.82rem' } }}
        >
          We use industry-standard encryption to protect your privacy
        </Typography>
      </Box>
    </VoterLayout>
  )
}

export default VoteLoginPage
