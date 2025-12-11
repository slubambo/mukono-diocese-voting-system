import { Container, Typography, Box } from '@mui/material'

const DSMainPage = () => {
  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Diocesan Secretary Panel
        </Typography>
        <Typography>
          This area will allow DS to configure elections, positions, candidates, and generate codes.
        </Typography>
      </Box>
    </Container>
  )
}

export default DSMainPage
