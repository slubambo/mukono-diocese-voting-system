import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Autocomplete, Typography } from '@mui/material'
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
  const { control, handleSubmit, reset, setValue } = useForm<{ fellowshipPositionId?: number; seats?: number }>({ defaultValues: {} })
  const toast = useToast()
  const [options, setOptions] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!open) return
      setLoadingOptions(true)
      try {
        const election = await electionApi.get(electionId)
        const scope = (election as any)?.scope as PositionScope | undefined
        const fellowshipId = (election as any)?.fellowshipId ?? (election as any)?.fellowship?.id
        if (fellowshipId) {
          const fp = await fellowshipPositionApi.list({ fellowshipId, scope, page: 0, size: 1000 })
          setOptions(fp.content || [])
        } else {
          const fellowships = await fellowshipApi.list({ page: 0, size: 200 })
          const lists = await Promise.all(
            (fellowships.content || []).map((f) =>
              fellowshipPositionApi.list({ fellowshipId: f.id, scope, page: 0, size: 1000 }).then(r => r.content || [])
            )
          )
          setOptions(lists.flat())
        }
      } catch (err) {
        setOptions([])
      } finally {
        setLoadingOptions(false)
      }
    }
    load()
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
