import React, { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Checkbox, FormControlLabel, Typography, Divider, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser'
import CloseIcon from '@mui/icons-material/Close'
import CancelIcon from '@mui/icons-material/Cancel'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import { electionApi } from '../../api/election.api'
import { useToast } from '../feedback/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import type { Position, VotingPeriod, VotingPeriodPositionsResponse } from '../../types/election'

const VotingPeriodsTab: React.FC<{ electionId: string }> = ({ electionId }) => {
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
  const [lifecycleAction, setLifecycleAction] = useState<'open' | 'close' | 'cancel' | null>(null)
  const [lifecyclePeriod, setLifecyclePeriod] = useState<VotingPeriod | null>(null)
  const [electionWindow, setElectionWindow] = useState<{ start?: string; end?: string }>({})
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

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const res = await electionApi.listVotingPeriods(electionId)
        const data = (res as any)?.content ?? res ?? []
        const list = Array.isArray(data) ? data : []
        const entries = await Promise.all(
          list.map(async (p: any) => {
            try {
              const positionsRes = await electionApi.getVotingPeriodPositions(electionId, p.id)
              return { id: String(p.id), positionIds: positionsRes.electionPositionIds || [] }
            } catch (err) {
              return { id: String(p.id), positionIds: [] }
            }
          })
        )
        const byPeriod: Record<string, number[]> = {}
        const posMap: Record<number, string> = {}
        entries.forEach((entry) => {
          byPeriod[entry.id] = entry.positionIds
          entry.positionIds.forEach((pid) => {
            posMap[pid] = entry.id
          })
        })
        setAssignedByPeriod(byPeriod)
        setPositionToPeriod(posMap)
      } catch (err) {
        setAssignedByPeriod({})
        setPositionToPeriod({})
      }
    }
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
    setStartTime(formatLocalDateTime(editing.startTime))
    setEndTime(formatLocalDateTime(editing.endTime))
  }, [editing, showDialog])

  const submit = async () => {
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
      const payload = {
        name,
        startTime: startIso,
        endTime: endIso,
      }
      let targetId = editing?.id
      if (editing?.id) {
        await electionApi.updateVotingPeriod(electionId, editing.id, payload)
        toast.success('Voting period updated')
      } else {
        const created = await electionApi.createVotingPeriod(electionId, payload)
        targetId = (created as any)?.id
        toast.success('Voting period created')
      }
      if (targetId) {
        await electionApi.assignVotingPeriodPositions(electionId, targetId, { electionPositionIds: assigned })
      }
      setShowDialog(false)
      fetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save voting period')
    }
  }

  const doLifecycle = async () => {
    if (!lifecycleAction || !lifecyclePeriod) return
    try {
      if (lifecycleAction === 'open') await electionApi.openVotingPeriod(electionId, lifecyclePeriod.id)
      if (lifecycleAction === 'close') await electionApi.closeVotingPeriod(electionId, lifecyclePeriod.id)
      if (lifecycleAction === 'cancel') await electionApi.cancelVotingPeriod(electionId, lifecyclePeriod.id)
      toast.success(`Voting period ${lifecycleAction}ed`)
      fetch()
      setLifecycleAction(null)
      setLifecyclePeriod(null)
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${lifecycleAction} voting period`)
    }
  }

  if (loading) return <LoadingState />

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        {isAdmin && <Button startIcon={<AddIcon />} variant="contained" onClick={() => openDialog()}>Create Voting Period</Button>}
      </Box>

      {periods.length === 0 ? (
        <EmptyState title="No voting periods" description="No voting periods have been created for this election." action={isAdmin ? <Button onClick={() => openDialog()}>Create Voting Period</Button> : undefined} />
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Positions</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.map(p => (
                  <TableRow key={String(p.id)} hover>
                    <TableCell>{p.name || p.label}</TableCell>
                    <TableCell>{p.startTime ? new Date(p.startTime).toLocaleString() : '—'}</TableCell>
                    <TableCell>{p.endTime ? new Date(p.endTime).toLocaleString() : '—'}</TableCell>
                    <TableCell>{p.status || '—'}</TableCell>
                    <TableCell align="right">{assignedByPeriod[String(p.id)]?.length ?? 0}</TableCell>
                    <TableCell align="right">
                      {isAdmin && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openDialog(p)}><EditIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="Open">
                            <IconButton size="small" onClick={() => { setLifecycleAction('open'); setLifecyclePeriod(p) }}><OpenInBrowserIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="Close">
                            <IconButton size="small" onClick={() => { setLifecycleAction('close'); setLifecyclePeriod(p) }}><CloseIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton size="small" onClick={() => { setLifecycleAction('cancel'); setLifecyclePeriod(p) }}><CancelIcon /></IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={showDialog} onClose={() => setShowDialog(false)} fullWidth>
        <DialogTitle>{editing ? 'Edit Voting Period' : 'Create Voting Period'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField
              label="Start Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: electionWindow.start ? formatLocalDateTime(electionWindow.start) : undefined, max: electionWindow.end ? formatLocalDateTime(electionWindow.end) : undefined }}
              helperText={electionWindow.start && electionWindow.end ? `Must be within ${new Date(electionWindow.start).toLocaleString()} — ${new Date(electionWindow.end).toLocaleString()}` : undefined}
            />
            <TextField
              label="End Time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: electionWindow.start ? formatLocalDateTime(electionWindow.start) : undefined, max: electionWindow.end ? formatLocalDateTime(electionWindow.end) : undefined }}
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
                        <FormControlLabel
                          key={id}
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
                      )
                    })}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(lifecycleAction)} onClose={() => { setLifecycleAction(null); setLifecyclePeriod(null) }}>
        <DialogTitle>{lifecycleAction ? `${lifecycleAction.toUpperCase()} Voting Period` : 'Voting Period'}</DialogTitle>
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
