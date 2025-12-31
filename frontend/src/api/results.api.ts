import { api } from './axios'

export interface ElectionResultsSummaryResponse {
  electionId?: number
  votingPeriodId?: number
  votingPeriodName?: string
  periodStatus?: string
  periodStartTime?: string
  periodEndTime?: string
  totalPositions?: number
  totalBallotsCast?: number
  totalSelectionsCast?: number
  totalDistinctVoters?: number
  serverTime?: string
}

export interface CandidateResultsResponse {
  candidateId?: number
  personId?: number
  fullName?: string
  voteCount?: number
  voteSharePercent?: number
}

export interface PositionResultsResponse {
  positionId?: number
  positionName?: string
  scope?: string
  seats?: number
  maxVotesPerVoter?: number
  turnoutForPosition?: number
  totalBallotsForPosition?: number
  candidates?: CandidateResultsResponse[]
}

export interface FlatResultRowResponse {
  electionId?: number
  votingPeriodId?: number
  positionId?: number
  positionName?: string
  candidateId?: number
  personId?: number
  fullName?: string
  voteCount?: number
  turnoutForPosition?: number
  totalBallotsForPosition?: number
  voteSharePercent?: number
}

export interface TallyStatusResponse {
  tallyExists?: boolean
  tallyRunId?: number
  status?: string
  electionId?: number
  votingPeriodId?: number
  startedAt?: string
  completedAt?: string
  startedByPersonId?: number
  completedByPersonId?: number
  remarks?: string
  totalPositionsCertified?: number
  totalWinnersApplied?: number
}

export interface RunTallyRequest {
  remarks?: string
  force?: boolean
}

export interface RunTallyResponse {
  tallyRunId?: number
  status?: string
  electionId?: number
  votingPeriodId?: number
  totalPositionsTallied?: number
  totalWinnersApplied?: number
  tiesDetectedCount?: number
  serverTime?: string
  message?: string
}

export interface PositionTallyItem {
  candidateId?: number
  votes?: number
}

export interface PositionTallyResponse {
  electionId?: number
  positionId?: number
  items?: PositionTallyItem[]
  totalVotes?: number
}

const ADMIN_BASE = '/api/v1/admin/elections'
const PUBLIC_BASE = '/api/v1/elections'

export const resultsApi = {
  getSummary: (electionId: string | number, votingPeriodId: string | number) =>
    api.get<ElectionResultsSummaryResponse>(`${ADMIN_BASE}/${electionId}/voting-periods/${votingPeriodId}/results/summary`),

  getPositions: (electionId: string | number, votingPeriodId: string | number) =>
    api.get<PositionResultsResponse[]>(`${ADMIN_BASE}/${electionId}/voting-periods/${votingPeriodId}/results/positions`),

  getPosition: (electionId: string | number, votingPeriodId: string | number, positionId: string | number) =>
    api.get<PositionResultsResponse>(`${ADMIN_BASE}/${electionId}/voting-periods/${votingPeriodId}/results/positions/${positionId}`),

  exportFlat: (electionId: string | number, votingPeriodId: string | number) =>
    api.get<FlatResultRowResponse[]>(`${ADMIN_BASE}/${electionId}/voting-periods/${votingPeriodId}/results/export`),

  tallyStatus: (electionId: string | number, votingPeriodId: string | number) =>
    api.get<TallyStatusResponse>(`${ADMIN_BASE}/${electionId}/voting-periods/${votingPeriodId}/tally/status`),

  runTally: (electionId: string | number, votingPeriodId: string | number, payload: RunTallyRequest = {}) =>
    api.post<RunTallyResponse>(`${ADMIN_BASE}/${electionId}/voting-periods/${votingPeriodId}/tally/run`, payload),

  // Public/read-only fallback endpoints (not voting-period scoped)
  positionTally: (electionId: string | number, positionId: string | number) =>
    api.get<PositionTallyResponse>(`${PUBLIC_BASE}/${electionId}/results/positions/${positionId}/tally`),
  positionWinner: (electionId: string | number, positionId: string | number) =>
    api.get<{ tie?: boolean; winnerCandidateId?: number; topCandidateIds?: number[]; topVotes?: number }>(`${PUBLIC_BASE}/${electionId}/results/positions/${positionId}/winner`),
  electionTurnout: (electionId: string | number) =>
    api.get<{ electionId?: number; items?: Array<{ positionId?: number; votes?: number }> }>(`${PUBLIC_BASE}/${electionId}/results/turnout`),
}

export default resultsApi
