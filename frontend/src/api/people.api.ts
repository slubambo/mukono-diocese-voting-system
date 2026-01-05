/**
 * People API Client
 */
import axiosInstance from './axios'
import { PEOPLE_ENDPOINTS } from '../config/endpoints'
import type {
  PersonResponse,
  CreatePersonRequest,
  CreatePersonWithAssignmentRequest,
  UpdatePersonRequest,
  PagePersonResponse,
  PeopleListParams,
} from '../types/leadership'

export const listPeople = async (params: PeopleListParams): Promise<PagePersonResponse> => {
  const { data } = await axiosInstance.get<PagePersonResponse>(PEOPLE_ENDPOINTS.LIST, { params })
  return data
}

export const getPerson = async (id: number): Promise<PersonResponse> => {
  const { data } = await axiosInstance.get<PersonResponse>(PEOPLE_ENDPOINTS.GET(id))
  return data
}

export const createPerson = async (payload: CreatePersonRequest): Promise<PersonResponse> => {
  const { data } = await axiosInstance.post<PersonResponse>(PEOPLE_ENDPOINTS.CREATE, payload)
  return data
}

export const createPersonWithAssignment = async (payload: CreatePersonWithAssignmentRequest): Promise<PersonResponse> => {
  const { data } = await axiosInstance.post<PersonResponse>(PEOPLE_ENDPOINTS.CREATE_WITH_ASSIGNMENT, payload)
  return data
}

export const updatePerson = async (id: number, payload: UpdatePersonRequest): Promise<PersonResponse> => {
  const { data } = await axiosInstance.put<PersonResponse>(PEOPLE_ENDPOINTS.UPDATE(id), payload)
  return data
}

export const deletePerson = async (id: number): Promise<void> => {
  await axiosInstance.delete(PEOPLE_ENDPOINTS.DELETE(id))
}

export const peopleApi = {
  list: listPeople,
  get: getPerson,
  create: createPerson,
  createWithAssignment: createPersonWithAssignment,
  update: updatePerson,
  delete: deletePerson,
}
