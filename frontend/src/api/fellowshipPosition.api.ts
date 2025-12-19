/**
 * Fellowship Position API Client
 */
import axiosInstance from './axios'
import { FELLOWSHIP_POSITION_ENDPOINTS } from '../config/endpoints'
import type {
  FellowshipPosition,
  CreateFellowshipPositionRequest,
  UpdateFellowshipPositionRequest,
  PageFellowshipPositionResponse,
  FellowshipPositionListParams,
} from '../types/leadership'

/**
 * List fellowship positions with required fellowshipId and optional params
 */
export const listFellowshipPositions = async (
  params: FellowshipPositionListParams
): Promise<PageFellowshipPositionResponse> => {
  const { data } = await axiosInstance.get<PageFellowshipPositionResponse>(
    FELLOWSHIP_POSITION_ENDPOINTS.LIST,
    { params }
  )
  return data
}

/**
 * Get a fellowship position by ID
 */
export const getFellowshipPosition = async (
  id: number
): Promise<FellowshipPosition> => {
  const { data } = await axiosInstance.get<FellowshipPosition>(
    FELLOWSHIP_POSITION_ENDPOINTS.GET(id)
  )
  return data
}

/**
 * Create a new fellowship position
 */
export const createFellowshipPosition = async (
  payload: CreateFellowshipPositionRequest
): Promise<FellowshipPosition> => {
  const { data } = await axiosInstance.post<FellowshipPosition>(
    FELLOWSHIP_POSITION_ENDPOINTS.CREATE,
    payload
  )
  return data
}

/**
 * Update an existing fellowship position
 */
export const updateFellowshipPosition = async (
  id: number,
  payload: UpdateFellowshipPositionRequest
): Promise<FellowshipPosition> => {
  const { data } = await axiosInstance.put<FellowshipPosition>(
    FELLOWSHIP_POSITION_ENDPOINTS.UPDATE(id),
    payload
  )
  return data
}

/**
 * Delete (deactivate) a fellowship position
 */
export const deleteFellowshipPosition = async (id: number): Promise<void> => {
  await axiosInstance.delete(FELLOWSHIP_POSITION_ENDPOINTS.DELETE(id))
}

export const fellowshipPositionApi = {
  list: listFellowshipPositions,
  get: getFellowshipPosition,
  create: createFellowshipPosition,
  update: updateFellowshipPosition,
  delete: deleteFellowshipPosition,
}
