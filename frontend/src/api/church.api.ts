/**
 * Church API Client
 */
import axiosInstance from './axios'
import { CHURCH_ENDPOINTS } from '../config/endpoints'
import type {
  Church,
  CreateChurchRequest,
  UpdateChurchRequest,
  PageChurchResponse,
  ChurchListParams,
} from '../types/organization'

/**
 * List churches with required archdeaconryId and optional search/pagination
 */
export const listChurches = async (
  params: ChurchListParams
): Promise<PageChurchResponse> => {
  const { data } = await axiosInstance.get<PageChurchResponse>(
    CHURCH_ENDPOINTS.LIST,
    { params }
  )
  return data
}

/**
 * Get a church by ID
 */
export const getChurch = async (id: number): Promise<Church> => {
  const { data } = await axiosInstance.get<Church>(CHURCH_ENDPOINTS.GET(id))
  return data
}

/**
 * Create a new church
 */
export const createChurch = async (
  payload: CreateChurchRequest
): Promise<Church> => {
  const { data } = await axiosInstance.post<Church>(
    CHURCH_ENDPOINTS.CREATE,
    payload
  )
  return data
}

/**
 * Update an existing church
 */
export const updateChurch = async (
  id: number,
  payload: UpdateChurchRequest
): Promise<Church> => {
  const { data } = await axiosInstance.put<Church>(
    CHURCH_ENDPOINTS.UPDATE(id),
    payload
  )
  return data
}

/**
 * Delete (deactivate) a church
 */
export const deleteChurch = async (id: number): Promise<void> => {
  await axiosInstance.delete(CHURCH_ENDPOINTS.DELETE(id))
}

export const churchApi = {
  list: listChurches,
  get: getChurch,
  create: createChurch,
  update: updateChurch,
  delete: deleteChurch,
}
