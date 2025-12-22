export type ElectionStatus = 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'CANCELLED' | 'COMPLETED' | string

export interface Election {
  id: string
  name: string
  description?: string
  status?: ElectionStatus
  startDate?: string | null
  endDate?: string | null
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
