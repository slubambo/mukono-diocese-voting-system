/**
 * Organization Types - Diocese, Archdeaconry, Church, Fellowship
 * Based on OpenAPI Swagger specification
 */

export type EntityStatus = 'ACTIVE' | 'INACTIVE'

// Diocese Types
export interface Diocese {
  id: number
  name: string
  code?: string
  status: EntityStatus
  archdeaconryCount?: number
  churchCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateDioceseRequest {
  name: string
  code?: string
}

export interface UpdateDioceseRequest {
  name?: string
  code?: string
  status?: EntityStatus
}

export interface DioceseSummary {
  id: number
  name: string
  code?: string
}

export interface PageDioceseResponse {
  content: Diocese[]
  totalElements: number
  totalPages: number
  numberOfElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// Archdeaconry Types
export interface Archdeaconry {
  id: number
  name: string
  code?: string
  status: EntityStatus
  diocese: DioceseSummary
  churchCount?: number
  currentLeadersCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateArchdeaconryRequest {
  dioceseId: number
  name: string
  code?: string
}

export interface UpdateArchdeaconryRequest {
  name?: string
  code?: string
  status?: EntityStatus
}

export interface ArchdeaconrySummary {
  id: number
  name: string
  code?: string
  dioceseId: number
}

export interface PageArchdeaconryResponse {
  content: Archdeaconry[]
  totalElements: number
  totalPages: number
  numberOfElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// Church Types
export interface Church {
  id: number
  name: string
  code?: string
  status: EntityStatus
  archdeaconry: ArchdeaconrySummary
  diocese?: DioceseSummary
  currentLeadersCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateChurchRequest {
  archdeaconryId: number
  name: string
  code?: string
}

export interface UpdateChurchRequest {
  name?: string
  code?: string
  status?: EntityStatus
}

export interface ChurchSummary {
  id: number
  name: string
  code?: string
  archdeaconryId: number
}

export interface PageChurchResponse {
  content: Church[]
  totalElements: number
  totalPages: number
  numberOfElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// Fellowship Types
export interface Fellowship {
  id: number
  name: string
  code?: string
  status: EntityStatus
  positionsCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateFellowshipRequest {
  name: string
  code?: string
}

export interface UpdateFellowshipRequest {
  name?: string
  code?: string
  status?: EntityStatus
}

export interface FellowshipSummary {
  id: number
  name: string
  code?: string
}

export interface PageFellowshipResponse {
  content: Fellowship[]
  totalElements: number
  totalPages: number
  numberOfElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// Common pagination params
export interface OrganizationListParams {
  q?: string
  page?: number
  size?: number
  sort?: string
}

export interface ChurchListParams extends OrganizationListParams {
  archdeaconryId: number
}

export interface ArchdeaconryListParams extends OrganizationListParams {
  dioceseId: number
}
