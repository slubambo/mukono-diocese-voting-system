import { Button, Container, TextField, Typography, Box } from '@mui/material'

const VoteLoginPage = () => {
  return (
    <Container maxWidth="sm">
      <Box mt={8}>
        <Typography variant="h5" gutterBottom>
          Voter Login (Code)
        </Typography>
        <TextField fullWidth label="Voting Code" margin="normal" />
        <Box mt={2}>
          <Button fullWidth variant="contained" color="primary">
            Continue
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default VoteLoginPage
