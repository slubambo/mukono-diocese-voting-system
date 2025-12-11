import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  children: JSX.Element
}

const VoterRoute = ({ children }: Props) => {
  const { user, token } = useAuth()

  if (!token || !user) {
    return <Navigate to="/vote/login" replace />
  }

  const isVoter = user.roles.includes('ROLE_VOTER')

  if (!isVoter) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default VoterRoute
