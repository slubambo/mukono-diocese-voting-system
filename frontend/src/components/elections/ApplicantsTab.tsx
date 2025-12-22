import React, { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Tabs, Tab, IconButton } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import UndoIcon from '@mui/icons-material/Undo'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import { electionApi } from '../../api/election.api'
import { useToast } from '../feedback/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import type { Applicant } from '../../types/election'

const ApplicantsTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [manualName, setManualName] = useState('')
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
      setApplicants(res || [])
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

  const doAction = async (action: 'approve' | 'reject' | 'revert' | 'withdraw', applicantId: number | string) => {
    if (!isAdmin) return
    if (action === 'reject' && !confirm('Reject this applicant?')) return
    if (action === 'withdraw' && !confirm('Withdraw this applicant?')) return

    try {
      if (action === 'approve') await electionApi.approveApplicant(electionId, applicantId)
      if (action === 'reject') await electionApi.rejectApplicant(electionId, applicantId)
      if (action === 'revert') await electionApi.revertApplicant(electionId, applicantId)
      if (action === 'withdraw') await electionApi.withdrawApplicant(electionId, applicantId)
      toast.success('Action completed')
      // refresh
      if (tab === 0) fetchPending(); else fetchAll()
      fetchCount()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to perform action')
    }
  }

  const submitManual = async () => {
    if (!manualName) return toast.error('Name is required')
    try {
      await electionApi.manualApplicant(electionId, { name: manualName })
      toast.success('Applicant created')
      setShowManual(false)
      setManualName('')
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
                          <IconButton size="small" onClick={() => doAction('approve', a.id)} title="Approve"><CheckIcon /></IconButton>
                          <IconButton size="small" onClick={() => doAction('reject', a.id)} title="Reject"><CloseIcon /></IconButton>
                          <IconButton size="small" onClick={() => doAction('revert', a.id)} title="Revert"><RotateLeftIcon /></IconButton>
                          <IconButton size="small" onClick={() => doAction('withdraw', a.id)} title="Withdraw"><UndoIcon /></IconButton>
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
          <TextField label="Name" fullWidth value={manualName} onChange={(e) => setManualName(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowManual(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitManual}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ApplicantsTab
