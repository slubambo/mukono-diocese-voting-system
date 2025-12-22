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
  const { control, handleSubmit, reset } = useForm<Partial<Election>>({
    defaultValues: {
      name: '',
      description: '',
      termStartDate: '',
      termEndDate: '',
      nominationStartAt: '',
      nominationEndAt: '',
      votingStartAt: '',
      votingEndAt: '',
    },
  })
  const toast = useToast()

  const formatLocalDateTime = (value?: string | null) => {
    if (!value) return ''
    const dt = new Date(value)
    if (Number.isNaN(dt.getTime())) return ''
    const pad = (num: number) => String(num).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  }

  useEffect(() => {
    if (election) {
      const values: Partial<Election> = {
        name: election.name,
        description: election.description ?? '',
        termStartDate: election.termStartDate ?? '',
        termEndDate: election.termEndDate ?? '',
        nominationStartAt: formatLocalDateTime(election.nominationStartAt),
        nominationEndAt: formatLocalDateTime(election.nominationEndAt),
        votingStartAt: formatLocalDateTime(election.votingStartAt),
        votingEndAt: formatLocalDateTime(election.votingEndAt),
      }
      reset(values)
    } else {
      reset()
    }
  }, [election, reset])

  const onSubmit = async (data: Partial<Election>) => {
    const toDateOrUndefined = (value?: string) => (value?.trim() ? value : undefined)
    const toIsoOrUndefined = (value?: string) => {
      if (!value?.trim()) return undefined
      const dt = new Date(value)
      if (Number.isNaN(dt.getTime())) return undefined
      return dt.toISOString()
    }
    try {
      const payload: Partial<Election> = {
        name: data.name?.trim(),
        description: data.description?.trim() || undefined,
        termStartDate: toDateOrUndefined(data.termStartDate as string | undefined),
        termEndDate: toDateOrUndefined(data.termEndDate as string | undefined),
        nominationStartAt: toIsoOrUndefined(data.nominationStartAt as string | undefined),
        nominationEndAt: toIsoOrUndefined(data.nominationEndAt as string | undefined),
        votingStartAt: toIsoOrUndefined(data.votingStartAt as string | undefined),
        votingEndAt: toIsoOrUndefined(data.votingEndAt as string | undefined),
      }
      if (election?.id) {
        await electionApi.update(String(election.id), payload)
        toast.success('Election updated')
      } else {
        await electionApi.create(payload)
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

            <Controller name="termStartDate" control={control} render={({ field }) => (
              <TextField {...field} label="Term Start Date" type="date" InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="termEndDate" control={control} render={({ field }) => (
              <TextField {...field} label="Term End Date" type="date" InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="nominationStartAt" control={control} render={({ field }) => (
              <TextField {...field} label="Nomination Start" type="datetime-local" InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="nominationEndAt" control={control} render={({ field }) => (
              <TextField {...field} label="Nomination End" type="datetime-local" InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="votingStartAt" control={control} render={({ field }) => (
              <TextField {...field} label="Voting Start" type="datetime-local" InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="votingEndAt" control={control} render={({ field }) => (
              <TextField {...field} label="Voting End" type="datetime-local" InputLabelProps={{ shrink: true }} />
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
