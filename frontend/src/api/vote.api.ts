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
  electionId: number
  votingPeriodId: number
}

export const voteApi = {
  login: (payload: VoteLoginRequest, config?: AxiosRequestConfig) =>
    axiosClient.post<VoteLoginResponse>(VOTE_ENDPOINTS.LOGIN, payload, config).then(res => res.data),
}
