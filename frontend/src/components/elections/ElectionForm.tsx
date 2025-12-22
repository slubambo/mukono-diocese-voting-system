import React, { useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { electionApi } from '../../api/election.api'
import { useToast } from '../feedback/ToastProvider'
import type { Election } from '../../types/election'

interface Props {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  election?: Election
}

const ElectionForm: React.FC<Props> = ({ open, onClose, onSaved, election }) => {
  const { control, handleSubmit, reset } = useForm<Partial<Election>>({ defaultValues: {} })
  const toast = useToast()

  useEffect(() => {
    if (election) {
      reset(election)
    } else {
      reset({})
    }
  }, [election, reset])

  const onSubmit = async (data: Partial<Election>) => {
    try {
      if (election?.id) {
        await electionApi.update(election.id, data)
        toast.success('Election updated')
      } else {
        await electionApi.create(data)
        toast.success('Election created')
      }
      onSaved && onSaved()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save election')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{election ? 'Edit Election' : 'Create Election'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Controller name="name" control={control} rules={{ required: true }} render={({ field }) => (
              <TextField {...field} label="Name" required />
            )} />

            <Controller name="description" control={control} render={({ field }) => (
              <TextField {...field} label="Description" multiline minRows={3} />
            )} />

            <Controller name="startDate" control={control} render={({ field }) => (
              <TextField {...field} label="Start Date" type="datetime-local" InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="endDate" control={control} render={({ field }) => (
              <TextField {...field} label="End Date" type="datetime-local" InputLabelProps={{ shrink: true }} />
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

export default ElectionForm
