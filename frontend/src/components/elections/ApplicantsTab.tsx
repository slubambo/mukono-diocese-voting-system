import React, { useEffect, useMemo, useState } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Tabs, Tab, IconButton, MenuItem, Tooltip, Autocomplete, CircularProgress, Typography, Chip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import UndoIcon from '@mui/icons-material/Undo'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import StatusChip from '../common/StatusChip'
import { electionApi } from '../../api/election.api'
import { peopleApi } from '../../api/people.api'
import { useToast } from '../feedback/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import type { Applicant, Position } from '../../types/election'
import type { PersonResponse } from '../../types/leadership'

const ApplicantsTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [manualPersonId, setManualPersonId] = useState('')
  const [manualPositionId, setManualPositionId] = useState('')
  const [manualNotes, setManualNotes] = useState('')
  const [selectedFellowshipId, setSelectedFellowshipId] = useState('')
  const [positions, setPositions] = useState<Position[]>([])
  const [peopleOptions, setPeopleOptions] = useState<PersonResponse[]>([])
  const [peopleQuery, setPeopleQuery] = useState('')
  const [peopleLoading, setPeopleLoading] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<PersonResponse | null>(null)
  const [decisionOpen, setDecisionOpen] = useState(false)
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | 'revert' | 'withdraw' | null>(null)
  const [decisionApplicant, setDecisionApplicant] = useState<Applicant | null>(null)
  const [decisionBy, setDecisionBy] = useState('')
  const [decisionNotes, setDecisionNotes] = useState('')
  const toast = useToast()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await electionApi.listApplicants(electionId)
      const data = (res as any)?.content ?? []
      setApplicants(data)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load applicants')
    } finally {
      setLoading(false)
    }
  }

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await electionApi.listPendingApplicants(electionId)
      // normalize paged or array responses
      const data = (res as any)?.content ?? res
      setApplicants(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load pending applicants')
    } finally {
      setLoading(false)
    }
  }

  const fetchCount = async () => {
    try {
      const c = await electionApi.countApplicants(electionId)
      setCount(Number(c) || 0)
    } catch (err: any) {
      // non-critical
    }
  }

  useEffect(() => { fetchCount(); fetchAll() }, [electionId])

  useEffect(() => { if (tab === 0) fetchPending(); else fetchAll() }, [tab])

  useEffect(() => {
    const loadPositions = async () => {
      try {
        const res = await electionApi.listPositions(electionId)
        const data: Position[] = Array.isArray((res as any)?.content) ? (res as any).content : (res as any)
        const sorted = [...(data || [])].sort((a, b) => {
          const labelA = `${a.fellowshipPosition?.titleName || a.title || a.positionId || ''} ${a.fellowshipPosition?.fellowshipName || ''}`.trim()
          const labelB = `${b.fellowshipPosition?.titleName || b.title || b.positionId || ''} ${b.fellowshipPosition?.fellowshipName || ''}`.trim()
          return labelA.localeCompare(labelB)
        })
        setPositions(sorted)
      } catch (err) {
        setPositions([])
      }
    }
    loadPositions()
  }, [electionId])

  useEffect(() => {
    setManualPositionId('')
  }, [selectedFellowshipId])

  useEffect(() => {
    if (!showManual) return
    const handle = setTimeout(async () => {
      setPeopleLoading(true)
      try {
        const res = await peopleApi.list({ q: peopleQuery, page: 0, size: 20 })
        const sorted = [...(res.content || [])].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))
        setPeopleOptions(sorted)
      } catch (err) {
        setPeopleOptions([])
      } finally {
        setPeopleLoading(false)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [peopleQuery, showManual])

  const groupedApplicants = useMemo(() => {
    const groups = applicants.reduce<Record<string, Applicant[]>>((acc, a) => {
      const key = a.fellowshipName || a.fellowshipPosition?.fellowshipName || 'Other'
      acc[key] = acc[key] || []
      acc[key].push(a)
      return acc
    }, {})
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [applicants])

  const fellowshipOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    positions.forEach((p) => {
      const id = String(p.fellowshipPosition?.fellowshipId ?? p.fellowshipId ?? 'other')
      const name = p.fellowshipPosition?.fellowshipName || p.fellowshipName || 'Other'
      map.set(id, { id, name })
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [positions])

  const filteredPositions = useMemo(() => {
    if (!selectedFellowshipId) return []
    return positions.filter((p) => {
      const id = String(p.fellowshipPosition?.fellowshipId ?? p.fellowshipId ?? 'other')
      return id === selectedFellowshipId
    })
  }, [positions, selectedFellowshipId])

  const openDecision = (action: 'approve' | 'reject' | 'revert' | 'withdraw', applicant: Applicant) => {
    if (!isAdmin) return
    setDecisionAction(action)
    setDecisionApplicant(applicant)
    setDecisionBy(user?.username || '')
    setDecisionNotes('')
    setDecisionOpen(true)
  }

  const submitDecision = async () => {
    if (!decisionAction || !decisionApplicant) return
    if (!decisionBy.trim()) {
      toast.error('Decision by is required')
      return
    }
    try {
      const payload = { decisionBy: decisionBy.trim(), notes: decisionNotes.trim() || undefined }
      if (decisionAction === 'approve') await electionApi.approveApplicant(electionId, decisionApplicant.id, payload)
      if (decisionAction === 'reject') await electionApi.rejectApplicant(electionId, decisionApplicant.id, payload)
      if (decisionAction === 'revert') await electionApi.revertApplicant(electionId, decisionApplicant.id, payload)
      if (decisionAction === 'withdraw') await electionApi.withdrawApplicant(electionId, decisionApplicant.id, payload)
      toast.success('Action completed')
      setDecisionOpen(false)
      // refresh
      if (tab === 0) fetchPending(); else fetchAll()
      fetchCount()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to perform action')
    }
  }

  const submitManual = async () => {
    const personId = selectedPerson?.id || Number(manualPersonId)
    const electionPositionId = Number(manualPositionId)
    if (!personId || !electionPositionId) {
      toast.error('Person and position are required')
      return
    }
    try {
      await electionApi.manualApplicant(electionId, {
        personId,
        electionPositionId,
        notes: manualNotes.trim() || undefined,
      })
      toast.success('Applicant created')
      setShowManual(false)
      setManualPersonId('')
      setManualPositionId('')
      setManualNotes('')
      fetchAll(); fetchCount()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create applicant')
    }
  }

  if (loading) return <LoadingState />

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Pending`} />
          <Tab label={`All${count !== null ? ` (${count})` : ''}`} />
        </Tabs>
        {isAdmin && <Button variant="contained" onClick={() => { setSelectedPerson(null); setManualPersonId(''); setManualPositionId(''); setManualNotes(''); setSelectedFellowshipId(''); setShowManual(true) }}>Add Applicant</Button>}
      </Box>

      {applicants.length === 0 ? (
        <EmptyState title="No applicants" description="There are no applicants to display." action={isAdmin ? <Button onClick={() => { setSelectedPerson(null); setManualPersonId(''); setManualPositionId(''); setManualNotes(''); setSelectedFellowshipId(''); setShowManual(true) }}>Add Applicant</Button> : undefined} />
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', lg: 'repeat(auto-fit, minmax(420px, 1fr))' } }}>
          {groupedApplicants.map(([fellowship, items]) => (
            <Paper key={fellowship} sx={{ border: '1px solid rgba(88, 28, 135, 0.1)', borderRadius: 1.5, p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{fellowship}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{items.length} applicant{items.length === 1 ? '' : 's'}</Typography>
                </Box>
                <Chip size="small" label="Grouped by fellowship" sx={{ backgroundColor: 'rgba(88, 28, 135, 0.08)', color: 'primary.main', fontWeight: 600 }} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: 'rgba(88, 28, 135, 0.06)' }}>
                    <TableRow>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>Person</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>Position</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>Status</Typography></TableCell>
                      {isAdmin && <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>Actions</Typography></TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map(a => (
                      <TableRow key={a.id} hover>
                        <TableCell><Typography variant="body2">{a.person?.fullName || a.personName || '—'}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {a.positionTitle || a.fellowshipPosition?.titleName || '—'}
                            {a.fellowshipName ? ` — ${a.fellowshipName}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            status={(a.status || 'pending') as any}
                            size="small"
                            sx={{ fontWeight: 500, fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 0.75 } }}
                          />
                        </TableCell>
                        {isAdmin && <TableCell align="right">
                          {(() => {
                            const status = (a.status || '').toUpperCase()
                            const canApprove = status === 'PENDING' || status === 'REVERTED'
                            const canReject = status === 'PENDING' || status === 'REVERTED'
                            const canRevert = status === 'APPROVED' || status === 'REJECTED' || status === 'WITHDRAWN'
                            const canWithdraw = status === 'PENDING' || status === 'APPROVED'
                            return (
                              <>
                                <Tooltip title={canApprove ? 'Approve' : 'Already approved'}>
                                  <span>
                                    <IconButton size="small" color={canApprove ? 'success' : 'inherit'} disabled={!canApprove} onClick={() => openDecision('approve', a)}><CheckIcon /></IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title={canReject ? 'Reject' : 'Already rejected'}>
                                  <span>
                                    <IconButton size="small" color={canReject ? 'error' : 'inherit'} disabled={!canReject} onClick={() => openDecision('reject', a)}><CloseIcon /></IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title={canRevert ? 'Revert decision' : 'No decision to revert'}>
                                  <span>
                                    <IconButton size="small" color={canRevert ? 'info' : 'inherit'} disabled={!canRevert} onClick={() => openDecision('revert', a)}><RotateLeftIcon /></IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title={canWithdraw ? 'Withdraw' : 'Already withdrawn'}>
                                  <span>
                                    <IconButton size="small" color={canWithdraw ? 'warning' : 'inherit'} disabled={!canWithdraw} onClick={() => openDecision('withdraw', a)}><UndoIcon /></IconButton>
                                  </span>
                                </Tooltip>
                              </>
                            )
                          })()}
                        </TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={showManual} onClose={() => setShowManual(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Applicant</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr)', gap: 1.5, mt: 1 }}>
            <TextField
              select
              label="Fellowship"
              fullWidth
              value={selectedFellowshipId}
              onChange={(e) => setSelectedFellowshipId(e.target.value)}
              size="small"
            >
              <MenuItem value="">Select fellowship</MenuItem>
              {fellowshipOptions.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Election Position"
              fullWidth
              value={manualPositionId}
              onChange={(e) => setManualPositionId(e.target.value)}
              size="small"
              disabled={!selectedFellowshipId}
            >
              {filteredPositions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {(p.fellowshipPosition?.titleName || p.title || p.positionId)}
                  {p.fellowshipPosition?.fellowshipName ? ` — ${p.fellowshipPosition.fellowshipName}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              options={peopleOptions}
              loading={peopleLoading}
              value={selectedPerson}
              onChange={(_, val) => { setSelectedPerson(val); if (val) setManualPersonId(String(val.id)) }}
              getOptionLabel={(option) => option.fullName}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Person"
                  placeholder="Search people"
                  onChange={(e) => setPeopleQuery(e.target.value)}
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {peopleLoading ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <TextField label="Notes" fullWidth multiline minRows={2} value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowManual(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitManual}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={decisionOpen} onClose={() => setDecisionOpen(false)}>
        <DialogTitle>
          {decisionAction ? decisionAction.toUpperCase() : 'Decision'}
          {decisionApplicant?.person?.fullName || decisionApplicant?.personName ? ` — ${decisionApplicant?.person?.fullName || decisionApplicant?.personName}` : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr)', gap: 1.5, mt: 1 }}>
            <TextField label="Decision By" fullWidth required value={decisionBy} onChange={(e) => setDecisionBy(e.target.value)} size="small" />
            <TextField label="Notes" fullWidth multiline minRows={2} value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitDecision}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ApplicantsTab
