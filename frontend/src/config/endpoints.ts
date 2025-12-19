import { API_ENV } from './env'

export const AUTH_ENDPOINTS = {
  LOGIN: `${API_ENV.API_V1}/auth/login`,
  ME: `${API_ENV.API_V1}/users/me`,
} as const

export const VOTE_ENDPOINTS = {
  LOGIN: `${API_ENV.API_V1}/vote/login`,
} as const

// UI-B: Organizational Structure Endpoints
export const DIOCESE_ENDPOINTS = {
  LIST: `${API_ENV.API_V1}/ds/org/dioceses`,
  CREATE: `${API_ENV.API_V1}/ds/org/dioceses`,
  GET: (id: number) => `${API_ENV.API_V1}/ds/org/dioceses/${id}`,
  UPDATE: (id: number) => `${API_ENV.API_V1}/ds/org/dioceses/${id}`,
  DELETE: (id: number) => `${API_ENV.API_V1}/ds/org/dioceses/${id}`,
} as const

export const ARCHDEACONRY_ENDPOINTS = {
  LIST: `${API_ENV.API_V1}/ds/org/archdeaconries`,
  CREATE: `${API_ENV.API_V1}/ds/org/archdeaconries`,
  GET: (id: number) => `${API_ENV.API_V1}/ds/org/archdeaconries/${id}`,
  UPDATE: (id: number) => `${API_ENV.API_V1}/ds/org/archdeaconries/${id}`,
  DELETE: (id: number) => `${API_ENV.API_V1}/ds/org/archdeaconries/${id}`,
} as const

export const CHURCH_ENDPOINTS = {
  LIST: `${API_ENV.API_V1}/ds/org/churches`,
  CREATE: `${API_ENV.API_V1}/ds/org/churches`,
  GET: (id: number) => `${API_ENV.API_V1}/ds/org/churches/${id}`,
  UPDATE: (id: number) => `${API_ENV.API_V1}/ds/org/churches/${id}`,
  DELETE: (id: number) => `${API_ENV.API_V1}/ds/org/churches/${id}`,
} as const

export const FELLOWSHIP_ENDPOINTS = {
  LIST: `${API_ENV.API_V1}/ds/org/fellowships`,
  CREATE: `${API_ENV.API_V1}/ds/org/fellowships`,
  GET: (id: number) => `${API_ENV.API_V1}/ds/org/fellowships/${id}`,
  UPDATE: (id: number) => `${API_ENV.API_V1}/ds/org/fellowships/${id}`,
  DELETE: (id: number) => `${API_ENV.API_V1}/ds/org/fellowships/${id}`,
} as const

// UI-B: Master Data Endpoints
export const POSITION_TITLE_ENDPOINTS = {
  LIST: `${API_ENV.API_V1}/ds/leadership/titles`,
  CREATE: `${API_ENV.API_V1}/ds/leadership/titles`,
  GET: (id: number) => `${API_ENV.API_V1}/ds/leadership/titles/${id}`,
  UPDATE: (id: number) => `${API_ENV.API_V1}/ds/leadership/titles/${id}`,
  DELETE: (id: number) => `${API_ENV.API_V1}/ds/leadership/titles/${id}`,
} as const

export const FELLOWSHIP_POSITION_ENDPOINTS = {
  LIST: `${API_ENV.API_V1}/ds/leadership/positions`,
  CREATE: `${API_ENV.API_V1}/ds/leadership/positions`,
  GET: (id: number) => `${API_ENV.API_V1}/ds/leadership/positions/${id}`,
  UPDATE: (id: number) => `${API_ENV.API_V1}/ds/leadership/positions/${id}`,
  DELETE: (id: number) => `${API_ENV.API_V1}/ds/leadership/positions/${id}`,
} as const
