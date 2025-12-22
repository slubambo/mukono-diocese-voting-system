import React, { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton } from '@mui/material'
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
import type { VotingPeriod } from '../../types/election'

const VotingPeriodsTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<VotingPeriod[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<VotingPeriod | null>(null)
  const [name, setName] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
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

  const openDialog = (p?: VotingPeriod) => {
    setEditing(p ?? null)
    setName(p?.name ?? '')
    setStartAt(p?.startAt ?? '')
    setEndAt(p?.endAt ?? '')
    setShowDialog(true)
  }

  const submit = async () => {
    try {
      if (editing?.id) {
        await electionApi.updateVotingPeriod(electionId, editing.id, { name, startAt, endAt })
        toast.success('Voting period updated')
      } else {
        await electionApi.createVotingPeriod(electionId, { name, startAt, endAt })
        toast.success('Voting period created')
      }
      setShowDialog(false)
      fetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save voting period')
    }
  }

  const doLifecycle = async (action: 'open' | 'close' | 'cancel', id: string | number) => {
    if (!confirm(`${action.toUpperCase()} this voting period?`)) return
    try {
      if (action === 'open') await electionApi.openVotingPeriod(electionId, id)
      if (action === 'close') await electionApi.closeVotingPeriod(electionId, id)
      if (action === 'cancel') await electionApi.cancelVotingPeriod(electionId, id)
      toast.success(`Voting period ${action}ed`)
      fetch()
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${action} voting period`)
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
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.map(p => (
                  <TableRow key={String(p.id)} hover>
                    <TableCell>{p.name || p.label}</TableCell>
                    <TableCell>{p.startAt ? new Date(p.startAt).toLocaleString() : '—'}</TableCell>
                    <TableCell>{p.endAt ? new Date(p.endAt).toLocaleString() : '—'}</TableCell>
                    <TableCell>{p.status || '—'}</TableCell>
                    <TableCell align="right">
                      {isAdmin && (
                        <>
                          <IconButton size="small" onClick={() => openDialog(p)} title="Edit"><EditIcon /></IconButton>
                          <IconButton size="small" onClick={() => doLifecycle('open', p.id)} title="Open"><OpenInBrowserIcon /></IconButton>
                          <IconButton size="small" onClick={() => doLifecycle('close', p.id)} title="Close"><CloseIcon /></IconButton>
                          <IconButton size="small" onClick={() => doLifecycle('cancel', p.id)} title="Cancel"><CancelIcon /></IconButton>
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
            <TextField label="Start At" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="End At" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VotingPeriodsTab
