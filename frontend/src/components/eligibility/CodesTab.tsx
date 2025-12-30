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
  IconButton,
  InputAdornment,
  Paper,
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { codesApi } from '../../api/codes.api'
import { peopleApi } from '../../api/people.api'
import { useToast } from '../feedback/ToastProvider'
import usePersonSearch from './usePersonSearch'
import LoadingState from '../common/LoadingState'
import EmptyState from '../common/EmptyState'
import StatusChip from '../common/StatusChip'
import type { PersonResponse } from '../../types/leadership'
import type { VotingCodeResponse } from '../../types/eligibility'

interface CodesTabProps {
  electionId: number | string
  votingPeriodId: number | string
  isAdmin: boolean
  votingPeriodStatus?: string
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED'

const maskCode = (code?: string) => {
  if (!code) return '—'
  if (code.length <= 4) return '••••'
  const visible = code.slice(-4)
  return `••••••${visible}`
}

const CodesTab: React.FC<CodesTabProps> = ({ electionId, votingPeriodId, isAdmin, votingPeriodStatus }) => {
  const toast = useToast()
  const { options: personOptions, search: searchPeople, loading: searchingPeople } = usePersonSearch()

  const [issuePerson, setIssuePerson] = useState<PersonResponse | null>(null)
  const [remarks, setRemarks] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [resultCode, setResultCode] = useState<string | null>(null)
  const [resultPerson, setResultPerson] = useState<PersonResponse | null>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<PersonResponse | null>(null)
  const [rows, setRows] = useState<VotingCodeResponse[]>([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState<Record<StatusFilter, number>>({ ALL: 0, ACTIVE: 0, USED: 0, REVOKED: 0, EXPIRED: 0 })
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [personNames, setPersonNames] = useState<Record<number, string>>({})

  const [reasonDialog, setReasonDialog] = useState<{ mode: 'regenerate' | 'revoke'; code?: VotingCodeResponse } | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [reasonBusy, setReasonBusy] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const canIssue = isAdmin && votingPeriodStatus === 'OPEN'

  const refreshCounts = async () => {
    try {
      const [all, active, used, revoked, expired] = await Promise.all([
        codesApi.count(electionId, votingPeriodId),
        codesApi.count(electionId, votingPeriodId, 'ACTIVE'),
        codesApi.count(electionId, votingPeriodId, 'USED'),
        codesApi.count(electionId, votingPeriodId, 'REVOKED'),
        codesApi.count(electionId, votingPeriodId, 'EXPIRED'),
      ])
      setCounts({
        ALL: all.count ?? 0,
        ACTIVE: active.count ?? 0,
        USED: used.count ?? 0,
        REVOKED: revoked.count ?? 0,
        EXPIRED: expired.count ?? 0,
      })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load code counts')
      setCounts({ ALL: 0, ACTIVE: 0, USED: 0, REVOKED: 0, EXPIRED: 0 })
    }
  }

  const loadNames = async (entries: VotingCodeResponse[]) => {
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
            // ignore
          }
        })
      )
      if (Object.keys(updates).length > 0) {
        setPersonNames((prev) => ({ ...prev, ...updates }))
      }
    } catch (e) {
      // ignore
    }
  }

  const fetchCodes = async () => {
    setLoading(true)
    try {
      const params: any = { page, size, sort: 'issuedAt,desc' }
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await codesApi.list(electionId, votingPeriodId, params)
      const content = res.content || []
      setRows(content)
      setTotal(res.totalElements || 0)
      loadNames(content)
      setLastRefreshed(new Date())
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load voting codes')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, votingPeriodId])

  useEffect(() => {
    fetchCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, votingPeriodId, page, size, statusFilter])

  const filteredRows = useMemo(() => {
    if (!selectedPersonFilter?.id) return rows
    return rows.filter((r) => r.personId === selectedPersonFilter.id)
  }, [rows, selectedPersonFilter])

  const handleIssue = async () => {
    if (!issuePerson?.id) {
      toast.error('Select a person')
      return
    }
    setIssuing(true)
    try {
      const res = await codesApi.issue(electionId, votingPeriodId, { personId: issuePerson.id, remarks: remarks.trim() || undefined })
      setResultCode(res.code || null)
      setResultPerson(issuePerson)
      toast.success('Voting code issued')
      setRemarks('')
      setIssuePerson(null)
      refreshCounts()
      fetchCodes()
    } catch (err: any) {
      toast.error(err?.message || 'Unable to issue code. Please try again.')
    } finally {
      setIssuing(false)
    }
  }

  const handleCopy = async (code?: string) => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Code copied')
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  const openReason = (mode: 'regenerate' | 'revoke', code: VotingCodeResponse) => {
    setReasonText('')
    setReasonDialog({ mode, code })
  }

  const submitReason = async () => {
    if (!reasonDialog?.code) return
    if (!reasonText.trim()) {
      toast.error('Reason is required')
      return
    }
    setReasonBusy(true)
    try {
      if (reasonDialog.mode === 'regenerate') {
        if (!reasonDialog.code.personId) {
          throw new Error('Missing person for code')
        }
        const res = await codesApi.regenerate(electionId, votingPeriodId, { personId: reasonDialog.code.personId, reason: reasonText.trim() })
        setResultCode(res.code || null)
        setResultPerson({ id: reasonDialog.code.personId, fullName: personNames[reasonDialog.code.personId] || `Person #${reasonDialog.code.personId}` } as PersonResponse)
        toast.success('Code regenerated')
      } else {
        await codesApi.revoke(electionId, votingPeriodId, reasonDialog.code.id!, reasonText.trim())
        toast.success('Code revoked')
      }
      setReasonDialog(null)
      refreshCounts()
      fetchCodes()
    } catch (err: any) {
      const msg = err?.message || (reasonDialog.mode === 'regenerate' ? 'Failed to regenerate code' : 'Failed to revoke code')
      toast.error(msg)
    } finally {
      setReasonBusy(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      {/* Summary */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
        {(['ALL', 'ACTIVE', 'USED', 'REVOKED', 'EXPIRED'] as StatusFilter[]).map((key) => (
          <Paper key={key} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{key === 'ALL' ? 'Total codes' : `${key} codes`}</Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>{counts[key] ?? 0}</Typography>
          </Paper>
        ))}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh counts and list">
            <span>
              <Button startIcon={<RefreshIcon />} size="small" onClick={() => { refreshCounts(); fetchCodes() }} disabled={loading}>
                Refresh
              </Button>
            </span>
          </Tooltip>
          {lastRefreshed && <Typography variant="caption" color="text.secondary">Updated {lastRefreshed.toLocaleTimeString()}</Typography>}
        </Box>
      </Box>

      {/* Issue code */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Autocomplete
            sx={{ minWidth: 280, flex: 1 }}
            options={personOptions}
            loading={searchingPeople}
            getOptionLabel={(option) => option.fullName || ''}
            onInputChange={(_, value) => searchPeople(value)}
            value={issuePerson}
            onChange={(_, value) => setIssuePerson(value)}
            renderInput={(params) => <TextField {...params} label="Person" placeholder="Search people" helperText="Type 2+ characters to search" />}
          />
          <TextField
            label="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            sx={{ minWidth: 220, flex: 1 }}
          />
          <Tooltip title={canIssue ? '' : 'Codes can only be issued when the voting period is OPEN.'}>
            <span>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={handleIssue}
                disabled={!canIssue || issuing}
              >
                Issue Code
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            SelectProps={{ native: true }}
            label="Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(0) }}
            sx={{ minWidth: 180 }}
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="USED">Used</option>
            <option value="REVOKED">Revoked</option>
            <option value="EXPIRED">Expired</option>
          </TextField>
          <Autocomplete
            sx={{ minWidth: 240 }}
            options={personOptions}
            loading={searchingPeople}
            getOptionLabel={(option) => option.fullName || ''}
            onInputChange={(_, value) => searchPeople(value)}
            value={selectedPersonFilter}
            onChange={(_, value) => setSelectedPersonFilter(value)}
            renderInput={(params) => <TextField {...params} label="Filter by person" placeholder="Search people" helperText="Type 2+ characters to search" />}
          />
        </Box>

        {loading ? (
          <LoadingState />
        ) : filteredRows.length === 0 ? (
          <EmptyState title="No codes" description="No voting codes found for this filter." />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Person</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Issued</TableCell>
                    <TableCell>Used</TableCell>
                    <TableCell>Revoked</TableCell>
                    <TableCell>Remarks</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row) => {
                    const isRevealed = row.id ? revealed[row.id] : false
                    const codeDisplay = isRevealed ? row.code : maskCode(row.code)
                    const codeId = row.id ? String(row.id) : row.code
                    return (
                      <TableRow key={codeId} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              value={codeDisplay || '—'}
                              size="small"
                              InputProps={{
                                readOnly: true,
                                endAdornment: row.code ? (
                                  <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setRevealed((prev) => ({ ...prev, [row.id!]: !isRevealed }))}>
                                      {isRevealed ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                    </IconButton>
                                  </InputAdornment>
                                ) : undefined,
                              }}
                              sx={{ width: 200 }}
                            />
                            {row.code && (
                              <Tooltip title="Copy">
                                <IconButton size="small" onClick={() => { if (!isRevealed) { setRevealed((prev) => ({ ...prev, [row.id!]: true })) }; handleCopy(row.code) }}>
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {row.personId ? (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography>{personNames[row.personId] || `Person #${row.personId}`}</Typography>
                              <Chip size="small" label={`ID: ${row.personId}`} />
                            </Box>
                          ) : '—'}
                        </TableCell>
                        <TableCell><StatusChip status={(row.status || 'inactive') as any} label={row.status || '—'} /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'grid' }}>
                            <Typography variant="body2">{row.issuedAt ? new Date(row.issuedAt).toLocaleString() : '—'}</Typography>
                            {row.issuedById && <Chip size="small" label={`By ${row.issuedById}`} />}
                          </Box>
                        </TableCell>
                        <TableCell>{row.usedAt ? new Date(row.usedAt).toLocaleString() : '—'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'grid' }}>
                            <Typography variant="body2">{row.revokedAt ? new Date(row.revokedAt).toLocaleString() : '—'}</Typography>
                            {row.revokedById && <Chip size="small" label={`By ${row.revokedById}`} />}
                          </Box>
                        </TableCell>
                        <TableCell>{row.remarks || '—'}</TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <Tooltip title={canIssue ? 'Regenerate' : 'Codes can only be issued when the voting period is OPEN.'}>
                              <span>
                                <IconButton size="small" disabled={!canIssue} onClick={() => openReason('regenerate', row)}>
                                  <AutorenewIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Revoke">
                              <IconButton size="small" onClick={() => openReason('revoke', row)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
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

      <Dialog open={Boolean(resultCode)} onClose={() => setResultCode(null)} fullWidth maxWidth="sm">
        <DialogTitle>Voting Code</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>Share this code securely with the voter.</Typography>
          <TextField
            fullWidth
            value={resultCode || ''}
            InputProps={{ readOnly: true, endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => handleCopy(resultCode || undefined)}>
                  <ContentCopyIcon />
                </IconButton>
              </InputAdornment>
            ) }}
          />
          {resultPerson && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              For: {resultPerson.fullName}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultCode(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(reasonDialog)} onClose={() => setReasonDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{reasonDialog?.mode === 'regenerate' ? 'Regenerate Code' : 'Revoke Code'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason"
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            required
            multiline
            minRows={2}
            fullWidth
          />
          {reasonDialog?.mode === 'regenerate' && votingPeriodStatus !== 'OPEN' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Codes can only be regenerated when the voting period is OPEN.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitReason}
            disabled={reasonBusy || (reasonDialog?.mode === 'regenerate' && !canIssue)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CodesTab
