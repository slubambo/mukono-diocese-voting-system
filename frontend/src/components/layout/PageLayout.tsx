import React from 'react'
import { Box, Typography, useTheme } from '@mui/material'

interface PageLayoutProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  maxWidth?: number
}

/**
 * Standard page layout component for system pages
 * Provides consistent title, optional actions, and content area
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  actions,
  children,
  maxWidth = 1400,
}) => {
  const theme = useTheme()

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          p: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ maxWidth, mx: 'auto' }}>
          {/* Title section */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: subtitle ? 0.5 : 0,
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>

            {/* Actions */}
            {actions && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  width: { xs: '100%', sm: 'auto' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  '& > button, & > a': {
                    width: { xs: '100%', sm: 'auto' },
                  },
                }}
              >
                {actions}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Page content */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 2, sm: 3 },
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ maxWidth, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  )
}

export default PageLayout
