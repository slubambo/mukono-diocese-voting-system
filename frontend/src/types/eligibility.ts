export type EligibilityDecisionResponse = {
  eligible?: boolean
  rule?: string
  reason?: string
}

export type VoterRollOverrideRequest = {
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
