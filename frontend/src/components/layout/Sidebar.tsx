import React, { useState, useMemo, useCallback } from 'react'
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
import { SYSTEM_NAME } from '../../config/constants'

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
  
  // Get menu items based on user roles - memoize to prevent re-renders
  const visibleMenuItems = useMemo(
    () => (user?.roles ? getMenuItemsByRole(user.roles) : []),
    [user?.roles]
  )

  // Initialize expanded items based on current path
  const getInitialExpandedState = () => {
    const expanded: Record<string, boolean> = {}
    const menuItems = user?.roles ? getMenuItemsByRole(user.roles) : []
    
    menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => location.pathname.startsWith(child.path))
        if (hasActiveChild) {
          expanded[item.id] = true
        }
      }
    })
    return expanded
  }

  // Track expanded menu items
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(getInitialExpandedState)

  // Auto-expand parent menu when path changes
  React.useEffect(() => {
    const newExpanded: Record<string, boolean> = {}
    
    visibleMenuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => location.pathname.startsWith(child.path))
        if (hasActiveChild && !expandedItems[item.id]) {
          newExpanded[item.id] = true
        }
      }
    })
    
    // Only update if there are new items to expand
    if (Object.keys(newExpanded).length > 0) {
      setExpandedItems(prev => ({ ...prev, ...newExpanded }))
    }
  }, [location.pathname, visibleMenuItems])

  const handleMenuItemClick = useCallback((path: string, id?: string, hasChildren?: boolean) => {
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
  }, [navigate, isMobile, onClose, onNavigate, logout])

  const isExactActive = useCallback((path: string) => {
    return location.pathname === path
  }, [location.pathname])

  const isSectionActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }, [location.pathname])
  
  const isParentActive = useCallback((item: MenuItem) => {
    if (!item.children) return false
    return item.children.some(child => isSectionActive(child.path))
  }, [isSectionActive])

  const isChildActive = useCallback((path: string) => {
    if (isExactActive(path)) return true
    if (path === '/admin/elections' || path === '/ds/elections') {
      return isSectionActive(path) && !location.pathname.startsWith(`${path}/eligibility-codes`)
    }
    return false
  }, [isExactActive, isSectionActive, location.pathname])

  const renderMenuItem = useCallback((item: MenuItem, level: number = 0) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems[item.id] || false
    const parentActive = isParentActive(item)
    const isChildItem = level > 0
    const active = isChildItem ? isChildActive(item.path) : isSectionActive(item.path)

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
              mx: 0,
              mb: 0.5,
              pl: collapsed ? 1.5 : level > 0 ? 3.5 : 1.75,
              py: 1,
              borderRadius: 1.25,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              // Modern active styling
              bgcolor: (active || parentActive)
                ? 'linear-gradient(90deg, rgba(143, 52, 147, 0.08) 0%, rgba(143, 52, 147, 0.04) 100%)'
                : 'transparent',
              color: (active || parentActive) ? 'primary.main' : 'text.primary',
              fontWeight: (active || parentActive) ? 600 : 500,
              // Modern left indicator for active items
              '&::before': (active || parentActive) ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '20%',
                bottom: '20%',
                width: 3,
                bgcolor: 'primary.main',
                borderRadius: '0 4px 4px 0',
                boxShadow: '2px 0 6px rgba(143, 52, 147, 0.3)',
              } : {},
              // Subtle right border for active parent items
              borderRight: (active || parentActive) && !isChildItem ? '2px solid' : 'none',
              borderRightColor: 'rgba(143, 52, 147, 0.15)',
              '&:hover': {
                bgcolor: (active || parentActive)
                  ? 'linear-gradient(90deg, rgba(143, 52, 147, 0.12) 0%, rgba(143, 52, 147, 0.06) 100%)'
                  : 'rgba(143, 52, 147, 0.04)',
                transform: 'translateX(3px)',
              },
              '&.Mui-selected': {
                bgcolor: 'linear-gradient(90deg, rgba(143, 52, 147, 0.08) 0%, rgba(143, 52, 147, 0.04) 100%)',
                '&:hover': {
                  bgcolor: 'linear-gradient(90deg, rgba(143, 52, 147, 0.12) 0%, rgba(143, 52, 147, 0.06) 100%)',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: active || parentActive ? 'primary.main' : 'inherit',
                minWidth: collapsed ? 'auto' : 36,
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: active || parentActive ? 600 : 500,
                    fontSize: '0.85rem',
                  }}
                />
                {hasChildren && (
                  <Box
                    sx={{
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </Box>
                )}
              </>
            )}
          </ListItemButton>
        </Tooltip>
        
        {/* Render children if they exist */}
        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout={300} unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }, [collapsed, expandedItems, isExactActive, isSectionActive, isParentActive, handleMenuItemClick, theme.palette.primary.main])

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Header with branding and avatar */}
      <Box 
        sx={{ 
          p: collapsed ? 1.5 : 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: collapsed ? 0 : 1.5, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 700,
              fontSize: collapsed ? '1rem' : '1.15rem',
              width: collapsed ? 36 : 42,
              height: collapsed ? 36 : 42,
              boxShadow: '0 3px 10px rgba(143, 52, 147, 0.25)',
              transition: 'all 0.3s ease',
            }}
          >
            M
          </Avatar>
          {!collapsed && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2, fontSize: '0.95rem' }}>
                {SYSTEM_NAME}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem' }}>
                Voting System
              </Typography>
            </Box>
          )}
        </Box>

        {/* User role info */}
        {!collapsed && user?.roles && user.roles.length > 0 && (
          <Box 
            sx={{ 
              bgcolor: 'primary.main',
              background: 'linear-gradient(135deg, #8F3493 0%, #6B2670 100%)',
              color: 'white',
              p: 1.5,
              borderRadius: 1.25,
              boxShadow: '0 2px 8px rgba(143, 52, 147, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                Role
              </Typography>
              <Box 
                sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.3)',
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.3px' }}>
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
      <List sx={{ flex: 1, minHeight: 0, pt: 1, px: 0.75, overflowY: 'auto' }}>
        {visibleMenuItems.map(item => renderMenuItem(item))}
      </List>

      {/* Divider + Logout */}
      <Divider sx={{ my: 0.75 }} />
      <Box sx={{ px: 0.75, pb: 1 }}>
        <Tooltip
          title={collapsed ? LOGOUT_MENU_ITEM.label : ''}
          placement="right"
        >
          <ListItemButton
            onClick={() => handleMenuItemClick(LOGOUT_MENU_ITEM.path, LOGOUT_MENU_ITEM.id)}
            sx={{
              mx: 0,
              py: 1.1,
              borderRadius: 1.25,
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'error.main',
              bgcolor: 'rgba(229, 57, 53, 0.06)',
              border: '1px solid rgba(229, 57, 53, 0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(229, 57, 53, 0.12)',
                borderColor: 'rgba(229, 57, 53, 0.4)',
                transform: 'translateX(3px)',
                boxShadow: '0 2px 6px rgba(229, 57, 53, 0.2)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'error.main', minWidth: collapsed ? 'auto' : 36, justifyContent: 'center' }}>
              <LOGOUT_MENU_ITEM.icon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={LOGOUT_MENU_ITEM.label}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontSize: '0.85rem' }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>

      {/* Collapse toggle button - desktop only */}
      {!isMobile && onToggleCollapse && (
        <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
            <IconButton
              onClick={onToggleCollapse}
              sx={{
                width: '100%',
                color: 'text.secondary',
                borderRadius: 1.25,
                bgcolor: 'action.hover',
                py: 0.75,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.selected',
                  color: 'primary.main',
                },
              }}
              size="small"
            >
              {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
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
          width: collapsed ? 68 : 260,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }),
          '& .MuiDrawer-paper': {
            width: collapsed ? 68 : 260,
            boxSizing: 'border-box',
            top: 'auto',
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.02)',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shorter,
            }),
            overflowX: 'hidden',
            bgcolor: 'background.paper',
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
            width: 260,
            boxSizing: 'border-box',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}

export default React.memo(Sidebar)
