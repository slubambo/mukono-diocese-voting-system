import axios from 'axios'
import { API_ENV } from '@/config/env'

/**
 * Position Title API Response
 */
export interface PositionTitleResponse {
  id: number
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

/**
 * Position Title Create Request
 */
export interface CreatePositionTitleRequest {
  name: string
}

/**
 * Position Title Update Request
 */
export interface UpdatePositionTitleRequest {
  name?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

/**
 * Fellowship Position API Response
 */
export interface FellowshipPositionResponse {
  id: number
  scope: 'DIOCESE' | 'ARCHDEACONRY' | 'CHURCH'
  seats: number
  status: 'ACTIVE' | 'INACTIVE'
  fellowship: {
    id: number
    name: string
    code?: string
  }
  title: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * Fellowship Position Create Request
 */
export interface CreateFellowshipPositionRequest {
  fellowshipId: number
  titleId: number
  scope: 'DIOCESE' | 'ARCHDEACONRY' | 'CHURCH'
  seats?: number
}

/**
 * Fellowship Position Update Request
 */
export interface UpdateFellowshipPositionRequest {
  titleId?: number
  scope?: 'DIOCESE' | 'ARCHDEACONRY' | 'CHURCH'
  seats?: number
  status?: 'ACTIVE' | 'INACTIVE'
}

/**
 * Paginated Response
 */
export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  numberOfElements: number
  first: boolean
  last: boolean
  size: number
  number: number
  empty: boolean
}

/**
 * Master Data API Client
 */
export const masterDataApi = {
  // Position Title endpoints
  listPositionTitles(params?: { q?: string; page?: number; size?: number; sort?: string }) {
    return axios.get<PagedResponse<PositionTitleResponse>>(`${API_ENV.API_V1}/ds/leadership/titles`, { params })
  },
  createPositionTitle(data: CreatePositionTitleRequest) {
    return axios.post<PositionTitleResponse>(`${API_ENV.API_V1}/ds/leadership/titles`, data)
  },
  getPositionTitle(id: number) {
    return axios.get<PositionTitleResponse>(`${API_ENV.API_V1}/ds/leadership/titles/${id}`)
  },
  updatePositionTitle(id: number, data: UpdatePositionTitleRequest) {
    return axios.put<PositionTitleResponse>(`${API_ENV.API_V1}/ds/leadership/titles/${id}`, data)
  },
  deletePositionTitle(id: number) {
    return axios.delete(`${API_ENV.API_V1}/ds/leadership/titles/${id}`)
  },

  // Fellowship Position endpoints
  listFellowshipPositions(
    fellowshipId: number,
    params?: { scope?: string; page?: number; size?: number; sort?: string },
  ) {
    return axios.get<PagedResponse<FellowshipPositionResponse>>(`${API_ENV.API_V1}/ds/leadership/positions`, {
      params: { fellowshipId, ...params },
    })
  },
  createFellowshipPosition(data: CreateFellowshipPositionRequest) {
    return axios.post<FellowshipPositionResponse>(`${API_ENV.API_V1}/ds/leadership/positions`, data)
  },
  getFellowshipPosition(id: number) {
    return axios.get<FellowshipPositionResponse>(`${API_ENV.API_V1}/ds/leadership/positions/${id}`)
  },
  updateFellowshipPosition(id: number, data: UpdateFellowshipPositionRequest) {
    return axios.put<FellowshipPositionResponse>(`${API_ENV.API_V1}/ds/leadership/positions/${id}`, data)
  },
  deleteFellowshipPosition(id: number) {
    return axios.delete(`${API_ENV.API_V1}/ds/leadership/positions/${id}`)
  },
}
