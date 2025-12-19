import React, { useState } from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import BreadcrumbsBar from './BreadcrumbsBar'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  hideOnVoter?: boolean
}

/**
 * Main application shell for system users (Admin, DS)
 * Combines Topbar, Sidebar, and BreadcrumbsBar
 * Automatically hides for VOTER role
 */
const AppShell: React.FC<AppShellProps> = ({ children, title, hideOnVoter = true }) => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Don't show shell for voters
  const isVoter = user?.roles.includes('ROLE_VOTER')
  if (isVoter && hideOnVoter) {
    return <Box sx={{ width: '100%', minHeight: '100vh' }}>{children}</Box>
  }

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100vh', flexDirection: 'column' }}>
      {/* Topbar */}
      <Topbar
        onMenuOpen={() => setSidebarOpen(true)}
        showMenuButton={isMobile}
        title={title}
        onToggleSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main content area */}
      <Box sx={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Content wrapper */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            backgroundColor: 'background.default',
          }}
        >
          {/* Breadcrumbs */}
          <BreadcrumbsBar hideOn="xs" />

          {/* Main content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              width: '100%',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default AppShell
