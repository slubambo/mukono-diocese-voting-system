import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import VoteLoginPage from '../pages/VoteLoginPage'
import VoteBallotPage from '../pages/VoteBallotPage'
import VoteReviewPage from '../pages/VoteReviewPage'
import VoteSuccessPage from '../pages/VoteSuccessPage'
import VoteErrorPage from '../pages/VoteErrorPage'
import AdminDashboard from '../pages/AdminDashboard'
import DSMainPage from '../pages/DSMainPage'
import VoterBallotPage from '../pages/VoterBallotPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'
import RequireRole from './RequireRole'
import RequireVoter from './RequireVoter'
import VoterGuard from './VoterGuard'
import { DiocesePage } from '../pages/configuration/DiocesePage'
import { ArchdeaconryPage } from '../pages/configuration/ArchdeaconryPage'
import { ChurchPage } from '../pages/configuration/ChurchPage'
import { FellowshipPage } from '../pages/configuration/FellowshipPage'
import { PositionTitlePage } from '../pages/configuration/PositionTitlePage'
import { PositionPage } from '../pages/configuration/PositionPage'
import PeopleRegistryPage from '../pages/PeopleRegistryPage'
import LeadershipAssignmentsPage from '../pages/LeadershipAssignmentsPage'
import UserManagementPage from '../pages/UserManagementPage'
import ElectionsPage from '../pages/ElectionsPage'
import ElectionDetailPage from '../pages/ElectionDetailPage'
import EligibilityCodesPage from '../pages/EligibilityCodesPage'
import ElectionResultsPage from '../pages/ElectionResultsPage'
import ResultsLandingPage from '../pages/ResultsLandingPage'

const DS_ROLES = ['ROLE_DS', 'ROLE_BISHOP', 'ROLE_SENIOR_STAFF', 'ROLE_POLLING_OFFICER']
const CONFIG_ROLES = ['ROLE_ADMIN', ...DS_ROLES] // Admin has full CRUD, DS roles have read-only

const AppRoutes = () => (
  <Routes>
    {/* System user login */}
    <Route path="/login" element={<LoginPage />} />

    {/* ===== VOTER VOTING FLOW (UI-F) ===== */}
    {/* Voter code login */}
    <Route path="/vote/login" element={<VoteLoginPage />} />
    
    {/* Voter ballot - requires authentication */}
    <Route
      path="/vote/ballot"
      element={
        <VoterGuard>
          <VoteBallotPage />
        </VoterGuard>
      }
    />
    
    {/* Voter review - requires authentication */}
    <Route
      path="/vote/review"
      element={
        <VoterGuard>
          <VoteReviewPage />
        </VoterGuard>
      }
    />
    
    {/* Voter success */}
    <Route path="/vote/success" element={<VoteSuccessPage />} />
    
    {/* Voter error */}
    <Route path="/vote/error" element={<VoteErrorPage />} />

    {/* Admin area */}
    <Route
      path="/admin/*"
      element={
        <RequireRole roles={['ROLE_ADMIN']}>
          <AdminDashboard />
        </RequireRole>
      }
    />

    {/* Diocesan Secretary area */}
    <Route
      path="/ds/*"
      element={
        <RequireRole roles={DS_ROLES}>
          <DSMainPage />
        </RequireRole>
      }
    />

    {/* Voter ballot */}
    <Route
      path="/vote"
      element={
        <RequireVoter>
          <VoterBallotPage />
        </RequireVoter>
      }
    />

    {/* Configuration - Organizational Structure */}
    <Route
      path="/config/diocese"
      element={
        <RequireRole roles={CONFIG_ROLES}>
          <DiocesePage />
        </RequireRole>
      }
    />
    <Route
      path="/config/archdeaconry"
      element={
        <RequireRole roles={CONFIG_ROLES}>
          <ArchdeaconryPage />
        </RequireRole>
      }
    />
    <Route
      path="/config/church"
      element={
        <RequireRole roles={CONFIG_ROLES}>
          <ChurchPage />
        </RequireRole>
      }
    />
    <Route
      path="/config/fellowship"
      element={
        <RequireRole roles={CONFIG_ROLES}>
          <FellowshipPage />
        </RequireRole>
      }
    />
    
    {/* Configuration - Master Data */}
    <Route
      path="/config/position-titles"
      element={
        <RequireRole roles={CONFIG_ROLES}>
          <PositionTitlePage />
        </RequireRole>
      }
    />
    <Route
      path="/config/positions"
      element={
        <RequireRole roles={CONFIG_ROLES}>
          <PositionPage />
        </RequireRole>
      }
    />

    {/* UI-C: People Registry */}
    <Route
      path="/admin/people"
      element={
        <RequireRole roles={['ROLE_ADMIN']}>
          <PeopleRegistryPage />
        </RequireRole>
      }
    />
    <Route
      path="/ds/people"
      element={
        <RequireRole roles={DS_ROLES}>
          <PeopleRegistryPage />
        </RequireRole>
      }
    />

    {/* UI-C: Leadership Assignments */}
    <Route
      path="/admin/leadership/assignments"
      element={
        <RequireRole roles={['ROLE_ADMIN']}>
          <LeadershipAssignmentsPage />
        </RequireRole>
      }
    />
    {/* Elections - admin */}
    <Route
      path="/admin/elections"
      element={
        <RequireRole roles={['ROLE_ADMIN']}>
          <ElectionsPage />
        </RequireRole>
      }
    />
    <Route
      path="/admin/results"
      element={
        <RequireRole roles={['ROLE_ADMIN']}>
          <ResultsLandingPage />
        </RequireRole>
      }
    />
    <Route
      path="/admin/elections/:electionId"
      element={<RequireRole roles={['ROLE_ADMIN']}><ElectionDetailPage /></RequireRole>}
    />
    <Route
      path="/admin/elections/:electionId/results"
      element={<RequireRole roles={['ROLE_ADMIN']}><ElectionResultsPage /></RequireRole>}
    />
    <Route
      path="/admin/elections/eligibility-codes"
      element={
        <RequireRole roles={['ROLE_ADMIN']}>
          <EligibilityCodesPage />
        </RequireRole>
      }
    />
    <Route
      path="/admin/users"
      element={
        <RequireRole roles={['ROLE_ADMIN']}>
          <UserManagementPage />
        </RequireRole>
      }
    />
    <Route
      path="/ds/leadership/assignments"
      element={
        <RequireRole roles={DS_ROLES}>
          <LeadershipAssignmentsPage />
        </RequireRole>
      }
    />
    <Route
      path="/ds/users"
      element={
        <RequireRole roles={DS_ROLES}>
          <UserManagementPage />
        </RequireRole>
      }
    />
    {/* Elections - DS (read-only) */}
    <Route
      path="/ds/elections"
      element={
        <RequireRole roles={DS_ROLES}>
          <ElectionsPage />
        </RequireRole>
      }
    />
    <Route
      path="/ds/results"
      element={
        <RequireRole roles={DS_ROLES}>
          <ResultsLandingPage />
        </RequireRole>
      }
    />
    <Route
      path="/ds/elections/:electionId"
      element={<RequireRole roles={DS_ROLES}><ElectionDetailPage /></RequireRole>}
    />
    <Route
      path="/ds/elections/:electionId/results"
      element={<RequireRole roles={DS_ROLES}><ElectionResultsPage /></RequireRole>}
    />
    <Route
      path="/ds/elections/eligibility-codes"
      element={
        <RequireRole roles={DS_ROLES}>
          <EligibilityCodesPage />
        </RequireRole>
      }
    />

    {/* Unauthorized */}
    <Route path="/unauthorized" element={<UnauthorizedPage />} />

    {/* Default route */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
)

export default AppRoutes
