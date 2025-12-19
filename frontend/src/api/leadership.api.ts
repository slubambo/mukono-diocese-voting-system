/**
 * Leadership Assignments API Client
 */
import axiosInstance from './axios'
import { LEADERSHIP_ASSIGNMENT_ENDPOINTS } from '../config/endpoints'
import type {
  LeadershipAssignmentResponse,
  PageLeadershipAssignmentResponse,
  LeadershipAssignmentListParams,
  CreateLeadershipAssignmentRequest,
  UpdateLeadershipAssignmentRequest,
  PagePersonResponse,
  EligibleVotersParams,
} from '../types/leadership'

export const listAssignments = async (params: LeadershipAssignmentListParams): Promise<PageLeadershipAssignmentResponse> => {
  const { data } = await axiosInstance.get<PageLeadershipAssignmentResponse>(LEADERSHIP_ASSIGNMENT_ENDPOINTS.LIST, { params })
  return data
}

export const getAssignment = async (id: number): Promise<LeadershipAssignmentResponse> => {
  const { data } = await axiosInstance.get<LeadershipAssignmentResponse>(LEADERSHIP_ASSIGNMENT_ENDPOINTS.GET(id))
  return data
}

export const createAssignment = async (payload: CreateLeadershipAssignmentRequest): Promise<LeadershipAssignmentResponse> => {
  const { data } = await axiosInstance.post<LeadershipAssignmentResponse>(LEADERSHIP_ASSIGNMENT_ENDPOINTS.CREATE, payload)
  return data
}

export const updateAssignment = async (id: number, payload: UpdateLeadershipAssignmentRequest): Promise<LeadershipAssignmentResponse> => {
  const { data } = await axiosInstance.put<LeadershipAssignmentResponse>(LEADERSHIP_ASSIGNMENT_ENDPOINTS.UPDATE(id), payload)
  return data
}

export const deleteAssignment = async (id: number): Promise<void> => {
  await axiosInstance.delete(LEADERSHIP_ASSIGNMENT_ENDPOINTS.DELETE(id))
}

export const eligibleVoters = async (params: EligibleVotersParams): Promise<PagePersonResponse> => {
  const { data } = await axiosInstance.get<PagePersonResponse>(LEADERSHIP_ASSIGNMENT_ENDPOINTS.ELIGIBLE_VOTERS, { params })
  return data
}

export const leadershipApi = {
  list: listAssignments,
  get: getAssignment,
  create: createAssignment,
  update: updateAssignment,
  delete: deleteAssignment,
  eligibleVoters,
}
