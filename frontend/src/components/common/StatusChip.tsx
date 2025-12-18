import React from 'react'
import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'

type StatusType = 'active' | 'used' | 'revoked' | 'expired' | 'pending' | 'completed'

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
    used: { color: 'info', label: 'Used' },
    revoked: { color: 'error', label: 'Revoked' },
    expired: { color: 'warning', label: 'Expired' },
    pending: { color: 'default', label: 'Pending' },
    completed: { color: 'success', label: 'Completed' },
  }

  const config = statusConfig[status]

  return (
    <Chip
      label={label || config.label}
      color={config.color}
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
      {...props}
    />
  )
}

export default StatusChip
