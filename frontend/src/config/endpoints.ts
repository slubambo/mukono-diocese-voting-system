import { API_ENV } from './env'

export const AUTH_ENDPOINTS = {
  LOGIN: `${API_ENV.API_V1}/auth/login`,
  ME: `${API_ENV.API_V1}/users/me`,
} as const

export const VOTE_ENDPOINTS = {
  LOGIN: `${API_ENV.API_V1}/vote/login`,
  BALLOT: `${API_ENV.API_V1}/vote/ballot`,
  SUBMIT: `${API_ENV.API_V1}/vote/submit`,
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

// UI-C: People Registry
export const PEOPLE_ENDPOINTS = {
  LIST: `${API_ENV.API_V1}/people`,
  CREATE: `${API_ENV.API_V1}/people`,
  GET: (id: number) => `${API_ENV.API_V1}/people/${id}`,
  UPDATE: (id: number) => `${API_ENV.API_V1}/people/${id}`,
  DELETE: (id: number) => `${API_ENV.API_V1}/people/${id}`,
} as const

// UI-C: Leadership Assignments
export const LEADERSHIP_ASSIGNMENT_ENDPOINTS = {
  LIST: `${API_ENV.API_V1}/ds/leadership/assignments`,
  CREATE: `${API_ENV.API_V1}/ds/leadership/assignments`,
  GET: (id: number) => `${API_ENV.API_V1}/ds/leadership/assignments/${id}`,
  UPDATE: (id: number) => `${API_ENV.API_V1}/ds/leadership/assignments/${id}`,
  DELETE: (id: number) => `${API_ENV.API_V1}/ds/leadership/assignments/${id}`,
  ELIGIBLE_VOTERS: `${API_ENV.API_V1}/ds/leadership/assignments/eligible-voters`,
} as const

// Leadership enums (levels) - UI may request this if available
export const LEADERSHIP_META_ENDPOINTS = {
  LEVELS: `${API_ENV.API_V1}/ds/leadership/levels`,
} as const

// User management endpoints
export const USER_ENDPOINTS = {
  LIST: `${API_ENV.API_V1}/users`,
  CREATE: `${API_ENV.API_V1}/users`,
  GET: (id: number) => `${API_ENV.API_V1}/users/${id}`,
  UPDATE: (id: number) => `${API_ENV.API_V1}/users/${id}`,
  DELETE: (id: number) => `${API_ENV.API_V1}/users/${id}`,
  DEACTIVATE: (id: number) => `${API_ENV.API_V1}/users/${id}/deactivate`,
  ACTIVATE: (id: number) => `${API_ENV.API_V1}/users/${id}/activate`,
  RESET_PASSWORD: (id: number) => `${API_ENV.API_V1}/users/${id}/reset-password`,
  ROLES: `${API_ENV.API_V1}/users/roles`,
} as const

// UI-E: Eligibility helpers
export const ELIGIBILITY_ENDPOINTS = {
  CHECK: (electionId: number | string, votingPeriodId: number | string) =>
    `${API_ENV.API_V1}/elections/${electionId}/voting-periods/${votingPeriodId}/eligibility/me`,
} as const

// UI-E: Voter roll overrides
export const VOTER_ROLL_ENDPOINTS = {
  LIST: (electionId: number | string, votingPeriodId: number | string) =>
    `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/voter-roll`,
  COUNT: (electionId: number | string, votingPeriodId: number | string) =>
    `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/voter-roll/count`,
  UPSERT: (electionId: number | string, votingPeriodId: number | string, personId: number | string) =>
    `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/voter-roll/${personId}`,
  REMOVE: (electionId: number | string, votingPeriodId: number | string, personId: number | string) =>
    `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/voter-roll/${personId}`,
} as const

// UI-E: Voting codes
export const CODES_ENDPOINTS = {
  LIST: (electionId: number | string, votingPeriodId: number | string) => `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/codes`,
  COUNT: (electionId: number | string, votingPeriodId: number | string) => `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/codes/count`,
  ISSUE: (electionId: number | string, votingPeriodId: number | string) => `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/codes`,
  REGENERATE: (electionId: number | string, votingPeriodId: number | string) => `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/codes/regenerate`,
  REVOKE: (electionId: number | string, votingPeriodId: number | string, codeId: number | string) => `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/codes/${codeId}`,
} as const

// UI-E: Voting period positions overview
export const VOTING_PERIOD_POSITION_ENDPOINTS = {
  BY_PERIOD: (electionId: number | string, votingPeriodId: number | string) => `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/positions`,
  MAP: (electionId: number | string) => `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/positions-map`,
} as const

// UI-E: Eligible voters listing with vote status
export const ELIGIBLE_VOTERS_ENDPOINTS = {
  LIST: (electionId: number | string, votingPeriodId: number | string) => `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/eligible-voters`,
  COUNT: (electionId: number | string, votingPeriodId: number | string) => `${API_ENV.API_V1}/admin/elections/${electionId}/voting-periods/${votingPeriodId}/eligible-voters/count`,
} as const
