import React, { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { eligibilityApi } from '../../api/eligibility.api'
import { voterRollApi } from '../../api/voterRoll.api'
import { peopleApi } from '../../api/people.api'
import { useToast } from '../feedback/ToastProvider'
import usePersonSearch from './usePersonSearch'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import StatusChip from '../common/StatusChip'
import type { PersonResponse } from '../../types/leadership'
import type { VoterRollEntryResponse } from '../../types/eligibility'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../api/errorHandler'

interface EligibilityTabProps {
  electionId: number | string
  isAdmin: boolean
}

type EligibleFilter = 'all' | 'eligible' | 'ineligible'

type DecisionState = {
  eligible?: boolean
  rule?: string
  reason?: string
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleString()
}

const EligibilityTab: React.FC<EligibilityTabProps> = ({ electionId, isAdmin }) => {
  const toast = useToast()
  const { options: personOptions, search: searchPeople, loading: searchingPeople } = usePersonSearch()

  const [checkPerson, setCheckPerson] = useState<PersonResponse | null>(null)
  const [decision, setDecision] = useState<DecisionState | null>(null)
  const [checking, setChecking] = useState(false)
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false)

  const [eligibleCount, setEligibleCount] = useState<number | null>(null)
  const [ineligibleCount, setIneligibleCount] = useState<number | null>(null)

  const [rows, setRows] = useState<VoterRollEntryResponse[]>([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [eligibleFilter, setEligibleFilter] = useState<EligibleFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [personNames, setPersonNames] = useState<Record<number, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VoterRollEntryResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VoterRollEntryResponse | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const loadCounts = async () => {
    try {
      const [eligibleRes, ineligibleRes] = await Promise.all([
        voterRollApi.count(electionId, true),
        voterRollApi.count(electionId, false),
      ])
      setEligibleCount(eligibleRes.count ?? 0)
      setIneligibleCount(ineligibleRes.count ?? 0)
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to load override counts')
      setEligibleCount(null)
      setIneligibleCount(null)
    }
  }

  const loadNames = async (entries: VoterRollEntryResponse[]) => {
    const missingIds = (entries
      .map((r) => r.personId)
      .filter((id): id is number => Boolean(id))
      .filter((id) => !personNames[id]))
    if (missingIds.length === 0) return
    try {
      const updates: Record<number, string> = {}
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const res = await peopleApi.get(id)
            updates[id] = res.fullName
          } catch (e) {
            // ignore lookup errors
          }
        })
      )
      if (Object.keys(updates).length > 0) {
        setPersonNames((prev) => ({ ...prev, ...updates }))
      }
    } catch (e) {
      // ignore batch failure
    }
  }

  const fetchOverrides = async () => {
    setLoading(true)
    try {
      const params: any = { page, size, sort: 'addedAt,desc' }
      if (eligibleFilter === 'eligible') params.eligible = true
      if (eligibleFilter === 'ineligible') params.eligible = false
      const res = await voterRollApi.list(electionId, params)
      const content = res.content || []
      setRows(content)
      setTotal(res.totalElements || 0)
      loadNames(content)
      setLastRefreshed(new Date())
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to load voter roll overrides')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId])

  useEffect(() => {
    fetchOverrides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, page, size, eligibleFilter])

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows
    const term = searchTerm.toLowerCase()
    return rows.filter((r) => {
      const name = r.personId ? personNames[r.personId] : ''
      return (
        (name && name.toLowerCase().includes(term)) ||
        (r.reason && r.reason.toLowerCase().includes(term)) ||
        (r.personId && String(r.personId).includes(term))
      )
    })
  }, [rows, searchTerm, personNames])

  const handleCheck = async () => {
    if (!checkPerson?.id) {
      toast.error('Select a person to check')
      return
    }
    setChecking(true)
    try {
      const res = await eligibilityApi.check(electionId, checkPerson.id)
      setDecision(res || null)
      setDecisionDialogOpen(true)
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to check eligibility')
      setDecision(null)
    } finally {
      setChecking(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (row: VoterRollEntryResponse) => {
    setEditing(row)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget?.personId) return
    setDeleteBusy(true)
    try {
      await voterRollApi.remove(electionId, deleteTarget.personId)
      toast.success('Override removed')
      setDeleteTarget(null)
      fetchOverrides()
      loadCounts()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to remove override')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      {/* Stats Row with Colored Icons */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
        <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
            <ThumbUpIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Eligible Overrides
            </Typography>
            <Typography variant="h6" fontWeight="600">{eligibleCount ?? '—'}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
            <ThumbDownIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Ineligible Overrides
            </Typography>
            <Typography variant="h6" fontWeight="600">{ineligibleCount ?? '—'}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <PlaylistAddCheckIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Total Overrides
              </Typography>
              <Typography variant="h6" fontWeight="600">{(eligibleCount ?? 0) + (ineligibleCount ?? 0)}</Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => { loadCounts(); fetchOverrides() }} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      </Box>

      {/* Eligibility Check - Compact and Inline */}
      <Paper sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Autocomplete
            sx={{ minWidth: 240, flex: 1 }}
            options={personOptions}
            loading={searchingPeople}
            getOptionLabel={(option) => option.fullName || ''}
            onInputChange={(_, value) => searchPeople(value)}
            onChange={(_, value) => setCheckPerson(value)}
            size="small"
            value={checkPerson}
            renderInput={(params) => <TextField {...params} label="Person" placeholder="Search people" helperText="Type 2+ characters" />}
          />
          <Button 
            variant="contained" 
            onClick={handleCheck} 
            disabled={checking || !checkPerson}
            startIcon={<AssignmentIcon />}
          >
            Check Eligibility
          </Button>
        </Box>
      </Paper>

      {/* Filters and Actions - Compact and Inline */}
      <Paper sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            select
            SelectProps={{ native: true }}
            label="Eligibility"
            value={eligibleFilter}
            onChange={(e) => { setEligibleFilter(e.target.value as EligibleFilter); setPage(0) }}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <option value="all">All</option>
            <option value="eligible">Eligible</option>
            <option value="ineligible">Ineligible</option>
          </TextField>
          <TextField
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            placeholder="Name, ID, or reason..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <Tooltip title="Clear filters">
            <IconButton
              size="small"
              onClick={() => {
                setEligibleFilter('all')
                setSearchTerm('')
                setPage(0)
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
              Add Override
            </Button>
          )}
        </Box>
      </Paper>

      {/* Overrides Table */}
      <Paper>
        {loading ? (
          <LoadingState />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No overrides"
            description="No voter roll overrides found for this filter. Overrides only appear after an admin adds them."
            action={isAdmin ? <Button onClick={openCreate}>Add Override</Button> : undefined}
          />
        ) : (
          <>
            <TableContainer>
              <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main', '& .MuiTableCell-root': { color: 'primary.contrastText', fontWeight: 600 } }}>
                    <TableCell>Person</TableCell>
                    <TableCell>Eligible</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Added By</TableCell>
                    <TableCell>Added At</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={String(row.id || row.personId)} hover>
                      <TableCell>
                        {row.personId ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                              {personNames[row.personId] || `Person #${row.personId}`}
                            </Typography>
                            <Chip size="small" label={`#${row.personId}`} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          </Box>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={row.eligible ? 'ACTIVE' : 'inactive'} label={row.eligible ? 'Yes' : 'No'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.reason || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.addedBy || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{formatDate(row.addedAt)}</Typography>
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => setDeleteTarget(row)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={size}
              onRowsPerPageChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
            />
          </>
        )}
      </Paper>

      {/* Eligibility Decision Dialog - Modern and Slick */}
      <Dialog 
        open={decisionDialogOpen} 
        onClose={() => setDecisionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2,
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: decision?.eligible ? 'success.main' : 'error.main', 
                width: 64, 
                height: 64 
              }}
            >
              {decision?.eligible ? (
                <CheckCircleIcon sx={{ fontSize: 40 }} />
              ) : (
                <CancelIcon sx={{ fontSize: 40 }} />
              )}
            </Avatar>
            <Typography variant="h5" fontWeight="600">
              {decision?.eligible ? 'Eligible to Vote' : 'Not Eligible to Vote'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Person
              </Typography>
              <Typography variant="h6" fontWeight="500">{checkPerson?.fullName}</Typography>
              {checkPerson?.id && (
                <Chip 
                  size="small" 
                  label={`ID: ${checkPerson.id}`} 
                  sx={{ mt: 0.5 }} 
                />
              )}
            </Box>
            {decision?.rule && (
              <Box 
                sx={{ 
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Rule Applied
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {decision.rule}
                </Typography>
              </Box>
            )}
            {decision?.reason && (
              <Box 
                sx={{ 
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Reason
                </Typography>
                <Typography variant="body1">
                  {decision.reason}
                </Typography>
              </Box>
            )}
            {!decision?.eligible && isAdmin && (
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  You may add an eligibility override for this person if needed.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, pt: 1, gap: 1 }}>
          {!decision?.eligible && isAdmin && (
            <Button 
              onClick={() => {
                setDecisionDialogOpen(false)
                openCreate()
              }} 
              variant="contained"
              startIcon={<AddIcon />}
            >
              Add Override
            </Button>
          )}
          <Button 
            onClick={() => setDecisionDialogOpen(false)} 
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <OverrideDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        electionId={electionId}
        onSaved={() => { setDialogOpen(false); fetchOverrides(); loadCounts() }}
        existing={editing}
        isAdmin={isAdmin}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Remove Override</DialogTitle>
        <DialogContent>
          Are you sure you want to remove this override?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleteBusy}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

interface OverrideDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  electionId: number | string
  existing: VoterRollEntryResponse | null
  isAdmin: boolean
}

const OverrideDialog: React.FC<OverrideDialogProps> = ({ open, onClose, onSaved, electionId, existing, isAdmin }) => {
  const toast = useToast()
  const { user } = useAuth()
  const { options, search, loading } = usePersonSearch()
  const [person, setPerson] = useState<PersonResponse | null>(null)
  const [eligible, setEligible] = useState(true)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setEligible(Boolean(existing.eligible))
      setReason(existing.reason || '')
      if (existing.personId) {
        peopleApi.get(existing.personId).then((p) => setPerson(p)).catch(() => setPerson({ id: existing.personId, fullName: `Person #${existing.personId}` } as PersonResponse))
      }
    } else {
      setPerson(null)
      setEligible(true)
      setReason('')
    }
  }, [existing])

  const submit = async () => {
    if (!person?.id) {
      toast.error('Select a person')
      return
    }
    if (!reason.trim()) {
      toast.error('Reason is required')
      return
    }
    setSaving(true)
    try {
      await voterRollApi.upsert(electionId, person.id, {
        eligible,
        reason: reason.trim(),
        addedBy: user?.username,
      })
      toast.success('Override saved')
      onSaved()
    } catch (err: any) {
      toast.error(getErrorMessage(err) || 'Failed to save override')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{existing ? 'Edit Override' : 'Add Override'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <Autocomplete
            disabled={Boolean(existing)}
            options={options}
            loading={loading}
            getOptionLabel={(option) => option.fullName || ''}
            onInputChange={(_, value) => search(value)}
            value={person}
            onChange={(_, value) => setPerson(value)}
            renderInput={(params) => <TextField {...params} label="Person" required helperText="Type 2+ characters to search" />}
          />
          <FormControlLabel
            control={<Switch checked={eligible} onChange={(e) => setEligible(e.target.checked)} />}
            label={eligible ? 'Mark as eligible' : 'Mark as ineligible'}
          />
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            multiline
            minRows={2}
          />
          {!isAdmin && (
            <Typography variant="body2" color="text.secondary">
              Read-only role: overrides cannot be edited.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving || !isAdmin}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EligibilityTab
