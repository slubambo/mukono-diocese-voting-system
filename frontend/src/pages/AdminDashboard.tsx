import { Paper, Typography, Button, Box } from '@mui/material'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'

const AdminDashboard = () => {
  return (
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
}

export default AdminDashboard
