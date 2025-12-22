import axiosInstance from './axios'
import { USER_ENDPOINTS } from '../config/endpoints'
import type { User, CreateUserRequest, UpdateUserRequest, PageUserResponse, UsersListParams } from '../types/user'

export const listUsers = async (params: UsersListParams = {}): Promise<PageUserResponse> => {
  const { data } = await axiosInstance.get<PageUserResponse>(USER_ENDPOINTS.LIST, { params })
  return data
}

export const getUser = async (id: number): Promise<User> => {
  const { data } = await axiosInstance.get<User>(USER_ENDPOINTS.GET(id))
  return data
}

export const createUser = async (payload: CreateUserRequest): Promise<User> => {
  const { data } = await axiosInstance.post<User>(USER_ENDPOINTS.CREATE, payload)
  return data
}

export const updateUser = async (id: number, payload: UpdateUserRequest): Promise<User> => {
  const { data } = await axiosInstance.put<User>(USER_ENDPOINTS.UPDATE(id), payload)
  return data
}

export const deleteUser = async (id: number): Promise<void> => {
  await axiosInstance.delete(USER_ENDPOINTS.DELETE(id))
}

export const deactivateUser = async (id: number): Promise<void> => {
  await axiosInstance.post(USER_ENDPOINTS.DEACTIVATE(id))
}

export const activateUser = async (id: number): Promise<void> => {
  await axiosInstance.post(USER_ENDPOINTS.ACTIVATE(id))
}

export const resetUserPassword = async (id: number, newPassword?: string): Promise<void> => {
  // optional newPassword passed as query param per backend contract
  await axiosInstance.post(USER_ENDPOINTS.RESET_PASSWORD(id), null, { params: newPassword ? { newPassword } : {} })
}

export const listRoles = async (): Promise<string[]> => {
  const { data } = await axiosInstance.get<string[]>(USER_ENDPOINTS.ROLES)
  return data
}

export const userApi = {
  list: listUsers,
  get: getUser,
  create: createUser,
  update: updateUser,
  delete: deleteUser,
  deactivate: deactivateUser,
  activate: activateUser,
  resetPassword: resetUserPassword,
  listRoles,
}
