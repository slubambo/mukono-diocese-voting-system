/**
 * Leadership Types - Position Titles and Fellowship Positions
 * Based on OpenAPI Swagger specification
 */

import type { FellowshipSummary } from './organization'

export type EntityStatus = 'ACTIVE' | 'INACTIVE'
export type PositionScope = 'DIOCESE' | 'ARCHDEACONRY' | 'CHURCH'

// Position Title Types
export interface PositionTitle {
  id: number
  name: string
  status: EntityStatus
  usageCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreatePositionTitleRequest {
  name: string
}

export interface UpdatePositionTitleRequest {
  name?: string
  status?: EntityStatus
}

export interface PositionTitleSummary {
  id: number
  name: string
}

export interface PagePositionTitleResponse {
  content: PositionTitle[]
  totalElements: number
  totalPages: number
  numberOfElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// Fellowship Position Types (Positions)
export interface FellowshipPosition {
  id: number
  scope: PositionScope
  seats: number
  status: EntityStatus
  fellowship: FellowshipSummary
  title: PositionTitleSummary
  currentAssignmentsCount?: number
  availableSeats?: number
  createdAt: string
  updatedAt: string
}

export interface CreateFellowshipPositionRequest {
  fellowshipId: number
  titleId: number
  scope: PositionScope
  seats?: number
}

export interface UpdateFellowshipPositionRequest {
  titleId?: number
  scope?: PositionScope
  seats?: number
  status?: EntityStatus
}

export interface FellowshipPositionSummary {
  id: number
  scope: PositionScope
  seats: number
  status: EntityStatus
  fellowshipId: number
  fellowshipName: string
  titleId: number
  titleName: string
}

export interface PageFellowshipPositionResponse {
  content: FellowshipPosition[]
  totalElements: number
  totalPages: number
  numberOfElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// List params
export interface PositionTitleListParams {
  q?: string
  page?: number
  size?: number
  sort?: string
}

export interface FellowshipPositionListParams {
  fellowshipId: number
  scope?: PositionScope
  page?: number
  size?: number
  sort?: string
}

// People (UI-C)
export interface PersonResponse {
  id: number
  fullName: string
  email?: string | null
  phoneNumber?: string | null
  gender?: string | null
  dateOfBirth?: string | null
  status?: EntityStatus
  createdAt?: string
  updatedAt?: string
}

export interface CreatePersonRequest {
  fullName: string
  email?: string
  phoneNumber?: string
  gender?: string
  dateOfBirth?: string
}

export interface UpdatePersonRequest {
  fullName?: string
  email?: string
  phoneNumber?: string
  gender?: string
  dateOfBirth?: string
  status?: EntityStatus
}

export interface PagePersonResponse {
  content: PersonResponse[]
  totalElements: number
  totalPages: number
  numberOfElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface PeopleListParams {
  q?: string
  status?: EntityStatus
  page?: number
  size?: number
  sort?: string
}

// Leadership Assignments (UI-C)
export interface LeadershipAssignmentResponse {
  id: number
  person: PersonResponse
  fellowshipPositionId: number
  fellowship?: {
    id: number
    name: string
  }
  fellowshipPosition?: FellowshipPosition | FellowshipPositionSummary
  diocese?: { id: number; name: string; code?: string | null }
  archdeaconry?: { id: number; name: string; code?: string | null; dioceseId?: number }
  church?: { id: number; name: string; code?: string | null; archdeaconryId?: number }
  dioceseId?: number | null
  archdeaconryId?: number | null
  churchId?: number | null
  termStartDate: string
  termEndDate?: string | null
  notes?: string | null
  status: EntityStatus
  createdAt?: string
  updatedAt?: string
}

export interface PageLeadershipAssignmentResponse {
  content: LeadershipAssignmentResponse[]
  totalElements: number
  totalPages: number
  numberOfElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface CreateLeadershipAssignmentRequest {
  personId: number
  fellowshipPositionId: number
  termStartDate: string
  dioceseId?: number
  archdeaconryId?: number
  churchId?: number
  termEndDate?: string
  notes?: string
}

export type CreatePersonWithAssignmentRequest = CreatePersonRequest & Omit<CreateLeadershipAssignmentRequest, 'personId'>

export interface UpdateLeadershipAssignmentRequest {
  termStartDate?: string
  termEndDate?: string
  notes?: string
  status?: EntityStatus
  dioceseId?: number
  archdeaconryId?: number
  churchId?: number
}

export interface LeadershipAssignmentListParams {
  status?: EntityStatus
  fellowshipId?: number
  personId?: number
  archdeaconryId?: number
  churchId?: number
  dioceseId?: number
  scope?: PositionScope
  page?: number
  size?: number
  sort?: string
}

export interface EligibleVotersParams {
  fellowshipId: number
  scope: 'DIOCESE' | 'ARCHDEACONRY' | 'CHURCH'
  page?: number
  size?: number
  sort?: string
}
