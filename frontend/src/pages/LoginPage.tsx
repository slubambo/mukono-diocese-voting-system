import { Button, Container, TextField, Typography, Box } from '@mui/material'

const LoginPage = () => {
  return (
    <Container maxWidth="sm">
      <Box mt={8}>
        <Typography variant="h5" gutterBottom>
          System User Login
        </Typography>
        <TextField fullWidth label="Username" margin="normal" />
        <TextField fullWidth label="Password" type="password" margin="normal" />
        <Box mt={2}>
          <Button fullWidth variant="contained" color="primary">
            Login
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default LoginPage
