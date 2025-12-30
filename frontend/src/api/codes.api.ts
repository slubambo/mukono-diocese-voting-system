import axiosInstance from './axios'
import { CODES_ENDPOINTS } from '../config/endpoints'
import type {
  CountResponse,
  IssueVotingCodeRequest,
  PagingParams,
  PagedResponseVotingCodeResponse,
  RegenerateVotingCodeRequest,
  VotingCodeResponse,
  VotingCodeStatus,
} from '../types/eligibility'

export const codesApi = {
  list: async (
    electionId: number | string,
    votingPeriodId: number | string,
    params: PagingParams & { status?: VotingCodeStatus }
  ): Promise<PagedResponseVotingCodeResponse> => {
    const { data } = await axiosInstance.get<PagedResponseVotingCodeResponse>(
      CODES_ENDPOINTS.LIST(electionId, votingPeriodId),
      { params }
    )
    return data
  },

  count: async (
    electionId: number | string,
    votingPeriodId: number | string,
    status?: VotingCodeStatus
  ): Promise<CountResponse> => {
    const { data } = await axiosInstance.get<CountResponse>(
      CODES_ENDPOINTS.COUNT(electionId, votingPeriodId),
      { params: { status } }
    )
    return data
  },

  issue: async (
    electionId: number | string,
    votingPeriodId: number | string,
    payload: IssueVotingCodeRequest
  ): Promise<VotingCodeResponse> => {
    const { data } = await axiosInstance.post<VotingCodeResponse>(
      CODES_ENDPOINTS.ISSUE(electionId, votingPeriodId),
      payload
    )
    return data
  },

  regenerate: async (
    electionId: number | string,
    votingPeriodId: number | string,
    payload: RegenerateVotingCodeRequest
  ): Promise<VotingCodeResponse> => {
    const { data } = await axiosInstance.post<VotingCodeResponse>(
      CODES_ENDPOINTS.REGENERATE(electionId, votingPeriodId),
      payload
    )
    return data
  },

  revoke: async (
    electionId: number | string,
    votingPeriodId: number | string,
    codeId: number | string,
    reason?: string
  ): Promise<void> => {
    await axiosInstance.delete(CODES_ENDPOINTS.REVOKE(electionId, votingPeriodId, codeId), {
      params: { reason },
    })
  },
}

export default codesApi
