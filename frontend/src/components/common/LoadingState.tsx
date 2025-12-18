import React from 'react'
import { Box, Skeleton, Paper } from '@mui/material'

interface LoadingStateProps {
  count?: number
  variant?: 'card' | 'row' | 'text'
  height?: number
}

/**
 * Loading state component showing skeleton loaders
 * Displays placeholder content while data is being fetched
 */
const LoadingState: React.FC<LoadingStateProps> = ({ count = 3, variant = 'card', height = 100 }) => {
  if (variant === 'text') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} variant="text" height={24} sx={{ mb: 1 }} />
        ))}
      </Box>
    )
  }

  if (variant === 'row') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: 2,
              mb: 2,
              width: '100%',
            }}
          >
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" height={20} width="60%" />
              <Skeleton variant="text" height={16} width="40%" />
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  // Card variant (default)
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
        gap: 2,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Paper key={i} sx={{ p: 2 }}>
          <Skeleton variant="rectangular" height={height} sx={{ mb: 2 }} />
          <Skeleton variant="text" height={20} width="80%" />
          <Skeleton variant="text" height={16} width="60%" />
        </Paper>
      ))}
    </Box>
  )
}

export default LoadingState
