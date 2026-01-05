import type { AxiosRequestConfig } from 'axios'
import axiosClient from './axios'
import { VOTE_ENDPOINTS } from '../config/endpoints'

export interface VoteLoginRequest {
  code: string
}

export interface VoteLoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  personId: number
  fullName: string
  electionId: number
  votingPeriodId: number
  hasPhone: boolean
  phoneMasked: string | null
  positions: Array<{
    positionName: string
    fellowshipName: string
    scopeName: string
  }>
}

export interface VotePhoneVerifyRequest {
  last3: string
}

export interface VotePhoneVerifyResponse {
  verified: boolean
  reason: string
}

export interface Candidate {
  id: number
  name: string
  picture?: string
}

export interface Position {
  id: number
  title: string
  description?: string
  maxVotes: number
  candidates: Candidate[]
}

export interface BallotData {
  electionId: number
  votingPeriodId: number
  positions: Position[]
}

export interface VoteSubmissionPayload {
  votes: Array<{
    positionId: number
    candidateIds: number[]
  }>
}

export interface VoteSubmissionResponse {
  success: boolean
  message: string
}

export const voteApi = {
  /**
   * Login with voting code
   * POST /api/v1/vote/login
   */
  login: (payload: VoteLoginRequest, config?: AxiosRequestConfig) =>
    axiosClient.post<VoteLoginResponse>(VOTE_ENDPOINTS.LOGIN, payload, config).then(res => res.data),

  /**
   * Verify voter phone suffix
   * POST /api/v1/vote/verify-phone
   */
  verifyPhone: (payload: VotePhoneVerifyRequest, config?: AxiosRequestConfig) =>
    axiosClient.post<VotePhoneVerifyResponse>(VOTE_ENDPOINTS.VERIFY_PHONE, payload, config).then(res => res.data),

  /**
   * Get ballot data for current voting period
   * GET /api/v1/vote/ballot
   */
  getBallot: (config?: AxiosRequestConfig) =>
    axiosClient.get<BallotData>(VOTE_ENDPOINTS.BALLOT, config).then(res => res.data),

  /**
   * Submit vote selections
   * POST /api/v1/vote/submit
   */
  submitVote: (payload: VoteSubmissionPayload, config?: AxiosRequestConfig) =>
    axiosClient.post<VoteSubmissionResponse>(VOTE_ENDPOINTS.SUBMIT, payload, config).then(res => res.data),
}
