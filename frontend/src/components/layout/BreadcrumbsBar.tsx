import React from 'react'
import { Breadcrumbs, Typography, Box, Link as MuiLink } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { useLocation, useNavigate } from 'react-router-dom'

interface BreadcrumbsBarProps {
  hideOn?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Simple breadcrumb navigation based on current route
 * Maps paths like /admin/voters to ["Admin", "Voters"]
 */
const BreadcrumbsBar: React.FC<BreadcrumbsBarProps> = ({ hideOn = 'xs' }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const getPathSegments = () => {
    const path = location.pathname
    const segments = path
      .split('/')
      .filter(Boolean)
      .map((segment, index, arr) => ({
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: '/' + arr.slice(0, index + 1).join('/'),
      }))

    return segments
  }

  const segments = getPathSegments()

  if (segments.length <= 1) {
    return null
  }

  const displayProps: Record<string, object> = {
    xs: { display: 'none' },
    sm: { display: 'none' },
    md: { display: 'block' },
    lg: { display: 'block' },
    xl: { display: 'block' },
  }

  return (
    <Box sx={{ ...displayProps[hideOn], py: 1.5, px: 2 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
        aria-label="breadcrumb"
      >
        <MuiLink
          component="button"
          variant="body2"
          onClick={() => navigate('/')}
          sx={{
            color: 'primary.main',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Home
        </MuiLink>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1

          return isLast ? (
            <Typography
              key={segment.path}
              variant="body2"
              sx={{ color: 'text.primary', fontWeight: 600 }}
            >
              {segment.name}
            </Typography>
          ) : (
            <MuiLink
              key={segment.path}
              component="button"
              variant="body2"
              onClick={() => navigate(segment.path)}
              sx={{
                color: 'primary.main',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {segment.name}
            </MuiLink>
          )
        })}
      </Breadcrumbs>
    </Box>
  )
}

export default BreadcrumbsBar
