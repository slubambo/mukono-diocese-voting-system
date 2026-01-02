import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Checkbox, FormControlLabel, Typography, Divider, Tooltip, Chip } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser'
import CloseIcon from '@mui/icons-material/Close'
import CancelIcon from '@mui/icons-material/Cancel'
import RestoreIcon from '@mui/icons-material/Restore'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import { electionApi } from '../../api/election.api'
import { useToast } from '../feedback/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../api/errorHandler'
import type { Position, VotingPeriod, VotingPeriodPositionsMapResponse, VotingPeriodPositionsResponse } from '../../types/election'

const VotingPeriodsTab: React.FC<{ electionId: string; electionStart?: string | null; electionEnd?: string | null }> = ({ electionId, electionStart, electionEnd }) => {
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<VotingPeriod[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<VotingPeriod | null>(null)
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [positions, setPositions] = useState<Position[]>([])
  const [assigned, setAssigned] = useState<number[]>([])
  const [assignedByPeriod, setAssignedByPeriod] = useState<Record<string, number[]>>({})
  const [positionToPeriod, setPositionToPeriod] = useState<Record<number, string>>({})
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lifecycleAction, setLifecycleAction] = useState<'open' | 'close' | 'cancel' | 'reactivate' | null>(null)
  const [lifecyclePeriod, setLifecyclePeriod] = useState<VotingPeriod | null>(null)
  const [electionWindow, setElectionWindow] = useState<{ start?: string; end?: string }>({})
  const originalValuesRef = useRef<{ name?: string; start?: string; end?: string }>({})
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; startTime?: string; endTime?: string }>({})
  const toast = useToast()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await electionApi.listVotingPeriods(electionId)
      const data = (res as any)?.content ?? res ?? []
      setPeriods(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load voting periods')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [electionId])

  const loadAssignments = async () => {
    try {
      const res: VotingPeriodPositionsMapResponse = await electionApi.getVotingPeriodPositionsMap(electionId)
      const byPeriod: Record<string, number[]> = {}
      const posMap: Record<number, string> = {}
      ;(res.periods || []).forEach((entry) => {
        const id = String(entry.votingPeriodId)
        const ids = entry.electionPositionIds || []
        byPeriod[id] = ids
        ids.forEach((pid) => {
          posMap[pid] = id
        })
      })
      setAssignedByPeriod(byPeriod)
      setPositionToPeriod(posMap)
    } catch (err) {
      setAssignedByPeriod({})
      setPositionToPeriod({})
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [electionId])

  useEffect(() => {
    const loadElection = async () => {
      try {
        const res = await electionApi.get(electionId)
        const start = (res as any)?.votingStartAt || (res as any)?.termStartDate
        const end = (res as any)?.votingEndAt || (res as any)?.termEndDate
        setElectionWindow({ start, end })
      } catch (err) {
        setElectionWindow({})
      }
    }
    loadElection()
  }, [electionId])

  const openDialog = (p?: VotingPeriod) => {
    setEditing(p ?? null)
    setName(p?.name ?? '')
    setStartTime(p?.startTime ?? '')
    setEndTime(p?.endTime ?? '')
    setFieldErrors({})
    if (!p) setAssigned([])
    setShowDialog(true)
  }

  const formatLocalDateTime = (value?: string | null) => {
    if (!value) return ''
    const dt = new Date(value)
    if (Number.isNaN(dt.getTime())) return ''
    const pad = (num: number) => String(num).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  }

  useEffect(() => {
    const loadPositions = async () => {
      if (!showDialog) return
      setLoadingPositions(true)
      try {
        const res = await electionApi.listPositions(electionId)
        const data: Position[] = Array.isArray((res as any)?.content) ? (res as any).content : (res as any)
        setPositions(data || [])
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load election positions')
        setPositions([])
      } finally {
        setLoadingPositions(false)
      }
    }
    loadPositions()
  }, [electionId, showDialog, toast])

  useEffect(() => {
    const loadAssigned = async () => {
      if (!showDialog) return
      if (!editing?.id) {
        setAssigned([])
        return
      }
      try {
        const res: VotingPeriodPositionsResponse = await electionApi.getVotingPeriodPositions(electionId, editing.id)
        setAssigned(res.electionPositionIds || [])
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load voting period positions')
        setAssigned([])
      }
    }
    loadAssigned()
  }, [electionId, editing, showDialog, toast])

  useEffect(() => {
    if (!showDialog || !editing) return
    const startLocal = formatLocalDateTime(editing.startTime)
    const endLocal = formatLocalDateTime(editing.endTime)
    setStartTime(startLocal)
    setEndTime(endLocal)
    originalValuesRef.current = { name: editing.name ?? '', start: startLocal, end: endLocal }
  }, [editing, showDialog])

  const submit = async () => {
    if (saving) return
    const nextErrors: { name?: string; startTime?: string; endTime?: string } = {}
    if (!name.trim()) nextErrors.name = 'Name is required'
    if (!startTime.trim()) nextErrors.startTime = 'Start time is required'
    if (!endTime.trim()) nextErrors.endTime = 'End time is required'
    if (assigned.length === 0) {
      toast.error('Select at least one position for this voting day')
      return
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }
    const toIsoOrUndefined = (value?: string) => {
      if (!value?.trim()) return undefined
      const dt = new Date(value)
      if (Number.isNaN(dt.getTime())) return undefined
      return dt.toISOString()
    }
    const startIso = toIsoOrUndefined(startTime)
    const endIso = toIsoOrUndefined(endTime)
    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      toast.error('Voting period end time must be after start time')
      return
    }
    if (electionWindow.start && startIso && new Date(startIso) < new Date(electionWindow.start)) {
      toast.error('Voting period start must be within the election window')
      return
    }
    if (electionWindow.end && endIso && new Date(endIso) > new Date(electionWindow.end)) {
      toast.error('Voting period end must be within the election window')
      return
    }
    try {
      setSaving(true)
      const payload = {
        name,
        startTime: startIso,
        endTime: endIso,
      }
      let targetId = editing?.id
      if (editing?.id) {
        const original = originalValuesRef.current
        const hasChanges = original.name !== name || original.start !== startTime || original.end !== endTime
        if (hasChanges) {
          await electionApi.updateVotingPeriod(electionId, editing.id, payload)
          toast.success('Voting period updated')
        }
      } else {
        const created = await electionApi.createVotingPeriod(electionId, payload)
        targetId = (created as any)?.id
        toast.success('Voting period created')
      }
      if (targetId !== undefined && targetId !== null) {
        await electionApi.assignVotingPeriodPositions(electionId, targetId, { electionPositionIds: assigned })
      }
      setShowDialog(false)
      fetch()
      loadAssignments()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to save voting period')
    } finally {
      setSaving(false)
    }
  }

  const doLifecycle = async () => {
    if (!lifecycleAction || !lifecyclePeriod) return
    try {
      if (lifecycleAction === 'open') await electionApi.openVotingPeriod(electionId, lifecyclePeriod.id)
      if (lifecycleAction === 'close') await electionApi.closeVotingPeriod(electionId, lifecyclePeriod.id)
      if (lifecycleAction === 'cancel') await electionApi.cancelVotingPeriod(electionId, lifecyclePeriod.id)
      if (lifecycleAction === 'reactivate') await electionApi.reactivateVotingPeriod(electionId, lifecyclePeriod.id)
      const action = lifecycleAction === 'reactivate' ? 'reactivated' : `${lifecycleAction}ed`
      toast.success(`Voting period ${action}`)
      fetch()
      loadAssignments()
      setLifecycleAction(null)
      setLifecyclePeriod(null)
    } catch (err: any) {
      const action = lifecycleAction === 'reactivate' ? 'reactivate' : lifecycleAction
      toast.error(getErrorMessage(err) || `Failed to ${action} voting period`)
    }
  }

  if (loading) return <LoadingState />

  const calcDuration = (start?: string, end?: string): string => {
    if (!start || !end) return '—'
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    if (Number.isNaN(s) || Number.isNaN(e)) return '—'
    const ms = e - s
    const hours = ms / (1000 * 60 * 60)
    if (hours < 24) return `${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'}`
    const days = Math.round(hours / 24)
    return `${days} day${days === 1 ? '' : 's'}`
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        {isAdmin && <Button startIcon={<AddIcon />} variant="contained" onClick={() => openDialog()}>Create Voting Day</Button>}
      </Box>

      {periods.length === 0 ? (
        <EmptyState title="No voting days" description="No voting days have been created for this election." action={isAdmin ? <Button onClick={() => openDialog()}>Create Voting Day</Button> : undefined} />
      ) : (
        <Paper sx={{ width: '100%', borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
          <TableContainer>
            <Table size="small" sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.08)', fontWeight: 700 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Start – End</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Positions</TableCell>
                  {isAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.map(p => (
                  <TableRow key={String(p.id)} hover>
                    <TableCell><Typography variant="body2">{p.name || p.label}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {p.startTime && p.endTime
                          ? `${new Date(p.startTime).toLocaleString()} – ${new Date(p.endTime).toLocaleString()}`
                          : p.startTime
                            ? new Date(p.startTime).toLocaleString()
                            : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{calcDuration(p.startTime, p.endTime)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.status || 'PENDING'}
                        size="small"
                        color={p.status === 'OPEN' ? 'success' : p.status === 'CANCELLED' ? 'error' : 'default'}
                        variant={p.status === 'DRAFT' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell align="right"><Typography variant="body2">{p.positionsCount ?? assignedByPeriod[String(p.id)]?.length ?? 0}</Typography></TableCell>
                    {isAdmin && (
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title={p.status === 'CLOSED' ? 'Closed periods cannot be edited' : 'Edit'}>
                          <span>
                            <IconButton size="small" color="primary" onClick={() => openDialog(p)} disabled={p.status === 'CLOSED'}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {p.status !== 'CANCELLED' && (
                          <>
                            <Tooltip title={p.status !== 'SCHEDULED' ? 'Only scheduled periods can be opened' : 'Open'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => { setLifecycleAction('open'); setLifecyclePeriod(p) }}
                                  disabled={p.status !== 'SCHEDULED'}
                                >
                                  <OpenInBrowserIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={!(p.status === 'SCHEDULED' || p.status === 'OPEN') ? 'Only scheduled or open periods can be closed' : 'Close'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => { setLifecycleAction('close'); setLifecyclePeriod(p) }}
                                  disabled={!(p.status === 'SCHEDULED' || p.status === 'OPEN')}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={p.status !== 'SCHEDULED' ? 'Only scheduled periods can be cancelled' : 'Cancel'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => { setLifecycleAction('cancel'); setLifecyclePeriod(p) }}
                                  disabled={p.status !== 'SCHEDULED'}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                        {p.status === 'CANCELLED' && (
                          <Tooltip title="Reactivate">
                            <IconButton size="small" color="info" onClick={() => { setLifecycleAction('reactivate'); setLifecyclePeriod(p) }}><RestoreIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={showDialog} onClose={() => setShowDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Voting Day' : 'Create Voting Day'}</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'grid', gap: 1.5, mt: 2 }}>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors((prev) => ({ ...prev, name: undefined })) }}
                fullWidth
                required
                size="small"
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name}
              />
              <DateTimePicker
                label="Start Time"
                value={startTime ? dayjs(startTime) : null}
                onChange={(v) => {
                  setStartTime(v ? v.toISOString() : '')
                  setFieldErrors((prev) => ({ ...prev, startTime: undefined }))
                }}
                minDateTime={electionStart ? dayjs(electionStart) : undefined}
                maxDateTime={electionEnd ? dayjs(electionEnd) : undefined}
                slotProps={{ textField: { fullWidth: true, size: 'small', error: Boolean(fieldErrors.startTime), helperText: fieldErrors.startTime } }}
              />
              <DateTimePicker
                label="End Time"
                value={endTime ? dayjs(endTime) : null}
                onChange={(v) => {
                  setEndTime(v ? v.toISOString() : '')
                  setFieldErrors((prev) => ({ ...prev, endTime: undefined }))
                }}
                minDateTime={startTime ? dayjs(startTime).add(3, 'hours') : (electionStart ? dayjs(electionStart) : undefined)}
                maxDateTime={electionEnd ? dayjs(electionEnd) : undefined}
                slotProps={{ textField: { fullWidth: true, size: 'small', error: Boolean(fieldErrors.endTime), helperText: fieldErrors.endTime } }}
              />
              <Divider />
              <Typography variant="subtitle2">Positions for this voting period</Typography>
              {loadingPositions ? (
                <Typography variant="body2">Loading positions...</Typography>
              ) : positions.length === 0 ? (
                <Typography variant="body2">No positions available for this election.</Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 1 }}>
                {Object.entries(
                  positions.reduce<Record<string, Position[]>>((acc, pos) => {
                    const name = pos.fellowshipPosition?.fellowshipName || 'Other'
                    acc[name] = acc[name] || []
                    acc[name].push(pos)
                    return acc
                  }, {})
                ).map(([fellowshipName, items]) => (
                  <Box key={fellowshipName}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{fellowshipName}</Typography>
                    {items.map((pos) => {
                      const id = Number(pos.id)
                      const assignedElsewhere = Boolean(positionToPeriod[id] && positionToPeriod[id] !== String(editing?.id ?? ''))
                      const checked = assigned.includes(id)
                      const fellowshipLabel = pos.fellowshipPosition?.fellowshipName ? ` — ${pos.fellowshipPosition.fellowshipName}` : ''
                      const label = `${pos.fellowshipPosition?.titleName || pos.title || 'Position'}${fellowshipLabel} (${pos.seats ?? 1} seat${(pos.seats ?? 1) === 1 ? '' : 's'})`
                      return (
                        <Tooltip
                          key={id}
                          title={assignedElsewhere ? `Assigned to period #${positionToPeriod[id]}` : ''}
                          disableHoverListener={!assignedElsewhere}
                        >
                          <FormControlLabel
                            control={<Checkbox
                              checked={checked}
                              disabled={assignedElsewhere}
                              onChange={() => {
                                setAssigned((prev) => (
                                  prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
                                ))
                              }}
                            />}
                            label={label}
                          />
                        </Tooltip>
                      )
                    })}
                  </Box>
                ))}
              </Box>
            )}
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={saving || assigned.length === 0}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(lifecycleAction)} onClose={() => { setLifecycleAction(null); setLifecyclePeriod(null) }}>
        <DialogTitle>{lifecycleAction ? `${lifecycleAction.toUpperCase()} Voting Day` : 'Voting Day'}</DialogTitle>
        <DialogContent>
          {lifecyclePeriod ? `Are you sure you want to ${lifecycleAction} "${lifecyclePeriod.name || lifecyclePeriod.label || 'this period'}"?` : ''}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setLifecycleAction(null); setLifecyclePeriod(null) }}>Cancel</Button>
          <Button variant="contained" onClick={doLifecycle}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VotingPeriodsTab
