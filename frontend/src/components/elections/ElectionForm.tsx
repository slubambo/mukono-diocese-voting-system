import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, MenuItem } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
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

const ElectionForm: React.FC<Props> = ({ open, onClose, onSaved, election }) => {
  const { control, handleSubmit, reset, watch, setValue } = useForm<Partial<Election>>({
    defaultValues: {
      name: '',
      description: '',
      fellowshipId: undefined,
      scope: '',
      dioceseId: undefined,
      archdeaconryId: undefined,
      churchId: undefined,
      termStartDate: '',
      termEndDate: '',
      nominationStartAt: '',
      nominationEndAt: '',
      votingStartAt: '',
      votingEndAt: '',
    },
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

  const formatLocalDateTime = (value?: string | null) => {
    if (!value) return ''
    const dt = new Date(value)
    if (Number.isNaN(dt.getTime())) return ''
    const pad = (num: number) => String(num).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
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
        nominationStartAt: formatLocalDateTime(election.nominationStartAt),
        nominationEndAt: formatLocalDateTime(election.nominationEndAt),
        votingStartAt: formatLocalDateTime(election.votingStartAt),
        votingEndAt: formatLocalDateTime(election.votingEndAt),
      }
      reset(values)
    } else {
      reset()
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
    const toDateOrUndefined = (value?: string) => (value?.trim() ? value : undefined)
    const toIsoOrUndefined = (value?: string) => {
      if (!value?.trim()) return undefined
      const dt = new Date(value)
      if (Number.isNaN(dt.getTime())) return undefined
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
        fellowshipId: data.fellowshipId ? Number(data.fellowshipId) : null,
        scope: scopeValue || undefined,
        termStartDate: toDateOrUndefined(data.termStartDate as string | undefined),
        termEndDate: toDateOrUndefined(data.termEndDate as string | undefined),
        nominationStartAt: toIsoOrUndefined(data.nominationStartAt as string | undefined),
        nominationEndAt: toIsoOrUndefined(data.nominationEndAt as string | undefined),
        votingStartAt: toIsoOrUndefined(data.votingStartAt as string | undefined),
        votingEndAt: toIsoOrUndefined(data.votingEndAt as string | undefined),
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

            <Controller name="scope" control={control} rules={{ required: true }} render={({ field }) => (
              <TextField {...field} select label="Scope" required value={field.value ?? ''}>
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
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                helperText="Optional. Set only if the election is for one fellowship."
              >
                {fellowships.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </TextField>
            )} />

            {scope === 'DIOCESE' && (
              <Controller name="dioceseId" control={control} rules={{ required: true }} render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Diocese"
                  required
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                >
                  {dioceses.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              )} />
            )}

            {(scope === 'ARCHDEACONRY' || scope === 'CHURCH') && (
              <Controller name="dioceseId" control={control} render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Diocese"
                  required
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  helperText="Used to filter archdeaconries"
                >
                  {dioceses.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              )} />
            )}

            {scope === 'ARCHDEACONRY' && (
              <Controller name="archdeaconryId" control={control} rules={{ required: true }} render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Archdeaconry"
                  required
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                >
                  {archdeaconries.map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </TextField>
              )} />
            )}

            {scope === 'CHURCH' && (
              <>
                <Controller name="archdeaconryId" control={control} rules={{ required: true }} render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Archdeaconry"
                    required
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    {archdeaconries.map((a) => (
                      <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                    ))}
                  </TextField>
                )} />

                <Controller name="churchId" control={control} rules={{ required: true }} render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Church"
                    required
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    {churches.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                )} />
              </>
            )}

            <Controller name="termStartDate" control={control} rules={{ required: true }} render={({ field }) => (
              <TextField {...field} label="Term Start Date" type="date" required InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="termEndDate" control={control} rules={{ required: true }} render={({ field }) => (
              <TextField {...field} label="Term End Date" type="date" required InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="nominationStartAt" control={control} render={({ field }) => (
              <TextField {...field} label="Nomination Start" type="datetime-local" InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="nominationEndAt" control={control} render={({ field }) => (
              <TextField {...field} label="Nomination End" type="datetime-local" InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="votingStartAt" control={control} rules={{ required: true }} render={({ field }) => (
              <TextField {...field} label="Voting Start" type="datetime-local" required InputLabelProps={{ shrink: true }} />
            )} />

            <Controller name="votingEndAt" control={control} rules={{ required: true }} render={({ field }) => (
              <TextField {...field} label="Voting End" type="datetime-local" required InputLabelProps={{ shrink: true }} />
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
