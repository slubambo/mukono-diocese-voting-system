import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Autocomplete } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { electionApi } from '../../api/election.api'
import { fellowshipPositionApi } from '../../api/fellowshipPosition.api'
import { useToast } from '../feedback/ToastProvider'
import type { Position } from '../../types/election'

interface Props {
  open: boolean
  onClose: () => void
  electionId: string
  onSaved?: () => void
  position?: Position
}

const PositionForm: React.FC<Props> = ({ open, onClose, electionId, onSaved, position }) => {
  const { control, handleSubmit, reset, setValue } = useForm<{ fellowshipPositionId?: number; seats?: number }>({ defaultValues: {} })
  const toast = useToast()
  const [options, setOptions] = useState<any[]>([])

  useEffect(() => {
    // try to load all fellowship positions (best-effort). Fallback to fellowship positions already on this election.
    const load = async () => {
      try {
        const fp = await fellowshipPositionApi.list({ page: 0, size: 1000 } as any)
        setOptions(fp.content || [])
      } catch (e) {
        // fallback: load positions already in election
        try {
          const res = await electionApi.listPositions(electionId)
          const arr = (res as any)?.content || []
          const fromElection = arr.map((p: any) => p.fellowshipPosition).filter(Boolean)
          setOptions(fromElection)
        } catch (err) {
          setOptions([])
        }
      }
    }
    if (open) load()
  }, [electionId, open])

  useEffect(() => {
    if (position) {
      // prefill seats and fellowshipPosition if available
      reset({ seats: position.seats })
      if (position.fellowshipPosition?.id) setValue('fellowshipPositionId', position.fellowshipPosition.id)
    } else reset({})
  }, [position, reset, setValue])

  const onSubmit = async (data: { fellowshipPositionId?: number; seats?: number }) => {
    if (!data.fellowshipPositionId) { toast.error('Select a position'); return }
    try {
      const payload = { fellowshipPositionId: data.fellowshipPositionId, seats: data.seats ?? 1 }
      await electionApi.createPosition(electionId, payload as any)
      toast.success('Position added')
      onSaved && onSaved()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add position')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{position ? 'Edit Position' : 'Add Position'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Controller name="fellowshipPositionId" control={control} rules={{ required: true }} render={({ field }) => (
              <Autocomplete
                options={options}
                getOptionLabel={(o: any) => `${(o.titleName || (o.title && o.title.name)) ?? '—'} — ${(o.fellowshipName || (o.fellowship && o.fellowship.name)) ?? ''}`}
                onChange={(_, v) => field.onChange(v?.id ?? undefined)}
                value={options.find(o => o.id === field.value) ?? null}
                renderInput={(params) => <TextField {...params} label="Position (title — fellowship)" required />}
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
