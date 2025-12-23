import { api } from './axios'
import type { Election, PagedResponse, Position } from '../types/election'

const BASE = '/api/v1/ds/elections'

export const electionApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<PagedResponse<Election>>(BASE, { params }),

  create: (payload: Partial<Election>) => api.post<Election>(BASE, payload),

  get: (id: string | number) => api.get<Election>(`${BASE}/${id}`),

  update: (id: string | number, payload: Partial<Election>) => api.put<Election>(`${BASE}/${id}`, payload),

  cancel: (id: string | number, payload: { reason: string }) => api.post<void>(`${BASE}/${id}/cancel`, payload),

  // Positions within an election
  listPositions: (electionId: string | number) => api.get<import('../types/election').PagedResponse<Position>>(`${BASE}/${electionId}/positions`),
  createPosition: (electionId: string | number, payload: Partial<Position>) =>
    api.post<Position>(`${BASE}/${electionId}/positions`, payload),
  deletePosition: (electionId: string | number, positionId: string | number) =>
    api.delete(`${BASE}/${electionId}/positions/${positionId}`),
  // Applicants
  listApplicants: (electionId: string | number, params: Record<string, unknown> = {}) =>
    api.get<import('../types/election').PagedResponse<any>>(`${BASE}/${electionId}/applicants`, { params }),
  listPendingApplicants: (electionId: string | number) =>
    api.get<any>(`${BASE}/${electionId}/applicants/pending`),
  countApplicants: (electionId: string | number) => api.get<number>(`${BASE}/${electionId}/applicants/count`),
  getApplicant: (electionId: string | number, applicantId: string | number) =>
    api.get<any>(`${BASE}/${electionId}/applicants/${applicantId}`),
  manualApplicant: (electionId: string | number, payload: unknown) =>
    api.post(`${BASE}/${electionId}/applicants/manual`, payload),
  nominateApplicant: (electionId: string | number, payload: unknown) =>
    api.post(`${BASE}/${electionId}/applicants/nominate`, payload),
  approveApplicant: (electionId: string | number, applicantId: string | number) =>
    api.post(`${BASE}/${electionId}/applicants/${applicantId}/approve`),
  rejectApplicant: (electionId: string | number, applicantId: string | number) =>
    api.post(`${BASE}/${electionId}/applicants/${applicantId}/reject`),
  revertApplicant: (electionId: string | number, applicantId: string | number) =>
    api.post(`${BASE}/${electionId}/applicants/${applicantId}/revert`),
  withdrawApplicant: (electionId: string | number, applicantId: string | number) =>
    api.post(`${BASE}/${electionId}/applicants/${applicantId}/withdraw`),
  
  // Candidates
  listCandidates: (electionId: string | number, params: Record<string, unknown> = {}) =>
    api.get<import('../types/election').PagedResponse<any>>(`${BASE}/${electionId}/candidates`, { params }),
  listCandidatesBallot: (electionId: string | number) => api.get<any>(`${BASE}/${electionId}/candidates/ballot`),
  // ballot with optional params (e.g., electionPositionId)
  listCandidatesBallotWithParams: (electionId: string | number, params: Record<string, unknown> = {}) =>
    api.get<any>(`${BASE}/${electionId}/candidates/ballot`, { params }),
  createCandidateDirect: (electionId: string | number, payload: unknown) => api.post(`${BASE}/${electionId}/candidates/direct`, payload),
  createCandidateFromApplicant: (electionId: string | number, payload: unknown) => api.post(`${BASE}/${electionId}/candidates/from-applicant`, payload),
  generateCandidates: (electionId: string | number) => api.post(`${BASE}/${electionId}/candidates/generate`),
  deleteCandidatesBulk: (electionId: string | number, payload: unknown) => api.delete(`${BASE}/${electionId}/candidates`, { data: payload }),
  // Admin voting periods
  listVotingPeriods: (electionId: string | number) => api.get<import('../types/election').PagedResponse<any>>(`/api/v1/admin/elections/${electionId}/voting-periods`),
  createVotingPeriod: (electionId: string | number, payload: unknown) => api.post(`/api/v1/admin/elections/${electionId}/voting-periods`, payload),
  getVotingPeriod: (electionId: string | number, votingPeriodId: string | number) => api.get(`/api/v1/admin/elections/${electionId}/voting-periods/${votingPeriodId}`),
  updateVotingPeriod: (electionId: string | number, votingPeriodId: string | number, payload: unknown) => api.put(`/api/v1/admin/elections/${electionId}/voting-periods/${votingPeriodId}`, payload),
  getVotingPeriodPositions: (electionId: string | number, votingPeriodId: string | number) =>
    api.get<import('../types/election').VotingPeriodPositionsResponse>(`/api/v1/admin/elections/${electionId}/voting-periods/${votingPeriodId}/positions`),
  assignVotingPeriodPositions: (electionId: string | number, votingPeriodId: string | number, payload: { electionPositionIds: number[] }) =>
    api.post(`/api/v1/admin/elections/${electionId}/voting-periods/${votingPeriodId}/positions`, payload),
  openVotingPeriod: (electionId: string | number, votingPeriodId: string | number) => api.post(`/api/v1/admin/elections/${electionId}/voting-periods/${votingPeriodId}/open`),
  closeVotingPeriod: (electionId: string | number, votingPeriodId: string | number) => api.post(`/api/v1/admin/elections/${electionId}/voting-periods/${votingPeriodId}/close`),
  cancelVotingPeriod: (electionId: string | number, votingPeriodId: string | number) => api.post(`/api/v1/admin/elections/${electionId}/voting-periods/${votingPeriodId}/cancel`),
}

export type { Election, Position }
