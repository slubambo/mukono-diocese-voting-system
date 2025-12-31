import React from 'react'
import { Box, Container, Typography, useTheme, AppBar, Toolbar } from '@mui/material'

interface VoterLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
}

/**
 * Clean, focused layout for voter voting flow
 * - No sidebar or admin menus
 * - Centered card on desktop, full-width on mobile
 * - Simple header and footer
 */
const VoterLayout: React.FC<VoterLayoutProps> = ({ children, showHeader = true }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Header */}
      {showHeader && (
        <AppBar
          position="static"
          elevation={1}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          <Toolbar sx={{ flexDirection: 'column', alignItems: 'center', gap: 0.5, py: { xs: 1.5, sm: 2 } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              Mukono Diocese Voting
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.9,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
              }}
            >
              Secure Voting Platform
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 1.5, sm: 3, md: 4 },
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            px: { xs: 1, sm: 2 },
          }}
        >
          {children}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 2,
          px: 2,
          textAlign: 'center',
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            display: 'block',
            lineHeight: 1.4,
          }}
        >
          Powered by Mukono Diocese Voting System
        </Typography>
      </Box>
    </Box>
  )
}

export default VoterLayout
