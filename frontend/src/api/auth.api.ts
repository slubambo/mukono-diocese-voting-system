import type { AxiosRequestConfig } from 'axios'
import axiosClient from './axios'
import { AUTH_ENDPOINTS } from '../config/endpoints'

export type Role =
  | 'ROLE_ADMIN'
  | 'ROLE_DS'
  | 'ROLE_BISHOP'
  | 'ROLE_SENIOR_STAFF'
  | 'ROLE_POLLING_OFFICER'
  | 'ROLE_VOTER'

export interface LoginRequest {
  username: string
  password: string
}

export interface JwtAuthenticationResponse {
  accessToken: string
  tokenType: string
  username: string
  roles: Role[]
}

export interface CurrentUserResponse {
  username: string
  roles: Role[]
}

export const authApi = {
  login: (payload: LoginRequest, config?: AxiosRequestConfig) =>
    axiosClient.post<JwtAuthenticationResponse>(AUTH_ENDPOINTS.LOGIN, payload, config).then(res => res.data),
  me: (config?: AxiosRequestConfig) =>
    axiosClient.get<CurrentUserResponse>(AUTH_ENDPOINTS.ME, config).then(res => res.data),
}
