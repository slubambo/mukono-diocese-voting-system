import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useAuth } from '../../context/AuthContext'
import logoSrc from '../../assets/COU-Logo-Boundary_Favicon.png'

interface TopbarProps {
  onMenuOpen: () => void
  showMenuButton?: boolean
  title?: string
  onToggleSidebarCollapse?: () => void
  sidebarCollapsed?: boolean
}

const Topbar: React.FC<TopbarProps> = ({ onMenuOpen, showMenuButton = true, title, onToggleSidebarCollapse, sidebarCollapsed }) => {
  const { user, logout } = useAuth()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    logout()
  }

  const getRoleColor = (role: string): 'primary' | 'secondary' | 'default' => {
    if (role === 'ROLE_ADMIN') return 'primary'
    if (role === 'ROLE_DS') return 'secondary'
    return 'default'
  }

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      ROLE_ADMIN: 'Administrator',
      ROLE_DS: 'Diocesan Secretary',
      ROLE_VOTER: 'Voter',
    }
    return roleMap[role] || role
  }

  return (
    <>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper', 
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            minHeight: { xs: '56px', sm: '60px' },
            px: { xs: 2, sm: 2.5 },
          }}
        >
          {/* Left: Menu icon + Logo + Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            {showMenuButton && isMobile && (
              <IconButton
                color="inherit"
                aria-label="open menu"
                onClick={onMenuOpen}
                size="small"
                sx={{ 
                  mr: 0.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1.25,
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            )}

            {/* Logo */}
            <Box
              component="img"
              src={logoSrc}
              alt="Church of Uganda Logo"
              sx={{
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                display: { xs: 'none', sm: 'block' },
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            />

            {/* Title section */}
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  background: 'linear-gradient(135deg, #8F3493 0%, #0E61AD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                Mukono Diocese
              </Typography>
              {title && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary', 
                    display: 'block',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </Typography>
              )}
            </Box>

            {/* Sidebar collapse button - desktop only */}
            {!isMobile && onToggleSidebarCollapse && (
              <Tooltip title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="bottom">
                <IconButton
                  size="small"
                  onClick={onToggleSidebarCollapse}
                  sx={{
                    color: 'text.secondary',
                    ml: 0.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1.25,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      color: 'primary.main',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Right: User info + Actions */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              {/* Role badge - only show if user has roles */}
              {user.roles && user.roles.length > 0 && (
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5 }}>
                  {user.roles.map(role => (
                    <Chip
                      key={role}
                      label={getRoleLabel(role)}
                      size="small"
                      color={getRoleColor(role)}
                      variant="outlined"
                      sx={{ 
                        fontWeight: 600,
                        borderWidth: 1.5,
                        borderRadius: 1.25,
                        px: 0.25,
                        height: 26,
                        fontSize: '0.75rem',
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Username */}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '0.85rem',
                }}
              >
                {user.username}
              </Typography>

              {/* Logout button */}
              <Tooltip title="Logout" placement="bottom">
                <IconButton
                  color="inherit"
                  aria-label="logout menu"
                  onClick={handleMenuOpen}
                  size="small"
                  sx={{
                    p: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 1.25,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'error.main',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Dropdown Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                  paper: {
                    elevation: 8,
                    sx: {
                      borderRadius: 1.5,
                      mt: 1,
                      minWidth: 180,
                    },
                  },
                }}
              >
                <MenuItem disabled sx={{ opacity: 1, cursor: 'default', py: 1 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>
                      {user.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      {getRoleLabel(user.roles[0])}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout} 
                  sx={{ 
                    color: 'error.main',
                    mt: 0.5,
                    borderRadius: 1,
                    mx: 0.75,
                    py: 1,
                    fontSize: '0.85rem',
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'error.dark',
                    },
                  }}
                >
                  <LogoutIcon sx={{ mr: 1.25, fontSize: 18 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </>
  )
}

export default Topbar
