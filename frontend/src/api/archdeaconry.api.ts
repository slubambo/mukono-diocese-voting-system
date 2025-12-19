/**
 * Archdeaconry API Client
 */
import axiosInstance from './axios'
import { ARCHDEACONRY_ENDPOINTS } from '../config/endpoints'
import type {
  Archdeaconry,
  CreateArchdeaconryRequest,
  UpdateArchdeaconryRequest,
  PageArchdeaconryResponse,
  ArchdeaconryListParams,
} from '../types/organization'

/**
 * List archdeaconries with required dioceseId and optional search/pagination
 */
export const listArchdeaconries = async (
  params: ArchdeaconryListParams
): Promise<PageArchdeaconryResponse> => {
  const { data } = await axiosInstance.get<PageArchdeaconryResponse>(
    ARCHDEACONRY_ENDPOINTS.LIST,
    { params }
  )
  return data
}

/**
 * Get an archdeaconry by ID
 */
export const getArchdeaconry = async (id: number): Promise<Archdeaconry> => {
  const { data } = await axiosInstance.get<Archdeaconry>(
    ARCHDEACONRY_ENDPOINTS.GET(id)
  )
  return data
}

/**
 * Create a new archdeaconry
 */
export const createArchdeaconry = async (
  payload: CreateArchdeaconryRequest
): Promise<Archdeaconry> => {
  const { data } = await axiosInstance.post<Archdeaconry>(
    ARCHDEACONRY_ENDPOINTS.CREATE,
    payload
  )
  return data
}

/**
 * Update an existing archdeaconry
 */
export const updateArchdeaconry = async (
  id: number,
  payload: UpdateArchdeaconryRequest
): Promise<Archdeaconry> => {
  const { data } = await axiosInstance.put<Archdeaconry>(
    ARCHDEACONRY_ENDPOINTS.UPDATE(id),
    payload
  )
  return data
}

/**
 * Delete (deactivate) an archdeaconry
 */
export const deleteArchdeaconry = async (id: number): Promise<void> => {
  await axiosInstance.delete(ARCHDEACONRY_ENDPOINTS.DELETE(id))
}

export const archdeaconryApi = {
  list: listArchdeaconries,
  get: getArchdeaconry,
  create: createArchdeaconry,
  update: updateArchdeaconry,
  delete: deleteArchdeaconry,
}
