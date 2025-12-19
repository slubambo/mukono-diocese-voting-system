import React from 'react'
import DashboardIcon from '@mui/icons-material/Dashboard'
import GroupIcon from '@mui/icons-material/Group'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PollIcon from '@mui/icons-material/Poll'
import LogoutIcon from '@mui/icons-material/Logout'
import PolicyIcon from '@mui/icons-material/Policy'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import SettingsIcon from '@mui/icons-material/Settings'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import BusinessIcon from '@mui/icons-material/Business'
import ChurchIcon from '@mui/icons-material/Church'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import GroupsIcon from '@mui/icons-material/Groups'
import BadgeIcon from '@mui/icons-material/Badge'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'

export type MenuItem = {
  id: string
  label: string
  path: string
  icon: React.ElementType
  roles: string[]
  children?: MenuItem[]
}

const DS_ROLES = ['ROLE_DS', 'ROLE_BISHOP', 'ROLE_SENIOR_STAFF', 'ROLE_POLLING_OFFICER']
const ADMIN_ROLES = ['ROLE_ADMIN']
const VOTER_ROLES = ['ROLE_VOTER']

/**
 * Menu structure for the application
 * Each menu item specifies which roles can access it
 */
export const MENU_ITEMS: MenuItem[] = [
  // ADMIN: Overview
  {
    id: 'overview',
    label: 'Overview',
    path: '/admin',
    icon: DashboardIcon,
    roles: ADMIN_ROLES,
  },
  // ADMIN & DS: Master Data (UI-B - Organizational Structure & Master Data)
  {
    id: 'master-data-config',
    label: 'Master Data',
    path: '/config',
    icon: SettingsIcon,
    roles: [...ADMIN_ROLES, ...DS_ROLES],
    children: [
      // Organizational Structure
      {
        id: 'config-org-diocese',
        label: 'Diocese',
        path: '/config/diocese',
        icon: AccountTreeIcon,
        roles: [...ADMIN_ROLES, ...DS_ROLES],
      },
      {
        id: 'config-org-archdeaconry',
        label: 'Archdeaconry',
        path: '/config/archdeaconry',
        icon: BusinessIcon,
        roles: [...ADMIN_ROLES, ...DS_ROLES],
      },
      {
        id: 'config-org-church',
        label: 'Church',
        path: '/config/church',
        icon: ChurchIcon,
        roles: [...ADMIN_ROLES, ...DS_ROLES],
      },
      {
        id: 'config-org-fellowship',
        label: 'Fellowship',
        path: '/config/fellowship',
        icon: GroupsIcon,
        roles: [...ADMIN_ROLES, ...DS_ROLES],
      },
      // Master Data
      {
        id: 'config-md-position-titles',
        label: 'Position Titles',
        path: '/config/position-titles',
        icon: BadgeIcon,
        roles: [...ADMIN_ROLES, ...DS_ROLES],
      },
      {
        id: 'config-md-positions',
        label: 'Positions',
        path: '/config/positions',
        icon: WorkOutlineIcon,
        roles: [...ADMIN_ROLES, ...DS_ROLES],
      },
    ],
  },
  // ADMIN: Master Data (B)
  {
    id: 'master-data',
    label: 'Master Data',
    path: '/admin/master-data',
    icon: PolicyIcon,
    roles: ADMIN_ROLES,
  },
  // ADMIN: People & Leadership (C)
  {
    id: 'leadership',
    label: 'People & Leadership',
    path: '/admin/leadership',
    icon: ManageAccountsIcon,
    roles: ADMIN_ROLES,
  },
  // ADMIN: Elections (D)
  {
    id: 'elections',
    label: 'Elections',
    path: '/admin/elections',
    icon: PollIcon,
    roles: ADMIN_ROLES,
  },
  // ADMIN: Eligibility & Codes (E)
  {
    id: 'eligibility',
    label: 'Eligibility & Codes',
    path: '/admin/eligibility',
    icon: GroupIcon,
    roles: ADMIN_ROLES,
  },
  // ADMIN: Results & Tally (G)
  {
    id: 'results',
    label: 'Results & Tally',
    path: '/admin/results',
    icon: CheckCircleIcon,
    roles: ADMIN_ROLES,
  },
  // DS: Eligibility & Codes (E)
  {
    id: 'ds-eligibility',
    label: 'Eligibility & Codes',
    path: '/ds/eligibility',
    icon: GroupIcon,
    roles: DS_ROLES,
  },
  // DS: Elections (D) - read-only
  {
    id: 'ds-elections',
    label: 'Elections (read-only)',
    path: '/ds/elections',
    icon: PollIcon,
    roles: DS_ROLES,
  },
  // DS: Results & Tally (G)
  {
    id: 'ds-results',
    label: 'Results & Tally',
    path: '/ds/results',
    icon: CheckCircleIcon,
    roles: DS_ROLES,
  },
]

/**
 * Filter menu items by role(s)
 * @param roles User roles to check
 * @returns Menu items accessible to the user
 */
export const getMenuItemsByRole = (roles: string[]): MenuItem[] =>
  MENU_ITEMS.filter(item => item.roles.some(role => roles.includes(role)))

/**
 * Logout menu item (always visible)
 */
export const LOGOUT_MENU_ITEM: MenuItem = {
  id: 'logout',
  label: 'Logout',
  path: '/logout',
  icon: LogoutIcon,
  roles: [...ADMIN_ROLES, ...DS_ROLES, ...VOTER_ROLES],
}
