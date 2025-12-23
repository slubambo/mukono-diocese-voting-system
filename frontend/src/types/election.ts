export type ElectionStatus = 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'CANCELLED' | 'COMPLETED' | string

export interface Election {
  id: string | number
  name: string
  description?: string
  status?: ElectionStatus
  scope?: 'DIOCESE' | 'ARCHDEACONRY' | 'CHURCH' | string
  fellowshipId?: number
  fellowshipName?: string
  fellowship?: { id: number; name?: string }
  dioceseId?: number | null
  archdeaconryId?: number | null
  churchId?: number | null
  diocese?: { id: number; name?: string }
  archdeaconry?: { id: number; name?: string }
  church?: { id: number; name?: string }
  termStartDate?: string | null
  termEndDate?: string | null
  nominationStartAt?: string | null
  nominationEndAt?: string | null
  votingStartAt?: string | null
  votingEndAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Position {
  id: string
  electionId: string
  positionId?: string | number
  title?: string
  description?: string
  seats?: number
  fellowshipPosition?: {
    id: number
    scope?: string
    seats?: number
    fellowshipId?: number
    fellowshipName?: string
    titleId?: number
    titleName?: string
  }
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface Applicant {
  id: number | string
  personId?: number
  personName?: string
  positionId?: number | string
  positionTitle?: string
  status?: string
  submittedAt?: string
  // include fellowshipPosition if present
  fellowshipPosition?: {
    id?: number
    titleName?: string
    fellowshipName?: string
  }
}

export interface Candidate {
  id: number | string
  personId?: number
  personName?: string
  positionId?: number | string
  positionTitle?: string
  status?: string
}

export interface BallotEntry {
  positionTitle?: string
  candidateName?: string
  positionId?: number | string
  candidateId?: number | string
}

export interface VotingPeriod {
  id: number | string
  name?: string
  label?: string
  startTime?: string
  endTime?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface PositionSummary {
  electionPositionId?: number
  fellowshipPositionId?: number
  positionTitle?: string
  seats?: number
  maxVotesPerVoter?: number
}

export interface FellowshipPositionsGroup {
  fellowshipId?: number
  fellowshipName?: string
  positions?: PositionSummary[]
}

export interface VotingPeriodPositionsResponse {
  votingPeriodId?: number
  electionId?: number
  electionPositionIds?: number[]
  byFellowship?: FellowshipPositionsGroup[]
}
