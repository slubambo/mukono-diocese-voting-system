import React, { useEffect, useState } from 'react'
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { electionApi } from '../../api/election.api'
import type { Position } from '../../types/election'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import PositionForm from './PositionForm'
import { useToast } from '../feedback/ToastProvider'
import { getErrorMessage } from '../../api/errorHandler'
import DeleteIcon from '@mui/icons-material/Delete'

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
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Fellowship</TableCell>
                  <TableCell>Seats</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.fellowshipPosition?.titleName || p.title || p.positionId}</TableCell>
                    <TableCell>{p.fellowshipPosition?.fellowshipName ?? '-'}</TableCell>
                    <TableCell>{p.seats ?? '-'}</TableCell>
                    <TableCell align="right">
                      {isAdmin && (
                        <>
                          <IconButton size="small" onClick={async () => {
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

      <PositionForm open={showAdd} onClose={() => setShowAdd(false)} electionId={electionId} onSaved={() => { setShowAdd(false); fetch() }} />
    </Box>
  )
}

export default PositionsTab
