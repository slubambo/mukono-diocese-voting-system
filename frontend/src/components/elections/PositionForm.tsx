import React, { useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { electionApi } from '../../api/election.api'
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
  const { control, handleSubmit, reset } = useForm<Partial<Position>>({ defaultValues: {} })
  const toast = useToast()

  useEffect(() => {
    if (position) reset(position)
    else reset({})
  }, [position, reset])

  const onSubmit = async (data: Partial<Position>) => {
    try {
      await electionApi.createPosition(electionId, data)
      toast.success('Position added')
      onSaved && onSaved()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add position')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Position</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Controller name="title" control={control} rules={{ required: true }} render={({ field }) => (
              <TextField {...field} label="Title" required />
            )} />

            <Controller name="description" control={control} render={({ field }) => (
              <TextField {...field} label="Description" multiline minRows={2} />
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
