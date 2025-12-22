/**
 * Reusable Master Data Header Component
 * Provides consistent styling for title, subtitle, filters, and actions across all master data pages
 */
import React from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

interface FilterOption {
  id: string
  label: string
  value: string | number | null
  options?: Array<{ id: string | number; name: string }>
  onChange: (value: string | number | null) => void
  disabled?: boolean
  placeholder?: string
}

interface MasterDataHeaderProps {
  title: string
  subtitle: string
  onAddClick?: () => void
  addButtonLabel?: string
  filters?: FilterOption[]
  stats?: Array<{ label: string; value: string | number }>
  isAdmin?: boolean
  actions?: Array<{ id: string; label: string; onClick: () => void }>
}

export const MasterDataHeader: React.FC<MasterDataHeaderProps> = ({
  title,
  subtitle,
  onAddClick,
  addButtonLabel = 'Add',
  filters,
  stats,
  isAdmin = false,
  actions,
}) => {
  return (
    <Paper
      sx={{
        mb: 3,
        p: 3,
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.05) 0%, rgba(88, 28, 135, 0.02) 100%)',
        border: '1px solid rgba(88, 28, 135, 0.1)',
        borderRadius: 2,
      }}
    >
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: filters ? 2 : 0 }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#2d1b4e',
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.95rem',
            }}
          >
            {subtitle}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {actions && actions.map((a) => (
            <Button key={a.id} variant="outlined" onClick={a.onClick} sx={{ textTransform: 'none' }}>{a.label}</Button>
          ))}
          {isAdmin && onAddClick && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddClick}
              sx={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                py: 1,
                borderRadius: 1.5,
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
                  boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
                },
              }}
            >
              {addButtonLabel}
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Row */}
      {stats && stats.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={2}>
            {stats.map((stat, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  background: 'rgba(88, 28, 135, 0.08)',
                  border: '1px solid rgba(88, 28, 135, 0.15)',
                  flex: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#7c3aed' }}>
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </>
      )}

      {/* Filters Section */}
      {filters && filters.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
            {filters.map((filter) => (
              filter.options && filter.options.length > 0 ? (
                <FormControl key={filter.id} sx={{ minWidth: 220 }} size="small">
                  <InputLabel>{filter.label}</InputLabel>
                  <Select
                    value={filter.value ?? ''}
                    label={filter.label}
                    onChange={(e) => filter.onChange(e.target.value === '' ? null : e.target.value)}
                    disabled={filter.disabled}
                    sx={{
                      borderRadius: 1,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#7c3aed',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#7c3aed',
                        },
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      -- {filter.placeholder || 'Select'} --
                    </MenuItem>
                    {filter.options.map((opt) => (
                      <MenuItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  key={filter.id}
                  label={filter.label}
                  size="small"
                  value={filter.value ?? ''}
                  onChange={(e) => filter.onChange(e.target.value === '' ? null : e.target.value)}
                  placeholder={filter.placeholder}
                  sx={{ minWidth: 220 }}
                />
              )
            ))}
          </Stack>
        </>
      )}
    </Paper>
  )
}

export default MasterDataHeader
