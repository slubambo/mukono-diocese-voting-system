/**
 * Fellowship API Client
 */
import axiosInstance from './axios'
import { FELLOWSHIP_ENDPOINTS } from '../config/endpoints'
import type {
  Fellowship,
  CreateFellowshipRequest,
  UpdateFellowshipRequest,
  PageFellowshipResponse,
  OrganizationListParams,
} from '../types/organization'

/**
 * List fellowships with optional search and pagination
 */
export const listFellowships = async (
  params?: OrganizationListParams
): Promise<PageFellowshipResponse> => {
  const { data } = await axiosInstance.get<PageFellowshipResponse>(
    FELLOWSHIP_ENDPOINTS.LIST,
    { params }
  )
  return data
}

/**
 * Get a fellowship by ID
 */
export const getFellowship = async (id: number): Promise<Fellowship> => {
  const { data } = await axiosInstance.get<Fellowship>(
    FELLOWSHIP_ENDPOINTS.GET(id)
  )
  return data
}

/**
 * Create a new fellowship
 */
export const createFellowship = async (
  payload: CreateFellowshipRequest
): Promise<Fellowship> => {
  const { data } = await axiosInstance.post<Fellowship>(
    FELLOWSHIP_ENDPOINTS.CREATE,
    payload
  )
  return data
}

/**
 * Update an existing fellowship
 */
export const updateFellowship = async (
  id: number,
  payload: UpdateFellowshipRequest
): Promise<Fellowship> => {
  const { data } = await axiosInstance.put<Fellowship>(
    FELLOWSHIP_ENDPOINTS.UPDATE(id),
    payload
  )
  return data
}

/**
 * Delete (deactivate) a fellowship
 */
export const deleteFellowship = async (id: number): Promise<void> => {
  await axiosInstance.delete(FELLOWSHIP_ENDPOINTS.DELETE(id))
}

export const fellowshipApi = {
  list: listFellowships,
  get: getFellowship,
  create: createFellowship,
  update: updateFellowship,
  delete: deleteFellowship,
}
