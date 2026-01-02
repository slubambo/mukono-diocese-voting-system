import React, { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Box, Button, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
// @ts-ignore dayjs module resolution without esModuleInterop
import dayjs from 'dayjs'
import type { CreateLeadershipAssignmentRequest, LeadershipAssignmentResponse } from '../../types/leadership'
import { leadershipApi } from '../../api/leadership.api'
import { fellowshipApi } from '../../api/fellowship.api'
import { fellowshipPositionApi } from '../../api/fellowshipPosition.api'
import { dioceseApi } from '../../api/diocese.api'
import { archdeaconryApi } from '../../api/archdeaconry.api'
import { churchApi } from '../../api/church.api'
import { useToast } from '../../components/feedback/ToastProvider'

interface Props {
  personId?: number
  assignment?: LeadershipAssignmentResponse | null
  onSaved?: () => void
  onCancel?: () => void
  initialLevel?: string | null
  onLevelChange?: (level: string | null) => void
}

const AssignmentForm: React.FC<Props> = ({ personId, assignment = null, onSaved, onCancel, initialLevel, onLevelChange }) => {
  const { addToast } = useToast()
  const [fellowships, setFellowships] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [dioceses, setDioceses] = useState<any[]>([])
  const [archdeaconries, setArchdeaconries] = useState<any[]>([])
  const [churches, setChurches] = useState<any[]>([])
  const [levels, setLevels] = useState<string[]>([])

  const { control, handleSubmit, reset, watch, setValue } = useForm<CreateLeadershipAssignmentRequest & { termStartDateMonth?: string; termEndDateMonth?: string }>({ defaultValues: { personId: personId ?? 0, fellowshipPositionId: 0, termStartDate: '', termEndDate: '' } })

  const [people, setPeople] = useState<any[]>([])
  const showPersonSelector = !personId

  useEffect(() => { if (showPersonSelector) { import('../../api/people.api').then(m => m.peopleApi.list({ page: 0, size: 1000 }).then(r => setPeople(r.content)).catch(() => {})) } }, [showPersonSelector])

  const watchedFellowship = watch('fellowshipId' as any) as number | undefined
  const watchedDiocese = watch('dioceseId') as number | undefined
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)

  useEffect(() => { fellowshipApi.list({ page: 0, size: 1000 }).then(r => setFellowships(r.content)).catch(() => {}) ; dioceseApi.list({ page: 0, size: 100 }).then(r => setDioceses(r.content)).catch(() => {}) ; leadershipApi.getLevels().then(lv => setLevels(lv)).catch(() => setLevels(['DIOCESE','ARCHDEACONRY','CHURCH'])) }, [])

  // if dioceses list contains only one, preselect it
  useEffect(() => {
    if (dioceses.length === 1) {
      const d = dioceses[0]
      setValue('dioceseId', d.id)
      archdeaconryApi.list({ dioceseId: d.id, page: 0, size: 1000 }).then(r => setArchdeaconries(r.content)).catch(() => {})
    }
  }, [dioceses, setValue])

  

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
    if (assignment) {
      // prefill
      const startMonth = assignment.termStartDate ? assignment.termStartDate.slice(0,7) : ''
      const endMonth = assignment.termEndDate ? assignment.termEndDate.slice(0,7) : ''
      reset({ personId: assignment.person.id, fellowshipPositionId: assignment.fellowshipPosition?.id ?? assignment.fellowshipPositionId, termStartDate: assignment.termStartDate ?? '', termEndDate: assignment.termEndDate ?? '' })
      setValue('termStartDateMonth', startMonth)
      setValue('termEndDateMonth', endMonth)
      if (assignment.diocese?.id) setValue('dioceseId', assignment.diocese.id)
      if (assignment.archdeaconry?.id) setValue('archdeaconryId', assignment.archdeaconry.id)
      if (assignment.church?.id) setValue('churchId', assignment.church.id)
      // load positions for fellowship
      const fid = (assignment.fellowshipPosition as any)?.fellowshipId ?? assignment.fellowship?.id
      if (fid) fellowshipPositionApi.list({ fellowshipId: fid, page: 0, size: 1000 }).then(r => setPositions(r.content)).catch(() => {})
    } else if (personId) {
      reset({ personId, fellowshipPositionId: 0, termStartDate: '', termEndDate: '' })
    }
  }, [assignment, personId, reset, setValue])

  useEffect(() => {
    if (initialLevel !== undefined) setSelectedLevel(initialLevel)
  }, [initialLevel])

  useEffect(() => {
    // load churches when archdeaconry changes
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
      // month fields
      if (data.termStartDateMonth) payload.termStartDate = `${data.termStartDateMonth}-01`
      if (data.termEndDateMonth) {
        const [y, m] = data.termEndDateMonth.split('-').map((s: string) => parseInt(s,10))
        const last = new Date(y, m, 0)
        payload.termEndDate = `${y}-${String(m).padStart(2,'0')}-${String(last.getDate()).padStart(2,'0')}`
      }
      // ensure position exists and shape payload according to scope
      const pos = positions.find(p => p.id === payload.fellowshipPositionId)
      if (!pos) { addToast('Select a valid position', 'error'); return }
      const scope = pos.scope
      // Backend expects only the single target id for the scope:
      // - DIOCESE => send only dioceseId
      // - ARCHDEACONRY => send only archdeaconryId
      // - CHURCH => send only churchId
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
      // construct final payload with only allowed fields per backend expectations
      const finalPayload: any = {
        personId: Number(payload.personId),
        fellowshipPositionId: Number(payload.fellowshipPositionId),
        termStartDate: payload.termStartDate,
        termEndDate: payload.termEndDate,
        notes: payload.notes ?? undefined,
      }
      if (scope === 'DIOCESE') finalPayload.dioceseId = Number(payload.dioceseId)
      if (scope === 'ARCHDEACONRY') finalPayload.archdeaconryId = Number(payload.archdeaconryId)
      if (scope === 'CHURCH') finalPayload.churchId = Number(payload.churchId)

      // notify parent of level selection if provided
      if (onLevelChange) onLevelChange(selectedLevel)
      if (assignment) {
        await leadershipApi.update(assignment.id, finalPayload)
        addToast('Assignment updated', 'success')
      } else {
        await leadershipApi.create(finalPayload)
        addToast('Assignment created', 'success')
      }
      if (onSaved) onSaved()
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Failed to save assignment', 'error')
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box component="form" onSubmit={handleSubmit(submit)} sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {showPersonSelector && (
          <Controller name="personId" control={control} render={({ field }) => (
            <Autocomplete options={people} getOptionLabel={(p: any) => p.fullName} onChange={(_, v) => field.onChange(v?.id ?? 0)} renderInput={(params) => <TextField {...params} label="Person" required size="small" />} sx={{ gridColumn: '1 / -1' }} />
          )} />
        )}

        <FormControl fullWidth size="small">
          <InputLabel>Fellowship</InputLabel>
          <Controller name={"fellowshipId" as any} control={control} render={({ field }) => (
            <Select {...field} label="Fellowship">
              <MenuItem value="">-- Select Fellowship --</MenuItem>
              {fellowships.map((f) => (<MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>))}
            </Select>
          )} />
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Level</InputLabel>
          <Select value={selectedLevel ?? ''} label="Level" onChange={(e: any) => { const v = e.target.value as string; const nv = v || null; setSelectedLevel(nv); if (onLevelChange) onLevelChange(nv); if (nv === 'DIOCESE') { setValue('archdeaconryId', undefined); setValue('churchId', undefined); } if (nv === 'ARCHDEACONRY') { setValue('churchId', undefined); } }}>
            <MenuItem value="">-- Select Level --</MenuItem>
            {levels.map((l) => (<MenuItem key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</MenuItem>))}
          </Select>
        </FormControl>

        <Controller name="fellowshipPositionId" control={control} render={({ field }) => (
          <Autocomplete
            options={positions}
            getOptionLabel={(p: any) => ((p.title && p.title.name) || p.titleName) + ' — ' + ((p.fellowship && p.fellowship.name) || p.fellowshipName)}
            onChange={(_, v) => field.onChange(v?.id ?? 0)}
            renderInput={(params) => <TextField {...params} label="Position" required size="small" />}
            sx={{ gridColumn: '1 / -1' }}
          />
        )} />

        {(selectedLevel === 'DIOCESE' || selectedLevel === 'ARCHDEACONRY' || selectedLevel === 'CHURCH') && (
          <FormControl fullWidth size="small">
            <InputLabel>Diocese</InputLabel>
            <Controller name="dioceseId" control={control} render={({ field }) => (
              <Select {...field} label="Diocese">
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
              <Select {...field} label="Archdeaconry">
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
              <Select {...field} label="Church">
                <MenuItem value="">-- Select Church --</MenuItem>
                {churches.map(c => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
              </Select>
            )} />
          </FormControl>
        )}

        <Controller name="termStartDateMonth" control={control} render={({ field }) => (
          <DatePicker
            label="Term Start"
            views={["year","month"]}
            openTo="year"
            value={field.value ? dayjs(`${field.value}-01`) : null}
            onChange={(date) => field.onChange(date ? date.format('YYYY-MM') : '')}
            slotProps={{ textField: { size: 'small' } }}
          />
        )} />

        <Controller name="termEndDateMonth" control={control} render={({ field }) => (
          <DatePicker
            label="Term End"
            views={["year","month"]}
            openTo="year"
            value={field.value ? dayjs(`${field.value}-01`) : null}
            onChange={(date) => field.onChange(date ? date.format('YYYY-MM') : '')}
            slotProps={{ textField: { size: 'small' } }}
          />
        )} />

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 0.5, gridColumn: '1 / -1' }}>
          <Button onClick={onCancel ?? (() => {})}>Cancel</Button>
          <Button type="submit" variant="contained">{assignment ? 'Save' : 'Assign'}</Button>
        </Box>
      </Box>
    </LocalizationProvider>
  )
}

export default AssignmentForm
