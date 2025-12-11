import { Container, Typography, Box } from '@mui/material'

const AdminDashboard = () => {
  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography>
          This area will show system overview, elections, users, etc.
        </Typography>
      </Box>
    </Container>
  )
}

export default AdminDashboard
