import { API_ENV } from './env'

export const AUTH_ENDPOINTS = {
  LOGIN: `${API_ENV.API_V1}/auth/login`,
  ME: `${API_ENV.API_V1}/users/me`,
} as const

export const VOTE_ENDPOINTS = {
  LOGIN: `${API_ENV.API_V1}/vote/login`,
} as const
