import React, { useEffect, useState } from 'react'
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, IconButton, Tooltip, Typography } from '@mui/material'
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

  if (loading) return <LoadingState />

  return (
    <Box>
          {isAdmin && <Button startIcon={<AddIcon />} sx={{ mb: 2 }} variant="contained" onClick={() => { setShowAdd(true) }}>Add Position</Button>}

      {positions.length === 0 ? (
        <EmptyState title="No positions" description="No positions have been configured for this election." action={isAdmin ? <Button onClick={() => setShowAdd(true)}>Add Position</Button> : undefined} />
      ) : (
        <Paper sx={{ width: '100%', borderRadius: 1.5, border: '1px solid rgba(88, 28, 135, 0.1)' }}>
          <TableContainer>
            <Table size="small" sx={{ '& thead th': { backgroundColor: 'rgba(88, 28, 135, 0.08)', fontWeight: 700 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Fellowship</TableCell>
                  <TableCell>Seats</TableCell>
                  {isAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell><Typography variant="body2">{p.fellowshipPosition?.titleName || p.title || p.positionId}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{p.fellowshipPosition?.fellowshipName ?? '-'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{p.seats ?? '-'}</Typography></TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={async () => {
                            if (!confirm('Remove this position from the election?')) return
                            try {
                              const deleteId = p.fellowshipPosition?.id ?? p.positionId ?? p.id
                              if (!deleteId) {
                                toast.error('Missing fellowship position id')
                                return
                              }
                              await electionApi.deletePosition(electionId, deleteId)
                              toast.success('Position removed')
                              fetch()
                            } catch (err: any) {
                              toast.error(getErrorMessage(err) || 'Failed to remove position')
                            }
                          }}><DeleteIcon fontSize="small" /></IconButton>
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

      <PositionForm open={showAdd} onClose={() => setShowAdd(false)} electionId={electionId} onSaved={() => { setShowAdd(false); fetch() }} />
    </Box>
  )
}

export default PositionsTab
