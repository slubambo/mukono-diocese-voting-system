import React, { useState } from 'react'
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
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { useAuth } from '../../context/AuthContext'
import { LOGOUT_MENU_ITEM, getMenuItemsByRole, type MenuItem } from '../../routes/menu'

interface SidebarProps {
  open: boolean
  onClose: () => void
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, onNavigate, collapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Track expanded menu items
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Get menu items based on user roles
  const visibleMenuItems = user?.roles ? getMenuItemsByRole(user.roles) : []

  // Auto-expand parent menu when child is active
  React.useEffect(() => {
    const newExpanded: Record<string, boolean> = {}
    visibleMenuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => location.pathname.startsWith(child.path))
        if (hasActiveChild) {
          newExpanded[item.id] = true
        }
      }
    })
    setExpandedItems(prev => ({ ...prev, ...newExpanded }))
  }, [location.pathname, visibleMenuItems])

  const handleMenuItemClick = (path: string, id?: string, hasChildren?: boolean) => {
    if (hasChildren) {
      // Toggle expand/collapse for items with children
      setExpandedItems(prev => ({
        ...prev,
        [id!]: !prev[id!],
      }))
      return
    }

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
  
  const isParentActive = (item: MenuItem) => {
    if (!item.children) return false
    return item.children.some(child => isActive(child.path))
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = item.icon
    const active = isActive(item.path)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems[item.id] || false
    const parentActive = isParentActive(item)

    return (
      <React.Fragment key={item.id}>
        <Tooltip
          title={collapsed && !hasChildren ? item.label : ''}
          placement="right"
        >
          <ListItemButton
            onClick={() => handleMenuItemClick(item.path, item.id, hasChildren)}
            selected={active || parentActive}
            sx={{
              mx: collapsed ? 0.5 : 1,
              mb: 0.5,
              pl: collapsed ? 1 : level > 0 ? 4 : 2,
              borderRadius: 1,
              justifyContent: collapsed ? 'center' : 'flex-start',
              bgcolor: active || parentActive ? 'rgba(143, 52, 147, 0.12)' : 'transparent',
              color: active || parentActive ? 'primary.main' : 'text.primary',
              fontWeight: active || parentActive ? 600 : 500,
              '&:hover': {
                bgcolor: 'rgba(143, 52, 147, 0.08)',
              },
              '&.Mui-selected': {
                bgcolor: 'rgba(143, 52, 147, 0.12)',
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                paddingLeft: collapsed ? 'calc(16px - 4px)' : level > 0 ? 'calc(32px - 4px)' : 'calc(16px - 4px)',
                '&:hover': {
                  bgcolor: 'rgba(143, 52, 147, 0.16)',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: active || parentActive ? 'primary.main' : 'inherit',
                minWidth: collapsed ? 'auto' : 40,
                justifyContent: 'center',
              }}
            >
              <Icon />
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: active || parentActive ? 600 : 500,
                  }}
                />
                {hasChildren && (
                  isExpanded ? <ExpandLess /> : <ExpandMore />
                )}
              </>
            )}
          </ListItemButton>
        </Tooltip>
        
        {/* Render children if they exist */}
        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with branding and avatar */}
      <Box sx={{ p: collapsed ? 1 : 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: collapsed ? 0 : 2 }}>
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
          {!collapsed && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Mukono Diocese
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Voting System
              </Typography>
            </Box>
          )}
        </Box>

        {/* User role info */}
        {!collapsed && user?.roles && user.roles.length > 0 && (
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
        {visibleMenuItems.map(item => renderMenuItem(item))}
      </List>

      {/* Divider + Logout */}
      <Divider sx={{ my: 1 }} />
      <List>
        <Tooltip
          title={collapsed ? LOGOUT_MENU_ITEM.label : ''}
          placement="right"
        >
          <ListItemButton
            onClick={() => handleMenuItemClick(LOGOUT_MENU_ITEM.path, LOGOUT_MENU_ITEM.id)}
            sx={{
              mx: collapsed ? 0.5 : 1,
              borderRadius: 1,
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'error.main',
              '&:hover': {
                bgcolor: 'rgba(229, 57, 53, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'error.main', minWidth: collapsed ? 'auto' : 40, justifyContent: 'center' }}>
              <LOGOUT_MENU_ITEM.icon />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={LOGOUT_MENU_ITEM.label}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </List>

      {/* Collapse toggle button - desktop only */}
      {!isMobile && onToggleCollapse && (
        <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
            <IconButton
              onClick={onToggleCollapse}
              sx={{
                width: '100%',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size="small"
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  )

  return (
    <>
      {/* Desktop: Permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: collapsed ? 80 : 280,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            width: collapsed ? 80 : 280,
            boxSizing: 'border-box',
            top: 'auto',
            borderRight: `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
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
