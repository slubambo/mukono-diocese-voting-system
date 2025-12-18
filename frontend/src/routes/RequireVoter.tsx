import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactElement
}

const RequireVoter: React.FC<Props> = ({ children }) => {
  const { token, authType, user } = useAuth()
  const location = useLocation()

  if (!token || authType !== 'voter' || !user?.roles.includes('ROLE_VOTER')) {
    return <Navigate to="/vote/login" replace state={{ from: location }} />
  }

  return children
}

export default RequireVoter
