import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export interface VoterSession {
  accessToken: string
  tokenType: string
  expiresAt: number
  personId: number
  electionId: number
  votingPeriodId: number
}

interface VoterAuthContextType {
  session: VoterSession | null
  isAuthenticated: boolean
  isLoading: boolean
  setSession: (session: VoterSession | null) => void
  clearSession: () => void
  hasSessionExpired: () => boolean
}

const VOTER_STORAGE_KEY = 'mdvs_voter_session'

const VoterAuthContext = createContext<VoterAuthContextType | undefined>(undefined)

/**
 * Load voter session from storage, checking expiry
 */
const loadVoterSession = (): VoterSession | null => {
  try {
    const raw = localStorage.getItem(VOTER_STORAGE_KEY)
    if (!raw) return null

    const session = JSON.parse(raw) as VoterSession
    const now = Date.now()

    // Check if session has expired
    if (session.expiresAt <= now) {
      localStorage.removeItem(VOTER_STORAGE_KEY)
      return null
    }

    return session
  } catch (error) {
    console.error('Failed to load voter session:', error)
    localStorage.removeItem(VOTER_STORAGE_KEY)
    return null
  }
}

/**
 * Persist voter session to storage
 */
const persistVoterSession = (session: VoterSession | null) => {
  if (!session) {
    localStorage.removeItem(VOTER_STORAGE_KEY)
  } else {
    localStorage.setItem(VOTER_STORAGE_KEY, JSON.stringify(session))
  }
}

export const VoterAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<VoterSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Initialize from storage
  useEffect(() => {
    const stored = loadVoterSession()
    setSessionState(stored)
    setIsLoading(false)
  }, [])

  // Persist session when it changes
  const setSession = useCallback((newSession: VoterSession | null) => {
    setSessionState(newSession)
    persistVoterSession(newSession)
  }, [])

  // Clear session (logout)
  const clearSession = useCallback(() => {
    setSessionState(null)
    persistVoterSession(null)
    navigate('/vote/login')
  }, [navigate])

  // Check if session has expired
  const hasSessionExpired = useCallback(() => {
    if (!session) return true
    return Date.now() >= session.expiresAt
  }, [session])

  const value: VoterAuthContextType = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null && !hasSessionExpired(),
      isLoading,
      setSession,
      clearSession,
      hasSessionExpired,
    }),
    [session, isLoading, setSession, clearSession, hasSessionExpired]
  )

  return <VoterAuthContext.Provider value={value}>{children}</VoterAuthContext.Provider>
}

/**
 * Hook to access voter authentication state
 */
export const useVoterAuth = () => {
  const context = useContext(VoterAuthContext)
  if (context === undefined) {
    throw new Error('useVoterAuth must be used within VoterAuthProvider')
  }
  return context
}
