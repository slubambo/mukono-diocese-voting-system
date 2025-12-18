import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  roles: string[]
  children: React.ReactElement
}

const RequireRole: React.FC<Props> = ({ roles, children }) => {
  const { token, user, authType } = useAuth()
  const location = useLocation()

  if (!token || authType !== 'system' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const allowed = user.roles.some(role => roles.includes(role))
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default RequireRole
