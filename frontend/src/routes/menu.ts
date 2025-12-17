import DashboardIcon from '@mui/icons-material/Dashboard'
import GroupIcon from '@mui/icons-material/Group'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PollIcon from '@mui/icons-material/Poll'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'

export type MenuItem = {
  id: string
  label: string
  path: string
  icon: any
  roles: string[]
  children?: MenuItem[]
}

/**
 * Menu structure for the application
 * Each menu item specifies which roles can access it
 */
export const MENU_ITEMS: MenuItem[] = [
  // Dashboard (ADMIN + DS)
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin',
    icon: DashboardIcon,
    roles: ['ROLE_ADMIN', 'ROLE_DS'],
  },
  // Voter Management (ADMIN only)
  {
    id: 'voters',
    label: 'Voters',
    path: '/admin/voters',
    icon: GroupIcon,
    roles: ['ROLE_ADMIN'],
  },
  // Ballot Management (ADMIN + DS)
  {
    id: 'ballots',
    label: 'Ballots',
    path: '/admin/ballots',
    icon: PollIcon,
    roles: ['ROLE_ADMIN', 'ROLE_DS'],
  },
  // Results (ADMIN + DS - view only after voting)
  {
    id: 'results',
    label: 'Results',
    path: '/admin/results',
    icon: CheckCircleIcon,
    roles: ['ROLE_ADMIN', 'ROLE_DS'],
  },
  // Admin Settings (ADMIN only)
  {
    id: 'settings',
    label: 'Settings',
    path: '/admin/settings',
    icon: SettingsIcon,
    roles: ['ROLE_ADMIN'],
  },
]

/**
 * Filter menu items by role(s)
 * @param roles User roles to check
 * @returns Menu items accessible to the user
 */
export const getMenuItemsByRole = (roles: string[]): MenuItem[] => {
  return MENU_ITEMS.filter(item => {
    return item.roles.some(role => roles.includes(role))
  })
}

/**
 * Logout menu item (always visible)
 */
export const LOGOUT_MENU_ITEM: MenuItem = {
  id: 'logout',
  label: 'Logout',
  path: '/logout',
  icon: LogoutIcon,
  roles: ['ROLE_ADMIN', 'ROLE_DS', 'ROLE_VOTER'],
}
