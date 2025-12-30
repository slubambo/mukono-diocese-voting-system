import axiosInstance from './axios'
import { VOTING_PERIOD_POSITION_ENDPOINTS } from '../config/endpoints'
import type { VotingPeriodPositionsMapResponse, VotingPeriodPositionsResponse } from '../types/election'

export const votingPeriodPositionsApi = {
  listByPeriod: async (
    electionId: number | string,
    votingPeriodId: number | string
  ): Promise<VotingPeriodPositionsResponse> => {
    const { data } = await axiosInstance.get<VotingPeriodPositionsResponse>(
      VOTING_PERIOD_POSITION_ENDPOINTS.BY_PERIOD(electionId, votingPeriodId)
    )
    return data
  },

  positionsMap: async (electionId: number | string): Promise<VotingPeriodPositionsMapResponse> => {
    const { data } = await axiosInstance.get<VotingPeriodPositionsMapResponse>(
      VOTING_PERIOD_POSITION_ENDPOINTS.MAP(electionId)
    )
    return data
  },
}

export default votingPeriodPositionsApi
