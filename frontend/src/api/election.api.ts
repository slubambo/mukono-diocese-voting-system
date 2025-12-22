import { api } from './axios'
import type { Election, PagedResponse, Position } from '../types/election'

const BASE = '/api/v1/ds/elections'

export const electionApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<PagedResponse<Election>>(BASE, { params }),

  create: (payload: Partial<Election>) => api.post<Election>(BASE, payload),

  get: (id: string) => api.get<Election>(`${BASE}/${id}`),

  update: (id: string, payload: Partial<Election>) => api.put<Election>(`${BASE}/${id}`, payload),

  cancel: (id: string) => api.post<void>(`${BASE}/${id}/cancel`),

  // Positions within an election
  listPositions: (electionId: string) => api.get<import('../types/election').PagedResponse<Position>>(`${BASE}/${electionId}/positions`),
  createPosition: (electionId: string, payload: Partial<Position>) =>
    api.post<Position>(`${BASE}/${electionId}/positions`, payload),
}

export type { Election, Position }
