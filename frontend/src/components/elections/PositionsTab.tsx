import React, { useEffect, useMemo, useState } from 'react'
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, IconButton, Tooltip, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { electionApi } from '../../api/election.api'
import type { Position } from '../../types/election'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import PositionForm from './PositionForm'
import { useToast } from '../feedback/ToastProvider'
import { getErrorMessage } from '../../api/errorHandler'

const PositionsTab: React.FC<{ electionId: string; isAdmin?: boolean }> = ({ electionId, isAdmin = false }) => {
  const [loading, setLoading] = useState(true)
  const [positions, setPositions] = useState<Position[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Position | null>(null)
  const toast = useToast()

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await electionApi.listPositions(electionId)
      // Backend returns a paged response { content: Position[], ... }
      const data: Position[] = Array.isArray((res as any)?.content) ? (res as any).content : (res as any)
      setPositions(data || [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load positions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [electionId])

  const grouped = useMemo(() => {
    const groups = positions.reduce<Record<string, Position[]>>((acc, pos) => {
      const key = pos.fellowshipPosition?.fellowshipName || pos.fellowshipName || 'Other'
      acc[key] = acc[key] || []
      acc[key].push(pos)
      return acc
    }, {})
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [positions])

  const handleDelete = (position: Position) => {
    setConfirmDelete(position)
  }

  const confirmDeletePosition = async () => {
    if (!confirmDelete) return
    try {
      const deleteId = confirmDelete.fellowshipPosition?.id ?? confirmDelete.positionId ?? confirmDelete.id
      if (!deleteId) {
        toast.error('Missing fellowship position id')
        return
      }
      await electionApi.deletePosition(electionId, deleteId)
      toast.success('Position removed')
      setConfirmDelete(null)
      fetch()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to remove position')
    }
  }

  if (loading) return <LoadingState />

  return (
    <Box>
          {isAdmin && <Button startIcon={<AddIcon />} sx={{ mb: 2 }} variant="contained" onClick={() => { setShowAdd(true) }}>Add Position(s)</Button>}

      {positions.length === 0 ? (
        <EmptyState title="No positions" description="No positions have been configured for this election." action={isAdmin ? <Button onClick={() => setShowAdd(true)}>Add Position(s)</Button> : undefined} />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(360px, 1fr))' },
            gap: 1.5,
            '& > :last-child:nth-child(odd)': {
              gridColumn: { xs: 'auto', md: '1 / -1' },
            },
          }}
        >
          {grouped.map(([fellowship, items]) => (
            <Paper key={fellowship} sx={{ borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.12)', p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{fellowship}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{items.length} role{items.length === 1 ? '' : 's'}</Typography>
                </Box>
                <Chip label="Grouped by fellowship" size="small" sx={{ backgroundColor: 'rgba(88, 28, 135, 0.08)', color: 'primary.main', fontWeight: 600 }} />
              </Box>
              <TableContainer>
                <Table size="small" sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.06)', fontWeight: 700 }, '& td, & th': { borderBottom: '1px solid rgba(88, 28, 135, 0.08)' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                  <TableCell>Seats</TableCell>
                  <TableCell align="right">Applicants</TableCell>
                  <TableCell align="right">Approved</TableCell>
                  <TableCell align="right">Pending</TableCell>
                      <TableCell align="right">Rejected</TableCell>
                      {isAdmin && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell><Typography variant="body2">{p.fellowshipPosition?.titleName || p.title || p.positionId}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{p.seats ?? '-'}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{p.totalApplicants ?? 0}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{p.approvedApplicants ?? 0}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2">{p.pendingApplicants ?? 0}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2">{p.rejectedApplicants ?? 0}</Typography></TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <Tooltip title={p.canDelete === false ? 'Cannot delete: applicants exist' : 'Delete'}>
                              <span>
                                <IconButton size="small" color="error" onClick={() => handleDelete(p)} disabled={p.canDelete === false}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
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
          ))}
        </Box>
      )}

      <PositionForm open={showAdd} onClose={() => setShowAdd(false)} electionId={electionId} onSaved={() => { setShowAdd(false); fetch() }} />

      <Dialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Remove Position</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{confirmDelete?.fellowshipPosition?.titleName || confirmDelete?.title || 'this position'}</strong> from the election?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDeletePosition}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PositionsTab
