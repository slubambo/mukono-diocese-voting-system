import { Box, Button, Container, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const UnauthorizedPage = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 10,
          p: 4,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Unauthorized
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You do not have permission to access this area. Please log in with the correct account.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Box>
    </Container>
  )
}

export default UnauthorizedPage
