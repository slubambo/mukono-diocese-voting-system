import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Autocomplete, Typography, MenuItem } from '@mui/material'
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
  const { control, handleSubmit, setValue, watch } = useForm<{ fellowshipId?: number; fellowshipPositionId?: number; seats?: number }>({ defaultValues: {} })
  const toast = useToast()
  const [fellowships, setFellowships] = useState<any[]>([])
  const [options, setOptions] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [electionScope, setElectionScope] = useState<PositionScope | undefined>(undefined)
  const [lockedFellowshipId, setLockedFellowshipId] = useState<number | null>(null)
  const prevFellowshipId = useRef<number | undefined>(undefined)
  const selectedFellowshipId = watch('fellowshipId')

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
            setFellowships(single ? [single] : [])
          }
        } else {
          const list = await fellowshipApi.list({ page: 0, size: 200 })
          setFellowships(list.content || [])
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
        setOptions(fp.content || [])
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
      setValue('fellowshipPositionId', undefined)
    }
    prevFellowshipId.current = selectedFellowshipId
  }, [selectedFellowshipId, setValue])

  useEffect(() => {
    if (position) {
      const positionFellowshipId = position.fellowshipPosition?.fellowshipId ?? position.fellowshipId
      if (positionFellowshipId) setValue('fellowshipId', positionFellowshipId)
      setValue('seats', position.seats)
      if (position.fellowshipPosition?.id) setValue('fellowshipPositionId', position.fellowshipPosition.id)
    } else {
      setValue('seats', undefined)
      setValue('fellowshipPositionId', undefined)
    }
  }, [position, setValue])

  const onSubmit = async (data: { fellowshipPositionId?: number; seats?: number }) => {
    if (!data.fellowshipPositionId) { toast.error('Select a position'); return }
    try {
      const payload = { fellowshipPositionId: data.fellowshipPositionId, seats: data.seats ?? 1 }
      await electionApi.createPosition(electionId, payload as any)
      toast.success('Position added')
      onSaved && onSaved()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to add position')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{position ? 'Edit Position' : 'Add Position'}</DialogTitle>
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
            <Controller name="fellowshipPositionId" control={control} rules={{ required: true }} render={({ field }) => (
              <Autocomplete
                options={options}
                getOptionLabel={(o: any) => `${(o.titleName || (o.title && o.title.name)) ?? '—'} — ${(o.fellowshipName || (o.fellowship && o.fellowship.name)) ?? ''}`}
                onChange={(_, v) => field.onChange(v?.id ?? undefined)}
                value={options.find(o => o.id === field.value) ?? null}
                renderInput={(params) => <TextField {...params} label="Position (title — fellowship)" required />}
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
