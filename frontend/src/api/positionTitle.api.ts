/**
 * Position Title API Client
 */
import axiosInstance from './axios'
import { POSITION_TITLE_ENDPOINTS } from '../config/endpoints'
import type {
  PositionTitle,
  CreatePositionTitleRequest,
  UpdatePositionTitleRequest,
  PagePositionTitleResponse,
  PositionTitleListParams,
} from '../types/leadership'

/**
 * List position titles with optional search and pagination
 */
export const listPositionTitles = async (
  params?: PositionTitleListParams
): Promise<PagePositionTitleResponse> => {
  const { data } = await axiosInstance.get<PagePositionTitleResponse>(
    POSITION_TITLE_ENDPOINTS.LIST,
    { params }
  )
  return data
}

/**
 * Get a position title by ID
 */
export const getPositionTitle = async (id: number): Promise<PositionTitle> => {
  const { data } = await axiosInstance.get<PositionTitle>(
    POSITION_TITLE_ENDPOINTS.GET(id)
  )
  return data
}

/**
 * Create a new position title
 */
export const createPositionTitle = async (
  payload: CreatePositionTitleRequest
): Promise<PositionTitle> => {
  const { data } = await axiosInstance.post<PositionTitle>(
    POSITION_TITLE_ENDPOINTS.CREATE,
    payload
  )
  return data
}

/**
 * Update an existing position title
 */
export const updatePositionTitle = async (
  id: number,
  payload: UpdatePositionTitleRequest
): Promise<PositionTitle> => {
  const { data } = await axiosInstance.put<PositionTitle>(
    POSITION_TITLE_ENDPOINTS.UPDATE(id),
    payload
  )
  return data
}

/**
 * Delete (deactivate) a position title
 */
export const deletePositionTitle = async (id: number): Promise<void> => {
  await axiosInstance.delete(POSITION_TITLE_ENDPOINTS.DELETE(id))
}

export const positionTitleApi = {
  list: listPositionTitles,
  get: getPositionTitle,
  create: createPositionTitle,
  update: updatePositionTitle,
  delete: deletePositionTitle,
}
