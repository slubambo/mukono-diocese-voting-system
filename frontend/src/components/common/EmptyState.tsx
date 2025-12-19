import React from 'react'
import { Box, Typography, Button } from '@mui/material'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

/**
 * Empty state component for showing when no data is available
 * Used to prompt users to take action when there's nothing to display
 */
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Box
          sx={{
            mb: 2,
            color: 'action.disabled',
            fontSize: '3rem',
            display: 'flex',
          }}
        >
          {icon}
        </Box>
      )}

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 400 }}>
          {description}
        </Typography>
      )}

      {action && <Box>{action}</Box>}
    </Box>
  )
}

export default EmptyState
