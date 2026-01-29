import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { voteApi } from '../api/vote.api'
import type { LoginRequest, Role } from '../api/auth.api'
import type { VoteLoginRequest, VoteLoginResponse } from '../api/vote.api'
import { useToast } from '../components/feedback/ToastProvider'

type AuthType = 'system' | 'voter' | null

type SystemSession = {
  token: string
  tokenType: string
  username: string
  roles: Role[]
  expiresAt: number
  remember: boolean
}

type VoterSession = {
  token: string
  tokenType: string
  expiresAt: number
  personId: number
  electionId: number
  votingPeriodId: number
}

type AuthState = {
  authType: AuthType
  system?: SystemSession
  voter?: VoterSession
}

type AuthContextType = {
  authType: AuthType
  token: string | null
  user: { username: string; roles: Role[] } | null
  voterInfo: VoterSession | null
  loginSystem: (payload: LoginRequest & { remember?: boolean }) => Promise<void>
  loginVoter: (payload: VoteLoginRequest) => Promise<void>
  logout: (opts?: { silent?: boolean }) => void
}

const STORAGE_KEY = 'mdvs_auth_state'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const decodeJwtExp = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload?.exp) {
      return payload.exp * 1000
    }
    return null
  } catch (error) {
    console.error('Failed to decode JWT', error)
    return null
  }
}

const parseStoredAuth = (raw: string | null): AuthState | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthState
    const now = Date.now()
    if (parsed.system && parsed.system.expiresAt <= now) return null
    if (parsed.voter && parsed.voter.expiresAt <= now) return null
    return parsed
  } catch (error) {
    console.error('Failed to parse stored auth', error)
    return null
  }
}

const loadStoredAuth = (): AuthState | null => {
  // Prefer sessionStorage for non-"remember me" sessions, fall back to localStorage
  const fromSession = parseStoredAuth(sessionStorage.getItem(STORAGE_KEY))
  if (fromSession) return fromSession
  return parseStoredAuth(localStorage.getItem(STORAGE_KEY))
}

const persistAuth = (state: AuthState | null) => {
  if (!state || state.authType === null) {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('mdvs_token')
    sessionStorage.removeItem('mdvs_token')
    return
  }

  // Decide where to persist: sessionStorage for non-remember system logins, localStorage otherwise
  const prefersSession =
    state.authType === 'system' ? !state.system?.remember : false
  const primaryStorage = prefersSession ? sessionStorage : localStorage
  const secondaryStorage = prefersSession ? localStorage : sessionStorage

  const token =
    state.authType === 'system'
      ? state.system?.token
      : state.authType === 'voter'
        ? state.voter?.token
        : null

  if (token) {
    primaryStorage.setItem('mdvs_token', token)
  }
  secondaryStorage.removeItem('mdvs_token')

  // Persist full auth state
  primaryStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  secondaryStorage.removeItem(STORAGE_KEY)
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast()
  const navigate = useNavigate()
  const [state, setState] = useState<AuthState>(() => loadStoredAuth() || { authType: null })
  const expiryTimer = useRef<number | null>(null)

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimer.current) {
      window.clearTimeout(expiryTimer.current)
      expiryTimer.current = null
    }
  }, [])

  const handleLogout = useCallback(({ silent = false }: { silent?: boolean } = {}) => {
    clearExpiryTimer()
    setState({ authType: null })
    persistAuth(null)
    if (!silent) {
      toast.info('Session expired. Please log in again.')
    }
    navigate('/login', { replace: true })
  }, [clearExpiryTimer, navigate, toast])

  const scheduleExpiry = useCallback((expiresAt: number | null) => {
    clearExpiryTimer()
    if (!expiresAt) return
    const delay = expiresAt - Date.now()
    if (delay <= 0) {
      handleLogout({ silent: false })
      return
    }
    expiryTimer.current = window.setTimeout(() => {
      handleLogout({ silent: false })
    }, delay)
  }, [clearExpiryTimer, handleLogout])

  const loginSystem = useCallback(async (payload: LoginRequest & { remember?: boolean }) => {
    const { remember, ...rest } = payload
    const response = await authApi.login(rest)

    const exp = decodeJwtExp(response.accessToken)
    if (!exp) {
      throw new Error('Invalid token: missing exp')
    }

    // Optionally refresh roles from /me to avoid trusting local cache
    let resolvedUser: { username: string; roles: Role[] } = {
      username: response.username,
      roles: response.roles,
    }

    try {
      const me = await authApi.me({
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      })
      if (me?.roles?.length) {
        resolvedUser = { username: me.username, roles: me.roles }
      }
    } catch (error) {
      // If /me fails, proceed with login response but log
      console.warn('Failed to fetch /users/me, using login response roles', error)
    }

    const nextState: AuthState = {
      authType: 'system',
      system: {
        token: response.accessToken,
        tokenType: response.tokenType,
        username: resolvedUser.username,
        roles: resolvedUser.roles,
        expiresAt: exp,
        remember: Boolean(remember),
      },
    }

    setState(nextState)
    persistAuth(nextState)
    scheduleExpiry(exp)

    // Redirect based on role
    if (resolvedUser.roles.includes('ROLE_ADMIN')) {
      navigate('/admin', { replace: true })
    } else if (
      resolvedUser.roles.some(role =>
        ['ROLE_DS', 'ROLE_BISHOP', 'ROLE_SENIOR_STAFF', 'ROLE_POLLING_OFFICER'].includes(role)
      )
    ) {
      navigate('/ds', { replace: true })
    } else {
      navigate('/unauthorized', { replace: true })
    }
  }, [navigate, scheduleExpiry])

  const loginVoter = useCallback(async (payload: VoteLoginRequest) => {
    const response: VoteLoginResponse = await voteApi.login(payload)
    const now = Date.now()
    const expiresAt = now + response.expiresIn * 1000

    const nextState: AuthState = {
      authType: 'voter',
      voter: {
        token: response.accessToken,
        tokenType: response.tokenType,
        expiresAt,
        personId: response.personId,
        electionId: response.electionId,
        votingPeriodId: response.votingPeriodId,
      },
    }

    setState(nextState)
    persistAuth(nextState)
    scheduleExpiry(expiresAt)
    navigate('/vote', { replace: true })
  }, [navigate, scheduleExpiry])

  // Schedule expiry on mount/changes
  useEffect(() => {
    if (state.authType === 'system' && state.system?.expiresAt) {
      scheduleExpiry(state.system.expiresAt)
    } else if (state.authType === 'voter' && state.voter?.expiresAt) {
      scheduleExpiry(state.voter.expiresAt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.authType, state.system?.expiresAt, state.voter?.expiresAt])

  const value = useMemo<AuthContextType>(() => {
    const token =
      state.authType === 'system'
        ? state.system?.token ?? null
        : state.authType === 'voter'
          ? state.voter?.token ?? null
          : null

    const user =
      state.authType === 'system' && state.system
        ? { username: state.system.username, roles: state.system.roles }
        : state.authType === 'voter'
          ? { username: 'voter', roles: ['ROLE_VOTER'] as Role[] }
          : null

    const voterInfo = state.authType === 'voter' && state.voter ? state.voter : null

    return {
      authType: state.authType,
      token,
      user,
      voterInfo,
      loginSystem,
      loginVoter,
      logout: handleLogout,
    }
  }, [state, loginSystem, loginVoter, handleLogout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
