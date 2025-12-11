import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import VoteLoginPage from '../pages/VoteLoginPage'
import AdminDashboard from '../pages/AdminDashboard'
import DSMainPage from '../pages/DSMainPage'
import VoterBallotPage from '../pages/VoterBallotPage'
import ProtectedRoute from './ProtectedRoute'
import VoterRoute from './VoterRoute'

const AppRoutes = () => (
  <Routes>
    {/* System user login */}
    <Route path="/login" element={<LoginPage />} />

    {/* Voter login (code-based) */}
    <Route path="/vote/login" element={<VoteLoginPage />} />

    {/* Admin area */}
    <Route
      path="/admin/*"
      element={
        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />

    {/* Diocesan Secretary area */}
    <Route
      path="/ds/*"
      element={
        <ProtectedRoute allowedRoles={['ROLE_DS']}>
          <DSMainPage />
        </ProtectedRoute>
      }
    />

    {/* Voter ballot */}
    <Route
      path="/vote"
      element={
        <VoterRoute>
          <VoterBallotPage />
        </VoterRoute>
      }
    />

    {/* Default route */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
)

export default AppRoutes
