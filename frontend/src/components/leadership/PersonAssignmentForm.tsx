import React, { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Box, Button, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete, FormHelperText } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
// @ts-ignore dayjs module resolution without esModuleInterop
import dayjs from 'dayjs'
import type { CreatePersonWithAssignmentRequest } from '../../types/leadership'
import { peopleApi } from '../../api/people.api'
import { leadershipApi } from '../../api/leadership.api'
import { fellowshipApi } from '../../api/fellowship.api'
import { fellowshipPositionApi } from '../../api/fellowshipPosition.api'
import { dioceseApi } from '../../api/diocese.api'
import { archdeaconryApi } from '../../api/archdeaconry.api'
import { churchApi } from '../../api/church.api'
import { useToast } from '../../components/feedback/ToastProvider'

interface Props {
  onSaved?: () => void
  onCancel?: () => void
}

const PersonAssignmentForm: React.FC<Props> = ({ onSaved, onCancel }) => {
  const { addToast } = useToast()
  const [fellowships, setFellowships] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [dioceses, setDioceses] = useState<any[]>([])
  const [archdeaconries, setArchdeaconries] = useState<any[]>([])
  const [churches, setChurches] = useState<any[]>([])
  const [levels, setLevels] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)

  const { control, handleSubmit, watch, setValue } = useForm<CreatePersonWithAssignmentRequest & { termStartDateMonth?: string; termEndDateMonth?: string }>({
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      gender: '',
      dateOfBirth: '',
      fellowshipPositionId: 0,
      termStartDate: '',
      termEndDate: '',
    },
  })

  const watchedFellowship = watch('fellowshipId' as any) as number | undefined
  const watchedDiocese = watch('dioceseId') as number | undefined

  useEffect(() => {
    fellowshipApi.list({ page: 0, size: 1000 }).then(r => setFellowships(r.content)).catch(() => {})
    dioceseApi.list({ page: 0, size: 100 }).then(r => setDioceses(r.content)).catch(() => {})
    leadershipApi.getLevels().then(lv => setLevels(lv)).catch(() => setLevels(['DIOCESE', 'ARCHDEACONRY', 'CHURCH']))
  }, [])

  useEffect(() => {
    if (watchedFellowship) {
      const params: any = { fellowshipId: watchedFellowship, page: 0, size: 1000 }
      if (selectedLevel) params.scope = selectedLevel
      fellowshipPositionApi.list(params).then(r => setPositions(r.content)).catch(() => setPositions([]))
    } else {
      setPositions([])
    }
  }, [watchedFellowship, selectedLevel])

  useEffect(() => {
    if (watchedDiocese) {
      archdeaconryApi.list({ dioceseId: watchedDiocese, page: 0, size: 1000 }).then(r => setArchdeaconries(r.content)).catch(() => setArchdeaconries([]))
    } else {
      setArchdeaconries([])
      setValue('archdeaconryId', undefined)
      setValue('churchId', undefined)
    }
  }, [watchedDiocese, setValue])

  useEffect(() => {
    const sub = watch((value, { name }) => {
      if (name === 'archdeaconryId') {
        const aid = value.archdeaconryId as number | undefined
        if (aid) churchApi.list({ archdeaconryId: aid, page: 0, size: 1000 }).then(r => setChurches(r.content)).catch(() => setChurches([]))
        else setChurches([])
      }
    })
    return () => sub.unsubscribe()
  }, [watch])

  const submit = async (data: any) => {
    try {
      const payload: any = { ...data }
      if (data.termStartDateMonth) payload.termStartDate = `${data.termStartDateMonth}-01`
      if (data.termEndDateMonth) {
        const [y, m] = data.termEndDateMonth.split('-').map((s: string) => parseInt(s, 10))
        const last = new Date(y, m, 0)
        payload.termEndDate = `${y}-${String(m).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
      }

      const pos = positions.find(p => p.id === payload.fellowshipPositionId)
      if (!pos) { addToast('Select a valid position', 'error'); return }
      const scope = pos.scope
      if (scope === 'DIOCESE') {
        if (!payload.dioceseId) { addToast('Diocese is required for this position', 'error'); return }
        payload.archdeaconryId = undefined
        payload.churchId = undefined
      } else if (scope === 'ARCHDEACONRY') {
        if (!payload.archdeaconryId) { addToast('Archdeaconry is required for this position', 'error'); return }
        payload.dioceseId = undefined
        payload.churchId = undefined
      } else if (scope === 'CHURCH') {
        if (!payload.churchId) { addToast('Church is required for this position', 'error'); return }
        payload.dioceseId = undefined
        payload.archdeaconryId = undefined
      }

      const finalPayload: CreatePersonWithAssignmentRequest = {
        fullName: payload.fullName,
        email: payload.email || undefined,
        phoneNumber: payload.phoneNumber || undefined,
        gender: payload.gender || undefined,
        dateOfBirth: payload.dateOfBirth || undefined,
        fellowshipPositionId: Number(payload.fellowshipPositionId),
        termStartDate: payload.termStartDate,
        termEndDate: payload.termEndDate || undefined,
        notes: payload.notes ?? undefined,
      }
      if (scope === 'DIOCESE') finalPayload.dioceseId = Number(payload.dioceseId)
      if (scope === 'ARCHDEACONRY') finalPayload.archdeaconryId = Number(payload.archdeaconryId)
      if (scope === 'CHURCH') finalPayload.churchId = Number(payload.churchId)

      await peopleApi.createWithAssignment(finalPayload)
      addToast('Person and assignment created', 'success')
      if (onSaved) onSaved()
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Failed to create person and assignment', 'error')
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box component="form" onSubmit={handleSubmit(submit)} sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <Controller name="fullName" control={control} rules={{ required: 'Full name is required' }} render={({ field, fieldState }) => (
          <TextField {...field} label="Full Name" required error={!!fieldState.error} helperText={fieldState.error?.message} size="small" sx={{ gridColumn: '1 / -1' }} />
        )} />

        <Controller name="email" control={control} render={({ field }) => (
          <TextField {...field} label="Email" type="email" size="small" />
        )} />

        <Controller name="phoneNumber" control={control} rules={{ required: 'Phone number is required' }} render={({ field, fieldState }) => (
          <TextField {...field} label="Phone Number" required size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />
        )} />

        <Controller name="gender" control={control} rules={{ required: 'Gender is required' }} render={({ field, fieldState }) => (
          <FormControl size="small" error={!!fieldState.error} required>
            <InputLabel>Gender</InputLabel>
            <Select {...field} label="Gender">
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
            </Select>
            {fieldState.error?.message ? <FormHelperText>{fieldState.error.message}</FormHelperText> : null}
          </FormControl>
        )} />

        <Controller name="dateOfBirth" control={control} rules={{
          validate: (value) => {
            if (!value) return true
            const date = dayjs(value)
            if (!date.isValid()) return 'Invalid date'
            const age = dayjs().diff(date, 'year')
            if (age < 0) return 'Birth date cannot be in the future'
            return true
          },
        }} render={({ field, fieldState }) => (
          <DatePicker
            label="Date of Birth"
            value={field.value ? dayjs(field.value) : null}
            onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
            maxDate={dayjs().subtract(18, 'year')}
            slotProps={{
              textField: {
                size: 'small',
                error: !!fieldState.error,
                helperText: fieldState.error?.message,
              },
              openPickerButton: { color: 'primary' },
            }}
            openTo="year"
            views={['year', 'month', 'day']}
          />
        )} />

        <FormControl fullWidth size="small">
          <InputLabel>Fellowship</InputLabel>
          <Controller name={'fellowshipId' as any} control={control} render={({ field }) => (
            <Select {...field} label="Fellowship" value={field.value ?? ''}>
              <MenuItem value="">-- Select Fellowship --</MenuItem>
              {fellowships.map((f) => (<MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>))}
            </Select>
          )} />
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Level</InputLabel>
          <Select
            value={selectedLevel ?? ''}
            label="Level"
            onChange={(e: any) => {
              const v = e.target.value as string
              const nv = v || null
              setSelectedLevel(nv)
              if (nv === 'DIOCESE') { setValue('archdeaconryId', undefined); setValue('churchId', undefined) }
              if (nv === 'ARCHDEACONRY') { setValue('churchId', undefined) }
            }}
          >
            <MenuItem value="">-- Select Level --</MenuItem>
            {levels.map((l) => (<MenuItem key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</MenuItem>))}
          </Select>
        </FormControl>

        <Controller name="fellowshipPositionId" control={control} render={({ field }) => (
          <Autocomplete
            options={positions}
            getOptionLabel={(p: any) => ((p.title && p.title.name) || p.titleName) + ' — ' + ((p.fellowship && p.fellowship.name) || p.fellowshipName)}
            value={positions.find((p) => p.id === field.value) || null}
            onChange={(_, v) => field.onChange(v?.id ?? 0)}
            renderInput={(params) => <TextField {...params} label="Position" required size="small" />}
            sx={{ gridColumn: '1 / -1' }}
          />
        )} />

        {(selectedLevel === 'DIOCESE' || selectedLevel === 'ARCHDEACONRY' || selectedLevel === 'CHURCH') && (
          <FormControl fullWidth size="small">
            <InputLabel>Diocese</InputLabel>
            <Controller name="dioceseId" control={control} render={({ field }) => (
              <Select {...field} label="Diocese" value={field.value ?? ''}>
                <MenuItem value="">-- Select Diocese --</MenuItem>
                {dioceses.map(d => (<MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>))}
              </Select>
            )} />
          </FormControl>
        )}

        {(selectedLevel === 'ARCHDEACONRY' || selectedLevel === 'CHURCH') && (
          <FormControl fullWidth size="small">
            <InputLabel>Archdeaconry</InputLabel>
            <Controller name="archdeaconryId" control={control} render={({ field }) => (
              <Select {...field} label="Archdeaconry" value={field.value ?? ''}>
                <MenuItem value="">-- Select Archdeaconry --</MenuItem>
                {archdeaconries.map(a => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}
              </Select>
            )} />
          </FormControl>
        )}

        {selectedLevel === 'CHURCH' && (
          <FormControl fullWidth size="small" sx={{ gridColumn: '1 / -1' }}>
            <InputLabel>Church</InputLabel>
            <Controller name="churchId" control={control} render={({ field }) => (
              <Select {...field} label="Church" value={field.value ?? ''}>
                <MenuItem value="">-- Select Church --</MenuItem>
                {churches.map(c => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
              </Select>
            )} />
          </FormControl>
        )}

        <Controller name="termStartDateMonth" control={control} render={({ field }) => (
          <DatePicker
            label="Term Start"
            views={['year', 'month']}
            openTo="year"
            value={field.value ? dayjs(`${field.value}-01`) : null}
            onChange={(date) => field.onChange(date ? date.format('YYYY-MM') : '')}
            slotProps={{ textField: { size: 'small' } }}
          />
        )} />

        <Controller name="termEndDateMonth" control={control} render={({ field }) => (
          <DatePicker
            label="Term End"
            views={['year', 'month']}
            openTo="year"
            value={field.value ? dayjs(`${field.value}-01`) : null}
            onChange={(date) => field.onChange(date ? date.format('YYYY-MM') : '')}
            slotProps={{ textField: { size: 'small' } }}
          />
        )} />

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 0.5, gridColumn: '1 / -1' }}>
          <Button onClick={onCancel ?? (() => {})}>Cancel</Button>
          <Button type="submit" variant="contained">Create + Assign</Button>
        </Box>
      </Box>
    </LocalizationProvider>
  )
}

export default PersonAssignmentForm
