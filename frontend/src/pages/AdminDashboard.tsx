import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import OverviewDashboard from '../components/dashboard/OverviewDashboard'

const AdminDashboard = () => {
  const navigate = useNavigate()

  return (
    <AppShell hideOnVoter={false}>
      <PageLayout
        title="Dashboard"
        subtitle="System overview and administration"
        actions={(
          <Button variant="contained" color="primary" onClick={() => navigate('/admin/elections')}>
            Create Election
          </Button>
        )}
      >
        <OverviewDashboard />
      </PageLayout>
    </AppShell>
  )
}

export default AdminDashboard
