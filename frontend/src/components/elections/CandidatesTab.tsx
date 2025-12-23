import React, { useEffect, useState } from 'react'
import { Box, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Dialog, DialogTitle, DialogContent, TextField, DialogActions, MenuItem, Tooltip } from '@mui/material'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import { electionApi } from '../../api/election.api'
import { useToast } from '../feedback/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import type { Candidate, Position } from '../../types/election'

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

  const submitDirect = async () => {
    const pid = Number(personId)
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
      fetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add candidate')
    }
  }

  const doGenerate = async () => {
    try {
      await electionApi.generateCandidates(electionId)
      toast.success('Candidates generated')
      fetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate candidates')
    }
  }

  if (loading) return <LoadingState />

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        {isAdmin && <Button variant="contained" onClick={() => { setDecisionBy(user?.displayName || user?.username || ''); setShowAdd(true) }}>Add Candidate</Button>}
        {isAdmin && (
          <Tooltip title="Auto-generate candidates from approved applicants">
            <Button color="warning" variant="outlined" onClick={() => setShowGenerate(true)}>Generate</Button>
          </Tooltip>
        )}
      </Box>

      {candidates.length === 0 ? (
        <EmptyState title="No candidates" description="No candidates available." action={isAdmin ? <Button onClick={() => setShowAdd(true)}>Add Candidate</Button> : undefined} />
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {candidates.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.personName || '—'}</TableCell>
                    <TableCell>{c.positionTitle || '—'}</TableCell>
                    <TableCell>{c.status || '—'}</TableCell>
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
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Person ID" type="number" fullWidth value={personId} onChange={(e) => setPersonId(e.target.value)} />
            <TextField select label="Election Position" fullWidth value={positionId} onChange={(e) => setPositionId(e.target.value)}>
              {positions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.fellowshipPosition?.titleName || p.title || p.positionId}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Decision By" fullWidth required value={decisionBy} onChange={(e) => setDecisionBy(e.target.value)} />
            <TextField label="Notes" fullWidth multiline minRows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
          This will generate candidates from approved applicants. Continue?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerate(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={async () => { setShowGenerate(false); await doGenerate() }}>Generate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CandidatesTab
