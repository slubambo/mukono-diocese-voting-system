import React from 'react'
import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'

type StatusType =
  | 'active'
  | 'inactive'
  | 'used'
  | 'revoked'
  | 'expired'
  | 'pending'
  | 'completed'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'USED'
  | 'REVOKED'
  | 'EXPIRED'

interface StatusChipProps extends Omit<ChipProps, 'label' | 'variant'> {
  status: StatusType
  label?: string
}

/**
 * Status chip component for displaying status badges
 * Automatically colors based on status type
 */
const StatusChip: React.FC<StatusChipProps> = ({ status, label, ...props }) => {
  const statusConfig: Record<StatusType, { color: ChipProps['color']; label: string }> = {
    active: { color: 'success', label: 'Active' },
    ACTIVE: { color: 'success', label: 'Active' },
    inactive: { color: 'default', label: 'Inactive' },
    INACTIVE: { color: 'default', label: 'Inactive' },
    used: { color: 'info', label: 'Used' },
    USED: { color: 'info', label: 'Used' },
    revoked: { color: 'error', label: 'Revoked' },
    REVOKED: { color: 'error', label: 'Revoked' },
    expired: { color: 'warning', label: 'Expired' },
    EXPIRED: { color: 'warning', label: 'Expired' },
    pending: { color: 'default', label: 'Pending' },
    completed: { color: 'success', label: 'Completed' },
  }

  const config = statusConfig[status]

  const fallback = { color: 'default' as ChipProps['color'], label: String(status ?? 'Unknown') }
  const used = config ?? fallback

  return (
    <Chip
      label={label || used.label}
      color={used.color}
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
      {...props}
    />
  )
}

export default StatusChip
