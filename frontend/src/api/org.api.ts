import axios from 'axios'
import { API_ENV } from '@/config/env'

/**
 * Diocese API Response
 */
export interface DioceseResponse {
  id: number
  name: string
  code?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

/**
 * Diocese Create Request
 */
export interface CreateDioceseRequest {
  name: string
  code?: string
}

/**
 * Diocese Update Request
 */
export interface UpdateDioceseRequest {
  name?: string
  code?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

/**
 * Archdeaconry API Response
 */
export interface ArchdeaconryResponse {
  id: number
  name: string
  code?: string
  status: 'ACTIVE' | 'INACTIVE'
  diocese: {
    id: number
    name: string
    code?: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * Archdeaconry Create Request
 */
export interface CreateArchdeaconryRequest {
  dioceseId: number
  name: string
  code?: string
}

/**
 * Archdeaconry Update Request
 */
export interface UpdateArchdeaconryRequest {
  name?: string
  code?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

/**
 * Church API Response
 */
export interface ChurchResponse {
  id: number
  name: string
  code?: string
  status: 'ACTIVE' | 'INACTIVE'
  archdeaconry: {
    id: number
    name: string
    code?: string
    dioceseId: number
  }
  createdAt: string
  updatedAt: string
}

/**
 * Church Create Request
 */
export interface CreateChurchRequest {
  archdeaconryId: number
  name: string
  code?: string
}

/**
 * Church Update Request
 */
export interface UpdateChurchRequest {
  name?: string
  code?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

/**
 * Fellowship API Response
 */
export interface FellowshipResponse {
  id: number
  name: string
  code?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

/**
 * Fellowship Create Request
 */
export interface CreateFellowshipRequest {
  name: string
  code?: string
}

/**
 * Fellowship Update Request
 */
export interface UpdateFellowshipRequest {
  name?: string
  code?: string
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
 * Organisational Structure API Client
 */
export const orgApi = {
  // Diocese endpoints
  listDioceses(params?: { q?: string; page?: number; size?: number; sort?: string }) {
    return axios.get<PagedResponse<DioceseResponse>>(`${API_ENV.API_V1}/ds/org/dioceses`, { params })
  },
  createDiocese(data: CreateDioceseRequest) {
    return axios.post<DioceseResponse>(`${API_ENV.API_V1}/ds/org/dioceses`, data)
  },
  getDiocese(id: number) {
    return axios.get<DioceseResponse>(`${API_ENV.API_V1}/ds/org/dioceses/${id}`)
  },
  updateDiocese(id: number, data: UpdateDioceseRequest) {
    return axios.put<DioceseResponse>(`${API_ENV.API_V1}/ds/org/dioceses/${id}`, data)
  },
  deleteDiocese(id: number) {
    return axios.delete(`${API_ENV.API_V1}/ds/org/dioceses/${id}`)
  },

  // Archdeaconry endpoints
  listArchdeaconries(dioceseId: number, params?: { q?: string; page?: number; size?: number; sort?: string }) {
    return axios.get<PagedResponse<ArchdeaconryResponse>>(`${API_ENV.API_V1}/ds/org/archdeaconries`, {
      params: { dioceseId, ...params },
    })
  },
  createArchdeaconry(data: CreateArchdeaconryRequest) {
    return axios.post<ArchdeaconryResponse>(`${API_ENV.API_V1}/ds/org/archdeaconries`, data)
  },
  getArchdeaconry(id: number) {
    return axios.get<ArchdeaconryResponse>(`${API_ENV.API_V1}/ds/org/archdeaconries/${id}`)
  },
  updateArchdeaconry(id: number, data: UpdateArchdeaconryRequest) {
    return axios.put<ArchdeaconryResponse>(`${API_ENV.API_V1}/ds/org/archdeaconries/${id}`, data)
  },
  deleteArchdeaconry(id: number) {
    return axios.delete(`${API_ENV.API_V1}/ds/org/archdeaconries/${id}`)
  },

  // Church endpoints
  listChurches(archdeaconryId: number, params?: { q?: string; page?: number; size?: number; sort?: string }) {
    return axios.get<PagedResponse<ChurchResponse>>(`${API_ENV.API_V1}/ds/org/churches`, {
      params: { archdeaconryId, ...params },
    })
  },
  createChurch(data: CreateChurchRequest) {
    return axios.post<ChurchResponse>(`${API_ENV.API_V1}/ds/org/churches`, data)
  },
  getChurch(id: number) {
    return axios.get<ChurchResponse>(`${API_ENV.API_V1}/ds/org/churches/${id}`)
  },
  updateChurch(id: number, data: UpdateChurchRequest) {
    return axios.put<ChurchResponse>(`${API_ENV.API_V1}/ds/org/churches/${id}`, data)
  },
  deleteChurch(id: number) {
    return axios.delete(`${API_ENV.API_V1}/ds/org/churches/${id}`)
  },

  // Fellowship endpoints
  listFellowships(params?: { q?: string; page?: number; size?: number; sort?: string }) {
    return axios.get<PagedResponse<FellowshipResponse>>(`${API_ENV.API_V1}/ds/org/fellowships`, { params })
  },
  createFellowship(data: CreateFellowshipRequest) {
    return axios.post<FellowshipResponse>(`${API_ENV.API_V1}/ds/org/fellowships`, data)
  },
  getFellowship(id: number) {
    return axios.get<FellowshipResponse>(`${API_ENV.API_V1}/ds/org/fellowships/${id}`)
  },
  updateFellowship(id: number, data: UpdateFellowshipRequest) {
    return axios.put<FellowshipResponse>(`${API_ENV.API_V1}/ds/org/fellowships/${id}`, data)
  },
  deleteFellowship(id: number) {
    return axios.delete(`${API_ENV.API_V1}/ds/org/fellowships/${id}`)
  },
}
