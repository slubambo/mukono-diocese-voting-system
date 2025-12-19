/**
 * Diocese API Client
 */
import axiosInstance from './axios'
import { DIOCESE_ENDPOINTS } from '../config/endpoints'
import type {
  Diocese,
  CreateDioceseRequest,
  UpdateDioceseRequest,
  PageDioceseResponse,
  OrganizationListParams,
} from '../types/organization'

/**
 * List dioceses with optional search and pagination
 */
export const listDioceses = async (
  params?: OrganizationListParams
): Promise<PageDioceseResponse> => {
  const { data } = await axiosInstance.get<PageDioceseResponse>(
    DIOCESE_ENDPOINTS.LIST,
    { params }
  )
  return data
}

/**
 * Get a diocese by ID
 */
export const getDiocese = async (id: number): Promise<Diocese> => {
  const { data } = await axiosInstance.get<Diocese>(DIOCESE_ENDPOINTS.GET(id))
  return data
}

/**
 * Create a new diocese
 */
export const createDiocese = async (
  payload: CreateDioceseRequest
): Promise<Diocese> => {
  const { data } = await axiosInstance.post<Diocese>(
    DIOCESE_ENDPOINTS.CREATE,
    payload
  )
  return data
}

/**
 * Update an existing diocese
 */
export const updateDiocese = async (
  id: number,
  payload: UpdateDioceseRequest
): Promise<Diocese> => {
  const { data } = await axiosInstance.put<Diocese>(
    DIOCESE_ENDPOINTS.UPDATE(id),
    payload
  )
  return data
}

/**
 * Delete (deactivate) a diocese
 */
export const deleteDiocese = async (id: number): Promise<void> => {
  await axiosInstance.delete(DIOCESE_ENDPOINTS.DELETE(id))
}

export const dioceseApi = {
  list: listDioceses,
  get: getDiocese,
  create: createDiocese,
  update: updateDiocese,
  delete: deleteDiocese,
}
