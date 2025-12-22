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
