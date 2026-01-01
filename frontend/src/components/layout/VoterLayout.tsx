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
        background: 'linear-gradient(135deg, #F5F3FF 0%, #FFF9F5 50%, #F0F7FF 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(143, 52, 147, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(14, 97, 173, 0.03) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        },
      }}
    >
      {/* Header */}
      {showHeader && (
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.secondary.main} 100%)`,
            borderBottom: '3px solid rgba(215, 177, 97, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
            },
          }}
        >
          <Toolbar sx={{ flexDirection: 'column', alignItems: 'center', gap: 0.5, py: { xs: 2, sm: 2.5 }, position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                letterSpacing: '0.5px',
              }}
            >
              Mukono Diocese Voting
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.95,
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                fontWeight: 500,
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
          p: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1,
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
