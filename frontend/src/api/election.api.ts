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
  // Applicants
  listApplicants: (electionId: string, params: Record<string, unknown> = {}) =>
    api.get<import('../types/election').PagedResponse<any>>(`${BASE}/${electionId}/applicants`, { params }),
  listPendingApplicants: (electionId: string) =>
    api.get<any>(`${BASE}/${electionId}/applicants/pending`),
  countApplicants: (electionId: string) => api.get<number>(`${BASE}/${electionId}/applicants/count`),
  getApplicant: (electionId: string, applicantId: string | number) =>
    api.get<any>(`${BASE}/${electionId}/applicants/${applicantId}`),
  manualApplicant: (electionId: string, payload: unknown) =>
    api.post(`${BASE}/${electionId}/applicants/manual`, payload),
  nominateApplicant: (electionId: string, payload: unknown) =>
    api.post(`${BASE}/${electionId}/applicants/nominate`, payload),
  approveApplicant: (electionId: string, applicantId: string | number) =>
    api.post(`${BASE}/${electionId}/applicants/${applicantId}/approve`),
  rejectApplicant: (electionId: string, applicantId: string | number) =>
    api.post(`${BASE}/${electionId}/applicants/${applicantId}/reject`),
  revertApplicant: (electionId: string, applicantId: string | number) =>
    api.post(`${BASE}/${electionId}/applicants/${applicantId}/revert`),
  withdrawApplicant: (electionId: string, applicantId: string | number) =>
    api.post(`${BASE}/${electionId}/applicants/${applicantId}/withdraw`),
  
  // Candidates
  listCandidates: (electionId: string, params: Record<string, unknown> = {}) =>
    api.get<import('../types/election').PagedResponse<any>>(`${BASE}/${electionId}/candidates`, { params }),
  listCandidatesBallot: (electionId: string) => api.get<any>(`${BASE}/${electionId}/candidates/ballot`),
  createCandidateDirect: (electionId: string, payload: unknown) => api.post(`${BASE}/${electionId}/candidates/direct`, payload),
  createCandidateFromApplicant: (electionId: string, payload: unknown) => api.post(`${BASE}/${electionId}/candidates/from-applicant`, payload),
  generateCandidates: (electionId: string) => api.post(`${BASE}/${electionId}/candidates/generate`),
  deleteCandidatesBulk: (electionId: string, payload: unknown) => api.delete(`${BASE}/${electionId}/candidates`, { data: payload }),
}

export type { Election, Position }
