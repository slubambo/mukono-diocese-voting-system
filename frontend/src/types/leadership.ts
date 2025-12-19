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
