import axiosInstance from './axios'
import { VOTER_ROLL_ENDPOINTS } from '../config/endpoints'
import type {
  CountResponse,
  PagingParams,
  VoterRollEntryResponse,
  VoterRollOverrideRequest,
  PagedResponseVoterRollEntryResponse,
} from '../types/eligibility'

export const voterRollApi = {
  list: async (
    electionId: number | string,
    params: PagingParams & { eligible?: boolean }
  ): Promise<PagedResponseVoterRollEntryResponse> => {
    const { data } = await axiosInstance.get<PagedResponseVoterRollEntryResponse>(
      VOTER_ROLL_ENDPOINTS.LIST(electionId),
      { params }
    )
    return data
  },

  count: async (electionId: number | string, eligible?: boolean): Promise<CountResponse> => {
    const { data } = await axiosInstance.get<CountResponse>(
      VOTER_ROLL_ENDPOINTS.COUNT(electionId),
      { params: { eligible } }
    )
    return data
  },

  upsert: async (
    electionId: number | string,
    personId: number | string,
    payload: VoterRollOverrideRequest
  ): Promise<VoterRollEntryResponse> => {
    const { data } = await axiosInstance.put<VoterRollEntryResponse>(
      VOTER_ROLL_ENDPOINTS.UPSERT(electionId, personId),
      payload
    )
    return data
  },

  remove: async (electionId: number | string, personId: number | string): Promise<void> => {
    await axiosInstance.delete(VOTER_ROLL_ENDPOINTS.REMOVE(electionId, personId))
  },
}

export default voterRollApi
