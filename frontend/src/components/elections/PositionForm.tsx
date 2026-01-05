import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Autocomplete, Typography, MenuItem, Chip } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { electionApi } from '../../api/election.api'
import { fellowshipPositionApi } from '../../api/fellowshipPosition.api'
import { fellowshipApi } from '../../api/fellowship.api'
import { useToast } from '../feedback/ToastProvider'
import { getErrorMessage } from '../../api/errorHandler'
import type { Position } from '../../types/election'
import type { PositionScope } from '../../types/leadership'

interface Props {
  open: boolean
  onClose: () => void
  electionId: string
  onSaved?: () => void
  position?: Position
}

const PositionForm: React.FC<Props> = ({ open, onClose, electionId, onSaved, position }) => {
  const { control, handleSubmit, setValue, watch } = useForm<{ fellowshipId?: number; fellowshipPositionIds?: number[]; seats?: number }>({ defaultValues: {} })
  const toast = useToast()
  const [fellowships, setFellowships] = useState<any[]>([])
  const [options, setOptions] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [electionScope, setElectionScope] = useState<PositionScope | undefined>(undefined)
  const [lockedFellowshipId, setLockedFellowshipId] = useState<number | null>(null)
  const prevFellowshipId = useRef<number | undefined>(undefined)
  const selectedFellowshipId = watch('fellowshipId')
  const selectedPositionIds = watch('fellowshipPositionIds') ?? []
  const getPositionLabel = (o: any) =>
    `${(o.titleName || (o.title && o.title.name)) ?? '—'} — ${(o.fellowshipName || (o.fellowship && o.fellowship.name)) ?? ''}`

  useEffect(() => {
    const load = async () => {
      if (!open) return
      try {
        const election = await electionApi.get(electionId)
        const scope = (election as any)?.scope as PositionScope | undefined
        const fellowshipId = (election as any)?.fellowshipId ?? (election as any)?.fellowship?.id
        const fellowshipName = (election as any)?.fellowshipName ?? (election as any)?.fellowship?.name
        setElectionScope(scope)
        setLockedFellowshipId(fellowshipId ?? null)
        if (fellowshipId) {
          setValue('fellowshipId', fellowshipId)
          if (fellowshipName) {
            setFellowships([{ id: fellowshipId, name: fellowshipName }])
          } else {
            const single = await fellowshipApi.get(fellowshipId)
          const singleList = single ? [single] : []
          setFellowships(singleList)
        }
      } else {
        const list = await fellowshipApi.list({ page: 0, size: 200 })
        const sorted = [...(list.content || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setFellowships(sorted)
      }
    } catch (err) {
      setFellowships([])
      } finally {
        setOptions([])
      }
    }
    load()
  }, [electionId, open, setValue])

  useEffect(() => {
    if (!open) return
    const loadOptions = async () => {
      if (!selectedFellowshipId) {
        setOptions([])
        return
      }
      setLoadingOptions(true)
      try {
        const fp = await fellowshipPositionApi.list({ fellowshipId: selectedFellowshipId, scope: electionScope, page: 0, size: 1000 })
        const sorted = [...(fp.content || [])].sort((a, b) => getPositionLabel(a).localeCompare(getPositionLabel(b)))
        setOptions(sorted)
      } catch (err) {
        setOptions([])
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOptions()
  }, [electionScope, open, selectedFellowshipId])

  useEffect(() => {
    if (prevFellowshipId.current !== undefined && prevFellowshipId.current !== selectedFellowshipId) {
      setValue('fellowshipPositionIds', undefined)
    }
    prevFellowshipId.current = selectedFellowshipId
  }, [selectedFellowshipId, setValue])

  useEffect(() => {
    if (position) {
      const positionFellowshipId = position.fellowshipPosition?.fellowshipId ?? position.fellowshipId
      if (positionFellowshipId) setValue('fellowshipId', positionFellowshipId)
      setValue('seats', position.seats)
      if (position.fellowshipPosition?.id) setValue('fellowshipPositionIds', [position.fellowshipPosition.id])
    } else {
      setValue('seats', undefined)
      setValue('fellowshipPositionIds', undefined)
    }
  }, [position, setValue])

  const onSubmit = async (data: { fellowshipPositionIds?: number[]; seats?: number }) => {
    const ids = data.fellowshipPositionIds?.filter(Boolean) ?? []
    if (ids.length === 0) { toast.error('Select at least one position'); return }
    try {
      const errors: string[] = []
      let successCount = 0
      for (const id of ids) {
        try {
          const payload = { fellowshipPositionId: id, seats: data.seats ?? 1 }
          await electionApi.createPosition(electionId, payload as any)
          successCount += 1
        } catch (err: any) {
          errors.push(getErrorMessage(err) || `Failed to add position ${id}`)
        }
      }
      if (successCount > 0) {
        toast.success(`Added ${successCount} position${successCount === 1 ? '' : 's'}`)
      }
      if (errors.length > 0) {
        toast.error(`Some positions failed: ${errors.join(' · ')}`)
      }
      onSaved && onSaved()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to add position')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{position ? 'Edit Position' : 'Add Position(s)'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {loadingOptions && <Typography variant="body2">Loading fellowship positions...</Typography>}
            <Controller name="fellowshipId" control={control} rules={{ required: true }} render={({ field }) => (
              <TextField
                {...field}
                select
                label="Fellowship"
                required
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                disabled={Boolean(lockedFellowshipId)}
              >
                <MenuItem value="">Select fellowship</MenuItem>
                {fellowships.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </TextField>
            )} />
            <Controller
              name="fellowshipPositionIds"
              control={control}
              rules={{ validate: (value) => (value && value.length > 0) || 'Select at least one position' }}
              render={({ field, fieldState }) => (
              <Autocomplete
                multiple
                options={options}
                getOptionLabel={getPositionLabel}
                onChange={(_, v) => field.onChange(v.map((item) => item.id))}
                value={options.filter((o) => (field.value ?? selectedPositionIds).includes(o.id))}
                renderTags={(value, getTagProps) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {value.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={option.id} label={getPositionLabel(option)} />
                    ))}
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Positions (title — fellowship)"
                    multiline
                    minRows={2}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
                disabled={!selectedFellowshipId}
              />
            )} />

            <Controller name="seats" control={control} render={({ field }) => (
              <TextField {...field} label="Seats" type="number" inputProps={{ min: 1 }} defaultValue={1} />
            )} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default PositionForm
