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
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../../context/AuthContext'

interface TopbarProps {
  onMenuOpen: () => void
  showMenuButton?: boolean
  title?: string
}

const Topbar: React.FC<TopbarProps> = ({ onMenuOpen, showMenuButton = true, title }) => {
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
      <AppBar position="static" sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '64px' }}>
          {/* Left: Menu icon + Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showMenuButton && isMobile && (
              <IconButton
                color="inherit"
                aria-label="open menu"
                onClick={onMenuOpen}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Mukono Diocese
              </Typography>
              {title && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {title}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right: User info + Actions */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
              )}

              {/* Username */}
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {user.username}
              </Typography>

              {/* Logout button */}
              <IconButton
                color="inherit"
                aria-label="logout menu"
                onClick={handleMenuOpen}
                sx={{
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>

              {/* Dropdown Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {user.username}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
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
