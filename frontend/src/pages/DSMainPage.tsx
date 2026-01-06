import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import PageLayout from '../components/layout/PageLayout'
import OverviewDashboard from '../components/dashboard/OverviewDashboard'

const DSMainPage = () => {
  const navigate = useNavigate()

  return (
    <AppShell hideOnVoter={false}>
      <PageLayout
        title="Diocesan Secretary Panel"
        subtitle="Election setup and management"
        actions={(
          <Button variant="contained" color="primary" onClick={() => navigate('/ds/elections/eligibility-codes')}>
            Generate Voter Codes
          </Button>
        )}
      >
        <OverviewDashboard />
      </PageLayout>
    </AppShell>
  )
}

export default DSMainPage
