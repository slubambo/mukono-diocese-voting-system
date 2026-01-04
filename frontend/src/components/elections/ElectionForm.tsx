import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, MenuItem } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { electionApi } from '../../api/election.api'
import { fellowshipApi } from '../../api/fellowship.api'
import { dioceseApi } from '../../api/diocese.api'
import { archdeaconryApi } from '../../api/archdeaconry.api'
import { churchApi } from '../../api/church.api'
import { useToast } from '../feedback/ToastProvider'
import type { Election } from '../../types/election'
import type { Fellowship, Diocese, Archdeaconry, Church } from '../../types/organization'

interface Props {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  election?: Election
}

const defaultValues: Partial<Election> = {
  name: '',
  description: '',
  fellowshipId: undefined,
  scope: '',
  dioceseId: undefined,
  archdeaconryId: undefined,
  churchId: undefined,
  termStartDate: '',
  termEndDate: '',
  nominationStartAt: undefined,
  nominationEndAt: undefined,
  votingStartAt: undefined,
  votingEndAt: undefined,
}

const ElectionForm: React.FC<Props> = ({ open, onClose, onSaved, election }) => {
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<Partial<Election>>({
    defaultValues,
  })
  const toast = useToast()
  const [fellowships, setFellowships] = useState<Fellowship[]>([])
  const [dioceses, setDioceses] = useState<Diocese[]>([])
  const [archdeaconries, setArchdeaconries] = useState<Archdeaconry[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const baseListsLoaded = useRef(false)

  const scope = watch('scope') as string | undefined
  const selectedDioceseId = watch('dioceseId') as number | undefined
  const selectedArchdeaconryId = watch('archdeaconryId') as number | undefined
  const termStartDate = watch('termStartDate') as string | undefined
  const nominationStartAt = watch('nominationStartAt') as string | undefined
  const votingStartAt = watch('votingStartAt') as string | undefined
  const votingEndAt = watch('votingEndAt') as string | undefined
  const termStartValue = termStartDate ? dayjs(termStartDate) : null
  const nominationStartValue = nominationStartAt ? dayjs(nominationStartAt as any) : null
  const votingStartValue = votingStartAt ? dayjs(votingStartAt as any) : null
  const isEditing = Boolean(election?.id)

  const formatLocalDateTime = (value?: string | null) => {
    if (!value) return null
    return dayjs(value)
  }

  useEffect(() => {
    if (!open) return
    if (election) {
      const fellowshipId = election.fellowshipId ?? election.fellowship?.id
      const dioceseId = election.dioceseId ?? election.diocese?.id
      const archdeaconryId = election.archdeaconryId ?? election.archdeaconry?.id
      const churchId = election.churchId ?? election.church?.id
      const values: Partial<Election> = {
        name: election.name,
        description: election.description ?? '',
        fellowshipId,
        scope: election.scope ?? '',
        dioceseId,
        archdeaconryId,
        churchId,
        termStartDate: election.termStartDate ?? '',
        termEndDate: election.termEndDate ?? '',
        nominationStartAt: formatLocalDateTime(election.nominationStartAt) as any,
        nominationEndAt: formatLocalDateTime(election.nominationEndAt) as any,
        votingStartAt: formatLocalDateTime(election.votingStartAt) as any,
        votingEndAt: formatLocalDateTime(election.votingEndAt) as any,
      }
      reset(values)
    } else {
      reset(defaultValues)
      setArchdeaconries([])
      setChurches([])
    }
  }, [election, open, reset])

  useEffect(() => {
    if (!open) {
      baseListsLoaded.current = false
      return
    }
    if (baseListsLoaded.current) return
    const loadBaseLists = async () => {
      try {
        const [fellowshipRes, dioceseRes] = await Promise.all([
          fellowshipApi.list({ page: 0, size: 1000 }),
          dioceseApi.list({ page: 0, size: 1000 }),
        ])
        setFellowships(fellowshipRes.content || [])
        setDioceses(dioceseRes.content || [])
        baseListsLoaded.current = true
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load election setup data')
      }
    }
    loadBaseLists()
  }, [open, toast])

  useEffect(() => {
    const loadArchdeaconries = async () => {
      if (!selectedDioceseId) {
        setArchdeaconries([])
        setValue('archdeaconryId', undefined)
        setChurches([])
        setValue('churchId', undefined)
        return
      }
      try {
        const res = await archdeaconryApi.list({ dioceseId: selectedDioceseId, page: 0, size: 1000 })
        setArchdeaconries(res.content || [])
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load archdeaconries')
      }
    }
    if (scope === 'ARCHDEACONRY' || scope === 'CHURCH') {
      loadArchdeaconries()
    } else {
      setArchdeaconries([])
      setValue('archdeaconryId', undefined)
    }
  }, [scope, selectedDioceseId, setValue, toast])

  useEffect(() => {
    const loadChurches = async () => {
      if (!selectedArchdeaconryId) {
        setChurches([])
        setValue('churchId', undefined)
        return
      }
      try {
        const res = await churchApi.list({ archdeaconryId: selectedArchdeaconryId, page: 0, size: 1000 })
        setChurches(res.content || [])
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load churches')
      }
    }
    if (scope === 'CHURCH') {
      loadChurches()
    } else {
      setChurches([])
      setValue('churchId', undefined)
    }
  }, [scope, selectedArchdeaconryId, setValue, toast])

  const onSubmit = async (data: Partial<Election>) => {
    const toDateOrUndefined = (value?: string | any) => {
      if (!value) return undefined
      const d = dayjs(value)
      if (!d.isValid()) return undefined
      return d.format('YYYY-MM-DD')
    }
    const toIsoOrUndefined = (value?: any) => {
      if (!value) return undefined
      const dt = dayjs(value)
      if (!dt.isValid()) return undefined
      return dt.toISOString()
    }
    const scopeValue = data.scope
    const normalizeTargets = (payload: Partial<Election>) => {
      if (scopeValue === 'DIOCESE') {
        payload.dioceseId = data.dioceseId ? Number(data.dioceseId) : null
        payload.archdeaconryId = null
        payload.churchId = null
      } else if (scopeValue === 'ARCHDEACONRY') {
        payload.dioceseId = null
        payload.archdeaconryId = data.archdeaconryId ? Number(data.archdeaconryId) : null
        payload.churchId = null
      } else if (scopeValue === 'CHURCH') {
        payload.dioceseId = null
        payload.archdeaconryId = null
        payload.churchId = data.churchId ? Number(data.churchId) : null
      }
    }
    try {
      const payload: Partial<Election> = {
        name: data.name?.trim(),
        description: data.description?.trim() || undefined,
        fellowshipId: data.fellowshipId ? Number(data.fellowshipId) : (undefined as any),
        scope: scopeValue || undefined,
        termStartDate: toDateOrUndefined(data.termStartDate as any),
        termEndDate: toDateOrUndefined(data.termEndDate as any),
        nominationStartAt: toIsoOrUndefined(data.nominationStartAt),
        nominationEndAt: toIsoOrUndefined(data.nominationEndAt),
        votingStartAt: toIsoOrUndefined(data.votingStartAt),
        votingEndAt: toIsoOrUndefined(data.votingEndAt),
      }
      normalizeTargets(payload)
      if (!election?.id) {
        if (!payload.scope) {
          toast.error('Scope is required')
          return
        }
        if (payload.scope === 'DIOCESE' && !payload.dioceseId) {
          toast.error('Diocese is required for DIOCESE scope')
          return
        }
        if (payload.scope === 'ARCHDEACONRY' && !payload.archdeaconryId) {
          toast.error('Archdeaconry is required for ARCHDEACONRY scope')
          return
        }
        if (payload.scope === 'CHURCH' && !payload.churchId) {
          toast.error('Church is required for CHURCH scope')
          return
        }
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{election ? 'Edit Election' : 'Create Election'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5, mt: 2 }}>
            <Controller name="name" control={control} rules={{ required: true }} render={({ field }) => (
              <TextField {...field} label="Name" required size="small" sx={{ gridColumn: '1 / -1' }} />
            )} />

            <Controller name="description" control={control} render={({ field }) => (
              <TextField {...field} label="Description" multiline minRows={2} size="small" sx={{ gridColumn: '1 / -1' }} />
            )} />

            <Controller name="scope" control={control} rules={{ required: 'Scope is required' }} render={({ field }) => (
              <TextField
                {...field}
                select
                label="Scope"
                required
                size="small"
                value={field.value ?? ''}
                disabled={isEditing}
                error={Boolean(errors.scope)}
                helperText={errors.scope?.message as string | undefined}
              >
                <MenuItem value="DIOCESE">DIOCESE</MenuItem>
                <MenuItem value="ARCHDEACONRY">ARCHDEACONRY</MenuItem>
                <MenuItem value="CHURCH">CHURCH</MenuItem>
              </TextField>
            )} />

            <Controller name="fellowshipId" control={control} render={({ field }) => (
              <TextField
                {...field}
                select
                label="Fellowship"
                size="small"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                helperText="Optional"
              >
                <MenuItem value="">None</MenuItem>
                {fellowships.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </TextField>
            )} />

            <Controller name="termStartDate" control={control} rules={{ required: 'Term start date is required' }} render={({ field: { value, onChange } }) => (
              <DatePicker
                label="Term Start Date"
                views={['year', 'month']}
                openTo="year"
                format="YYYY-MM"
                value={value ? dayjs(value) : null}
                onChange={(v) => onChange(v ? v.startOf('month').format('YYYY-MM-DD') : '')}
                slotProps={{ textField: { fullWidth: true, size: 'small', error: Boolean(errors.termStartDate), helperText: errors.termStartDate?.message as string | undefined } }}
              />
            )} />

            <Controller name="termEndDate" control={control} rules={{
              required: 'Term end date is required',
              validate: (value) => {
                if (!value || !termStartDate) return true
                const start = dayjs(termStartDate)
                const end = dayjs(value)
                return end.isAfter(start) || 'Term end date must be after start date'
              },
            }} render={({ field: { value, onChange } }) => (
              <DatePicker
                label="Term End Date"
                views={['year', 'month']}
                openTo="year"
                format="YYYY-MM"
                value={value ? dayjs(value) : null}
                minDate={termStartValue ?? undefined}
                onChange={(v) => onChange(v ? v.startOf('month').format('YYYY-MM-DD') : '')}
                slotProps={{ textField: { fullWidth: true, size: 'small', error: Boolean(errors.termEndDate), helperText: errors.termEndDate?.message as string | undefined } }}
              />
            )} />

            {scope === 'DIOCESE' && (
              <Controller name="dioceseId" control={control} rules={{ required: 'Diocese is required' }} render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Diocese"
                  required
                  size="small"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={isEditing}
                  error={Boolean(errors.dioceseId)}
                  helperText={errors.dioceseId?.message as string | undefined}
                >
                  {dioceses.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              )} />
            )}

            {(scope === 'ARCHDEACONRY' || scope === 'CHURCH') && (
              <Controller name="dioceseId" control={control} rules={{ required: 'Diocese is required' }} render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Diocese"
                  required
                  size="small"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={isEditing}
                  error={Boolean(errors.dioceseId)}
                  helperText="Filter for archdeaconries"
                >
                  {dioceses.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              )} />
            )}

            {scope === 'ARCHDEACONRY' && (
              <Controller name="archdeaconryId" control={control} rules={{ required: 'Archdeaconry is required' }} render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Archdeaconry"
                  required
                  size="small"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={isEditing}
                  error={Boolean(errors.archdeaconryId)}
                  helperText={errors.archdeaconryId?.message as string | undefined}
                >
                  {archdeaconries.map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </TextField>
              )} />
            )}

            {scope === 'CHURCH' && (
              <>
                <Controller name="archdeaconryId" control={control} rules={{ required: 'Archdeaconry is required' }} render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Archdeaconry"
                    required
                    size="small"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    disabled={isEditing}
                    error={Boolean(errors.archdeaconryId)}
                    helperText={errors.archdeaconryId?.message as string | undefined}
                  >
                    {archdeaconries.map((a) => (
                      <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                    ))}
                  </TextField>
                )} />

                <Controller name="churchId" control={control} rules={{ required: 'Church is required' }} render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Church"
                    required
                    size="small"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    disabled={isEditing}
                    error={Boolean(errors.churchId)}
                    helperText={errors.churchId?.message as string | undefined}
                  >
                    {churches.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                )} />
              </>
            )}

            <Controller name="nominationStartAt" control={control} render={({ field: { value, onChange } }) => (
              <DateTimePicker
                label="Nomination Start"
                value={value ? dayjs(value) : null}
                onChange={(v) => onChange(v ? v.toISOString() : undefined)}
                slotProps={{ textField: { fullWidth: true, size: 'small', error: Boolean(errors.nominationStartAt), helperText: errors.nominationStartAt?.message as string | undefined } }}
              />
            )} />

            <Controller name="nominationEndAt" control={control} rules={{
              validate: (value) => {
                if (!nominationStartAt && !value) return true
                if (!nominationStartAt && value) return 'Nomination start time is required'
                if (nominationStartAt && !value) return 'Nomination end time is required'
                const start = dayjs(nominationStartAt as any)
                const end = dayjs(value as any)
                if (start.isValid() && end.isValid() && end.isBefore(start)) {
                  return 'Nomination end must be after start'
                }
                if (votingEndAt) {
                  const votEnd = dayjs(votingEndAt as any)
                  if (end.isValid() && votEnd.isValid() && end.isAfter(votEnd)) {
                    return 'Nomination end must not be after voting end'
                  }
                }
                return true
              },
            }} render={({ field: { value, onChange } }) => (
              <DateTimePicker
                label="Nomination End"
                value={value ? dayjs(value) : null}
                minDateTime={nominationStartValue ?? undefined}
                onChange={(v) => onChange(v ? v.toISOString() : undefined)}
                slotProps={{ textField: { fullWidth: true, size: 'small', error: Boolean(errors.nominationEndAt), helperText: errors.nominationEndAt?.message as string | undefined } }}
              />
            )} />

            <Controller name="votingStartAt" control={control} rules={{ required: 'Voting start time is required' }} render={({ field: { value, onChange } }) => (
              <DateTimePicker
                label="Voting Start"
                value={value ? dayjs(value) : null}
                onChange={(v) => onChange(v ? v.toISOString() : undefined)}
                slotProps={{ textField: { fullWidth: true, size: 'small', error: Boolean(errors.votingStartAt), helperText: errors.votingStartAt?.message as string | undefined } }}
              />
            )} />

            <Controller name="votingEndAt" control={control} rules={{
              required: 'Voting end time is required',
              validate: (value) => {
                if (!value || !votingStartAt) return true
                const start = dayjs(votingStartAt as any)
                const end = dayjs(value as any)
                return end.isAfter(start) || 'Voting end must be after start'
              },
            }} render={({ field: { value, onChange } }) => (
              <DateTimePicker
                label="Voting End"
                value={value ? dayjs(value) : null}
                minDateTime={votingStartValue ?? undefined}
                onChange={(v) => onChange(v ? v.toISOString() : undefined)}
                slotProps={{ textField: { fullWidth: true, size: 'small', error: Boolean(errors.votingEndAt), helperText: errors.votingEndAt?.message as string | undefined } }}
              />
            )} />
            </Box>
          </LocalizationProvider>
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
