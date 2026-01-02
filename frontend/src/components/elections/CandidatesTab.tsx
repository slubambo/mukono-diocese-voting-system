import React, { useEffect, useState } from 'react'
import { Box, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Dialog, DialogTitle, DialogContent, TextField, DialogActions, MenuItem, Tooltip, Autocomplete, CircularProgress, IconButton, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import { electionApi } from '../../api/election.api'
import { peopleApi } from '../../api/people.api'
import { useToast } from '../feedback/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import type { Candidate, Position } from '../../types/election'
import type { PersonResponse } from '../../types/leadership'

const CandidatesTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [loading, setLoading] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [personId, setPersonId] = useState('')
  const [positionId, setPositionId] = useState('')
  const [decisionBy, setDecisionBy] = useState('')
  const [notes, setNotes] = useState('')
  const [positions, setPositions] = useState<Position[]>([])
  const [showGenerate, setShowGenerate] = useState(false)
  const [generatePositionId, setGeneratePositionId] = useState('')
  const [generateBy, setGenerateBy] = useState('')
  const [peopleOptions, setPeopleOptions] = useState<PersonResponse[]>([])
  const [peopleQuery, setPeopleQuery] = useState('')
  const [peopleLoading, setPeopleLoading] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<PersonResponse | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Candidate | null>(null)
  const [removeBy, setRemoveBy] = useState('')
  const [removeNotes, setRemoveNotes] = useState('')
  const toast = useToast()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.roles?.includes('ROLE_ADMIN'))

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await electionApi.listCandidates(electionId)
      const data = (res as any)?.content ?? []
      setCandidates(data)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [electionId])

  useEffect(() => {
    const loadPositions = async () => {
      try {
        const res = await electionApi.listPositions(electionId)
        const data: Position[] = Array.isArray((res as any)?.content) ? (res as any).content : (res as any)
        setPositions(data || [])
      } catch (err) {
        setPositions([])
      }
    }
    loadPositions()
  }, [electionId])

  useEffect(() => {
    if (!showAdd) return
    const handle = setTimeout(async () => {
      setPeopleLoading(true)
      try {
        const res = await peopleApi.list({ q: peopleQuery, page: 0, size: 20 })
        setPeopleOptions(res.content || [])
      } catch (err) {
        setPeopleOptions([])
      } finally {
        setPeopleLoading(false)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [peopleQuery, showAdd])

  const submitDirect = async () => {
    const pid = selectedPerson?.id || Number(personId)
    const posId = Number(positionId)
    const decidedBy = decisionBy.trim()
    if (!pid || !posId || !decidedBy) return toast.error('Person, position, and decision by are required')
    try {
      await electionApi.createCandidateDirect(electionId, {
        personId: pid,
        electionPositionId: posId,
        decisionBy: decidedBy,
        notes: notes.trim() || undefined,
      })
      toast.success('Candidate added')
      setShowAdd(false)
      setPersonId('')
      setPositionId('')
      setDecisionBy('')
      setNotes('')
      setSelectedPerson(null)
      fetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add candidate')
    }
  }

  const doGenerate = async () => {
    const posId = Number(generatePositionId)
    const createdBy = generateBy.trim()
    if (!posId || !createdBy) {
      toast.error('Position and created by are required')
      return
    }
    try {
      await electionApi.generateCandidates(electionId, { electionPositionId: posId, createdBy })
      toast.success('Candidates generated for position')
      fetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate candidates')
    }
  }

  const openRemove = (candidate: Candidate) => {
    setRemoveTarget(candidate)
    setRemoveBy(user?.username || '')
    setRemoveNotes('')
    setRemoveOpen(true)
  }

  const submitRemove = async () => {
    if (!removeTarget) return
    const electionPositionId = Number(removeTarget.electionPositionId)
    const personId = removeTarget.person?.id || removeTarget.personId
    if (!electionPositionId || !personId) {
      toast.error('Missing position or person')
      return
    }
    if (!removeBy.trim()) {
      toast.error('Removed by is required')
      return
    }
    try {
      await electionApi.removeCandidate(electionId, { electionPositionId, personId: Number(personId) }, { removedBy: removeBy.trim(), notes: removeNotes.trim() || undefined })
      toast.success('Candidate removed')
      setRemoveOpen(false)
      setRemoveTarget(null)
      fetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove candidate')
    }
  }

  if (loading) return <LoadingState />

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        {isAdmin && <Button variant="contained" onClick={() => { setDecisionBy(user?.username || ''); setSelectedPerson(null); setShowAdd(true) }}>Add Candidate</Button>}
        {isAdmin && (
          <Tooltip title="Auto-generate candidates from approved applicants">
            <Button color="warning" variant="outlined" onClick={() => { setGenerateBy(user?.username || ''); setGeneratePositionId(''); setShowGenerate(true) }}>Generate</Button>
          </Tooltip>
        )}
      </Box>

      {candidates.length === 0 ? (
        <EmptyState title="No candidates" description="No candidates available." action={isAdmin ? <Button onClick={() => setShowAdd(true)}>Add Candidate</Button> : undefined} />
      ) : (
        <Paper sx={{ border: '1px solid rgba(88, 28, 135, 0.1)', borderRadius: 1.5 }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: 'rgba(88, 28, 135, 0.08)' }}>
                <TableRow>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>Person</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>Source</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>Position</Typography></TableCell>
                  {isAdmin && <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>Actions</Typography></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {candidates.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography variant="body2">{c.person?.fullName || c.personName || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{c.applicantId ? 'Applicant' : 'Direct'}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {c.positionTitle || (c as any)?.positionTitle || '—'}
                        {c.fellowshipName ? ` — ${c.fellowshipName}` : ''}
                      </Typography>
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <Tooltip title="Remove">
                          <span>
                            <IconButton size="small" color="error" onClick={() => openRemove(c)}><DeleteIcon /></IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogTitle>Add Candidate (Direct)</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr)', gap: 1.5, mt: 1 }}>
            <Autocomplete
              options={peopleOptions}
              loading={peopleLoading}
              value={selectedPerson}
              onChange={(_, val) => { setSelectedPerson(val); if (val) setPersonId(String(val.id)) }}
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
            <TextField select label="Election Position" fullWidth value={positionId} onChange={(e) => setPositionId(e.target.value)} size="small">
              {positions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {(p.fellowshipPosition?.titleName || p.title || p.positionId)}
                  {p.fellowshipPosition?.fellowshipName ? ` — ${p.fellowshipPosition.fellowshipName}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Decision By" fullWidth required value={decisionBy} onChange={(e) => setDecisionBy(e.target.value)} size="small" />
            <TextField label="Notes" fullWidth multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitDirect}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showGenerate} onClose={() => setShowGenerate(false)}>
        <DialogTitle>Generate Candidates</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr)', gap: 1.5, mt: 1 }}>
            <TextField select label="Election Position" fullWidth value={generatePositionId} onChange={(e) => setGeneratePositionId(e.target.value)} size="small">
              {positions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {(p.fellowshipPosition?.titleName || p.title || p.positionId)}
                  {p.fellowshipPosition?.fellowshipName ? ` — ${p.fellowshipPosition.fellowshipName}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Created By" fullWidth required value={generateBy} onChange={(e) => setGenerateBy(e.target.value)} size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerate(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={async () => { await doGenerate(); setShowGenerate(false) }}>Generate</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={removeOpen} onClose={() => setRemoveOpen(false)}>
        <DialogTitle>
          Remove Candidate
          {removeTarget?.person?.fullName ? ` — ${removeTarget.person.fullName}` : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr)', gap: 1.5, mt: 1 }}>
            <TextField label="Removed By" fullWidth required value={removeBy} onChange={(e) => setRemoveBy(e.target.value)} size="small" />
            <TextField label="Notes" fullWidth multiline minRows={2} value={removeNotes} onChange={(e) => setRemoveNotes(e.target.value)} size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={submitRemove}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CandidatesTab
