import React, { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Tabs, Tab, IconButton, MenuItem, Tooltip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import UndoIcon from '@mui/icons-material/Undo'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import { electionApi } from '../../api/election.api'
import { useToast } from '../feedback/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import type { Applicant, Position } from '../../types/election'

const ApplicantsTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [manualPersonId, setManualPersonId] = useState('')
  const [manualPositionId, setManualPositionId] = useState('')
  const [manualNotes, setManualNotes] = useState('')
  const [positions, setPositions] = useState<Position[]>([])
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
        setPositions(data || [])
      } catch (err) {
        setPositions([])
      }
    }
    loadPositions()
  }, [electionId])

  const openDecision = (action: 'approve' | 'reject' | 'revert' | 'withdraw', applicant: Applicant) => {
    if (!isAdmin) return
    setDecisionAction(action)
    setDecisionApplicant(applicant)
    setDecisionBy(user?.displayName || user?.username || '')
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
    const personId = Number(manualPersonId)
    const electionPositionId = Number(manualPositionId)
    if (!personId || !electionPositionId) {
      toast.error('Person ID and Position are required')
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
        {isAdmin && <Button variant="contained" onClick={() => setShowManual(true)}>Manual Applicant</Button>}
      </Box>

      {applicants.length === 0 ? (
        <EmptyState title="No applicants" description="There are no applicants to display." action={isAdmin ? <Button onClick={() => setShowManual(true)}>Manual Applicant</Button> : undefined} />
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applicants.map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell>{a.personName || a.fellowshipPosition?.titleName || '—'}</TableCell>
                    <TableCell>{a.positionTitle || a.fellowshipPosition?.titleName || '—'}</TableCell>
                    <TableCell>{a.status}</TableCell>
                    <TableCell>{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}</TableCell>
                    <TableCell align="right">
                      {isAdmin && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" onClick={() => openDecision('approve', a)}><CheckIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" onClick={() => openDecision('reject', a)}><CloseIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="Revert">
                            <IconButton size="small" onClick={() => openDecision('revert', a)}><RotateLeftIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="Withdraw">
                            <IconButton size="small" onClick={() => openDecision('withdraw', a)}><UndoIcon /></IconButton>
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

      <Dialog open={showManual} onClose={() => setShowManual(false)}>
        <DialogTitle>Manual Applicant</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Person ID" type="number" fullWidth value={manualPersonId} onChange={(e) => setManualPersonId(e.target.value)} />
            <TextField
              select
              label="Election Position"
              fullWidth
              value={manualPositionId}
              onChange={(e) => setManualPositionId(e.target.value)}
            >
              {positions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.fellowshipPosition?.titleName || p.title || p.positionId}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Notes" fullWidth multiline minRows={3} value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowManual(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitManual}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={decisionOpen} onClose={() => setDecisionOpen(false)}>
        <DialogTitle>{decisionAction ? decisionAction.toUpperCase() : 'Decision'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Decision By" fullWidth required value={decisionBy} onChange={(e) => setDecisionBy(e.target.value)} />
            <TextField label="Notes" fullWidth multiline minRows={3} value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} />
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
