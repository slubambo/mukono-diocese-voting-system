import { Paper, Typography, Button, Box } from '@mui/material'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'

const DSMainPage = () => {
  return (
    <AppShell hideOnVoter={false}>
      <PageLayout
        title="Diocesan Secretary Panel"
        subtitle="Election setup and management"
        actions={<Button variant="contained" color="primary">
          Generate Voter Codes
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
              Elections
            </Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>
              5
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography color="textSecondary" gutterBottom variant="caption">
              Positions
            </Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>
              24
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography color="textSecondary" gutterBottom variant="caption">
              Candidates
            </Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>
              89
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography color="textSecondary" gutterBottom variant="caption">
              Codes Generated
            </Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>
              524
            </Typography>
          </Paper>
        </Box>

        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            DS Responsibilities
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            This area allows you to configure elections, positions, candidates, and generate voter codes.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • Create and manage elections
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • Define positions and add candidates
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • Generate and distribute voter codes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • Monitor voting progress
          </Typography>
        </Paper>
      </PageLayout>
    </AppShell>
  )
}

export default DSMainPage
