import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  children: React.ReactElement | null
  allowedRoles: string[]
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, token } = useAuth()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  const hasRole = user.roles.some(role => allowedRoles.includes(role))

  if (!hasRole) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
