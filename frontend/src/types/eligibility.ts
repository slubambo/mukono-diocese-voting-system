export type EligibilityDecisionResponse = {
  eligible?: boolean
  rule?: string
  reason?: string
}

export type VoterRollOverrideRequest = {
  votingPeriodId: number
  eligible: boolean
  addedBy?: string
  reason?: string
}

export type VoterRollEntryResponse = {
  id?: number
  electionId?: number
  personId?: number
  eligible?: boolean
  reason?: string
  addedBy?: string
  addedAt?: string
}

export type CountResponse = {
  count?: number
}

export type PagedResponseVoterRollEntryResponse = {
  content?: VoterRollEntryResponse[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
}

export type VotingCodeStatus = 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED' | string

export type IssueVotingCodeRequest = {
  personId: number
  remarks?: string
}

export type RegenerateVotingCodeRequest = {
  personId: number
  reason: string
}

export type VotingCodeResponse = {
  id?: number
  electionId?: number
  votingPeriodId?: number
  personId?: number
  code?: string
  status?: VotingCodeStatus
  issuedById?: number
  issuedAt?: string
  usedAt?: string
  revokedAt?: string
  revokedById?: number
  remarks?: string
}

export type PagedResponseVotingCodeResponse = {
  content?: VotingCodeResponse[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
}

export type PagingParams = {
  page?: number
  size?: number
  sort?: string
}

export type EligibleVoterStatus = 'VOTED' | 'NOT_VOTED' | 'ALL'

export type EligibleVoterResponse = {
  personId: number
  fullName: string
  phoneNumber?: string | null
  email?: string | null
  fellowshipName?: string | null
  scope?: string | null
  scopeName?: string | null
  voted?: boolean
  voteCastAt?: string | null
  lastCodeStatus?: VotingCodeStatus | null
  lastCodeIssuedAt?: string | null
  lastCodeUsedAt?: string | null
  code?: string | null
  isOverride?: boolean | null
  overrideReason?: string | null
  leadershipAssignmentId?: number | null
  positionAndLocation?: string | null
}

export type EligibleVoterFilters = PagingParams & {
  status?: EligibleVoterStatus | 'VOTED' | 'NOT_VOTED'
  q?: string
  fellowshipId?: number
  electionPositionId?: number
}

export type PagedResponseEligibleVoterResponse = {
  content?: EligibleVoterResponse[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
}
