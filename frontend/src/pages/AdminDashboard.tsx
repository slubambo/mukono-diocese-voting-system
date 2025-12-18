import { Routes, Route, Navigate } from 'react-router-dom'
import { Paper, Typography, Button, Box } from '@mui/material'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'

// Configuration pages
import DiocesePage from './config/DiocesePage'
import ArchdeaconryPage from './config/ArchdeaconryPage'
import ChurchPage from './config/ChurchPage'
import FellowshipPage from './config/FellowshipPage'
import PositionTitlePage from './config/PositionTitlePage'
import PositionPage from './config/PositionPage'

// Dashboard content component
const DashboardContent = () => (
  <AppShell hideOnVoter={false}>
    <PageLayout
      title="Dashboard"
      subtitle="System overview and administration"
      actions={<Button variant="contained" color="primary">
        Create Election
      </Button>}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography color="textSecondary" gutterBottom variant="caption">
            Total Elections
          </Typography>
          <Typography variant="h5" sx={{ mt: 1 }}>
            12
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography color="textSecondary" gutterBottom variant="caption">
            Active Voters
          </Typography>
          <Typography variant="h5" sx={{ mt: 1 }}>
            524
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography color="textSecondary" gutterBottom variant="caption">
            Votes Cast
          </Typography>
          <Typography variant="h5" sx={{ mt: 1 }}>
            389
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography color="textSecondary" gutterBottom variant="caption">
            System Health
          </Typography>
          <Typography variant="h5" sx={{ mt: 1 }}>
            98%
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Getting Started
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          This area will show system overview, elections, users, and administrative controls.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Manage elections and voting periods
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Configure positions and candidates
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Monitor voting progress and results
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • View audit logs and generate reports
        </Typography>
      </Paper>
    </PageLayout>
  </AppShell>
)

// Wrapper for configuration pages with AppShell
const ConfigPageWrapper: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <AppShell hideOnVoter={false}>
    <PageLayout title={title} subtitle="Manage configuration data">
      {children}
    </PageLayout>
  </AppShell>
)

const AdminDashboard = () => {
  return (
    <Routes>
      {/* Dashboard */}
      <Route path="/" element={<DashboardContent />} />

      {/* Configuration - Organisational Structures */}
      <Route
        path="/config/org/dioceses"
        element={
          <ConfigPageWrapper title="Diocese Management">
            <DiocesePage />
          </ConfigPageWrapper>
        }
      />
      <Route
        path="/config/org/archdeaconries"
        element={
          <ConfigPageWrapper title="Archdeaconry Management">
            <ArchdeaconryPage />
          </ConfigPageWrapper>
        }
      />
      <Route
        path="/config/org/churches"
        element={
          <ConfigPageWrapper title="Church Management">
            <ChurchPage />
          </ConfigPageWrapper>
        }
      />
      <Route
        path="/config/org/fellowships"
        element={
          <ConfigPageWrapper title="Fellowship Management">
            <FellowshipPage />
          </ConfigPageWrapper>
        }
      />

      {/* Configuration - Master Data */}
      <Route
        path="/config/master/position-titles"
        element={
          <ConfigPageWrapper title="Position Titles">
            <PositionTitlePage />
          </ConfigPageWrapper>
        }
      />
      <Route
        path="/config/master/positions"
        element={
          <ConfigPageWrapper title="Fellowship Positions">
            <PositionPage />
          </ConfigPageWrapper>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default AdminDashboard
