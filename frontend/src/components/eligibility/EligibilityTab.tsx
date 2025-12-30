import React, { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
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
      toast.error(err?.message || 'Failed to load override counts')
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
      toast.error(err?.message || 'Failed to load voter roll overrides')
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
    } catch (err: any) {
      toast.error(err?.message || 'Failed to check eligibility')
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
      toast.error(err?.message || 'Failed to remove override')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      {/* Eligibility checker */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Eligibility Check</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Autocomplete
            sx={{ minWidth: 280, flex: 1 }}
            options={personOptions}
            loading={searchingPeople}
            getOptionLabel={(option) => option.fullName || ''}
            onInputChange={(_, value) => searchPeople(value)}
            onChange={(_, value) => setCheckPerson(value)}
            renderInput={(params) => <TextField {...params} label="Person" placeholder="Search people" helperText="Type 2+ characters to search" />}
          />
          <Button variant="contained" onClick={handleCheck} disabled={checking}>Check Eligibility</Button>
        </Box>
        {decision && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={decision.eligible ? 'Eligible' : 'Not eligible'}
              color={decision.eligible ? 'success' : 'error'}
              variant="outlined"
            />
            {decision.rule && <Typography variant="body2">Rule: {decision.rule}</Typography>}
            {decision.reason && <Typography variant="body2">Reason: {decision.reason}</Typography>}
            {!decision.eligible && isAdmin && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                You may add an override below (admin only).
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Summary cards */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ display: 'grid' }}>
            <Typography variant="caption" color="text.secondary">Eligible overrides</Typography>
            <Typography variant="h5">{eligibleCount ?? '—'}</Typography>
          </Box>
          <Box sx={{ display: 'grid' }}>
            <Typography variant="caption" color="text.secondary">Ineligible overrides</Typography>
            <Typography variant="h5">{ineligibleCount ?? '—'}</Typography>
          </Box>
          <Box sx={{ display: 'grid' }}>
            <Typography variant="caption" color="text.secondary">Total overrides</Typography>
            <Typography variant="h5">{(eligibleCount ?? 0) + (ineligibleCount ?? 0)}</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Refresh counts and overrides">
            <span>
              <Button startIcon={<RefreshIcon />} onClick={() => { loadCounts(); fetchOverrides() }} disabled={loading}>
                Refresh
              </Button>
            </span>
          </Tooltip>
          {lastRefreshed && (
            <Typography variant="caption" color="text.secondary">Updated {lastRefreshed.toLocaleTimeString()}</Typography>
          )}
        </Box>
      </Paper>

      {/* Overrides table */}
      <Paper>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            SelectProps={{ native: true }}
            label="Eligibility"
            value={eligibleFilter}
            onChange={(e) => { setEligibleFilter(e.target.value as EligibleFilter); setPage(0) }}
            sx={{ minWidth: 160 }}
          >
            <option value="all">All</option>
            <option value="eligible">Eligible only</option>
            <option value="ineligible">Ineligible only</option>
          </TextField>
          <TextField
            label="Search reason or person"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 240 }}
            placeholder="Search name, ID, or reason"
            helperText="Type to filter within the loaded page"
          />
          {isAdmin && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate} sx={{ ml: 'auto' }}>
              Add Override
            </Button>
          )}
        </Box>

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
              <Table>
                <TableHead>
                  <TableRow>
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
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography>{personNames[row.personId] || `Person #${row.personId}`}</Typography>
                            <Chip size="small" label={`ID: ${row.personId}`} />
                          </Box>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={row.eligible ? 'ACTIVE' : 'inactive'} label={row.eligible ? 'Yes' : 'No'} />
                      </TableCell>
                      <TableCell>{row.reason || '—'}</TableCell>
                      <TableCell>{row.addedBy || '—'}</TableCell>
                      <TableCell>{formatDate(row.addedAt)}</TableCell>
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
      toast.error(err?.message || 'Failed to save override')
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
