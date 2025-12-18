import { Component } from 'react'
import { Box, Paper, Typography, Button, Container } from '@mui/material'
import type { ErrorInfo, ReactNode } from 'react'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents entire app from crashing and provides user-friendly error UI
 */
class ErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
          }}
        >
          <Container maxWidth="sm">
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2,
              }}
            >
              <ErrorOutlineIcon
                sx={{
                  fontSize: 60,
                  color: 'error.main',
                  mb: 2,
                }}
              />

              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Oops! Something went wrong
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                We're sorry for the inconvenience. An unexpected error occurred in the application.
              </Typography>

              {import.meta.env.DEV && this.state.error && (
                <Box
                  sx={{
                    bgcolor: 'error.lighter',
                    p: 2,
                    borderRadius: 1,
                    mb: 3,
                    textAlign: 'left',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    component="pre"
                    variant="caption"
                    sx={{
                      color: 'error.dark',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button variant="contained" color="primary" onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => window.location.href = '/'}
                >
                  Go Home
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
