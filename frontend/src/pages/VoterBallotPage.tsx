import { Container, Typography, Box } from '@mui/material'

const VoterBallotPage = () => {
  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Ballot
        </Typography>
        <Typography>
          Here the voter will see fellowships and positions they can vote for during this election period.
        </Typography>
      </Box>
    </Container>
  )
}

export default VoterBallotPage
