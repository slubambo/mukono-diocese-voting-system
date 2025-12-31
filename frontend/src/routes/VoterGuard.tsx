import React from 'react'
import { Navigate } from 'react-router-dom'
import { useVoterAuth } from '../context/VoterAuthContext'

interface VoterRouteProps {
  children: React.ReactNode
}

/**
 * Route guard for voter-only pages
 * Redirects to login if voter session is missing or expired
 */
const VoterRoute: React.FC<VoterRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, hasSessionExpired } = useVoterAuth()

  // Show loading state
  if (isLoading) {
    return null
  }

  // Check authentication and expiry
  if (!isAuthenticated || hasSessionExpired()) {
    return <Navigate to="/vote/login" replace />
  }

  return <>{children}</>
}

export default VoterRoute
