import React from 'react'
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  Avatar,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LOGOUT_MENU_ITEM, getMenuItemsByRole } from '../../routes/menu'

interface SidebarProps {
  open: boolean
  onClose: () => void
  onNavigate?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, onNavigate }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Get menu items based on user roles
  const visibleMenuItems = user?.roles ? getMenuItemsByRole(user.roles) : []

  const handleMenuItemClick = (path: string, id?: string) => {
    if (id === 'logout') {
      logout()
      return
    }

    navigate(path)
    if (isMobile) {
      onClose()
    }
    if (onNavigate) {
      onNavigate()
    }
  }

  const isActive = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with branding */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            M
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Mukono Diocese
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Voting System
            </Typography>
          </Box>
        </Box>

        {/* User role info */}
        {user?.roles && user.roles.length > 0 && (
          <Box sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Role
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {user.roles[0] === 'ROLE_ADMIN'
                ? 'Administrator'
                : user.roles[0] === 'ROLE_DS'
                  ? 'Diocesan Secretary'
                  : 'Voter'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Menu items */}
      <List sx={{ flex: 1, pt: 1 }}>
        {visibleMenuItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <ListItemButton
              key={item.id}
              onClick={() => handleMenuItemClick(item.path, item.id)}
              selected={active}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1,
                bgcolor: active ? 'rgba(143, 52, 147, 0.12)' : 'transparent',
                color: active ? 'primary.main' : 'text.primary',
                fontWeight: active ? 600 : 500,
                '&:hover': {
                  bgcolor: 'rgba(143, 52, 147, 0.08)',
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(143, 52, 147, 0.12)',
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  paddingLeft: 'calc(16px - 4px)',
                  '&:hover': {
                    bgcolor: 'rgba(143, 52, 147, 0.16)',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: active ? 'primary.main' : 'inherit',
                  minWidth: 40,
                }}
              >
                <Icon />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: active ? 600 : 500,
                }}
              />
            </ListItemButton>
          )
        })}
      </List>

      {/* Divider + Logout */}
      <Divider sx={{ my: 1 }} />
      <List>
        <ListItemButton
          onClick={() => handleMenuItemClick(LOGOUT_MENU_ITEM.path, LOGOUT_MENU_ITEM.id)}
          sx={{
            mx: 1,
            borderRadius: 1,
            color: 'error.main',
            '&:hover': {
              bgcolor: 'rgba(229, 57, 53, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
            <LOGOUT_MENU_ITEM.icon />
          </ListItemIcon>
          <ListItemText
            primary={LOGOUT_MENU_ITEM.label}
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
          />
        </ListItemButton>
      </List>
    </Box>
  )

  return (
    <>
      {/* Desktop: Permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            top: 'auto',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Mobile: Temporary drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={onClose}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}

export default Sidebar
