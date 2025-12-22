import React, { useEffect, useState } from 'react'
import { Box, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import { electionApi } from '../../api/election.api'
import { useToast } from '../feedback/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import type { Candidate } from '../../types/election'

const CandidatesTab: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [loading, setLoading] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
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

  const submitDirect = async () => {
    if (!name) return toast.error('Name required')
    try {
      await electionApi.createCandidateDirect(electionId, { name })
      toast.success('Candidate added')
      setShowAdd(false)
      setName('')
      fetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add candidate')
    }
  }

  const doGenerate = async () => {
    if (!confirm('Generate candidates? This will run the generation process.')) return
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
        {isAdmin && <Button variant="contained" onClick={() => setShowAdd(true)}>Add Candidate</Button>}
        {isAdmin && <Button color="warning" variant="outlined" onClick={doGenerate}>Generate</Button>}
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
          <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitDirect}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CandidatesTab
