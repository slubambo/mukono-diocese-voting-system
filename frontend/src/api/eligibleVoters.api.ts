import axiosInstance from './axios'
import { ELIGIBLE_VOTERS_ENDPOINTS } from '../config/endpoints'
import type { EligibleVoterFilters, EligibleVoterResponse, EligibleVoterStatus, PagedResponseEligibleVoterResponse, CountResponse } from '../types/eligibility'

export const eligibleVotersApi = {
  list: async (
    electionId: number | string,
    votingPeriodId: number | string,
    params: EligibleVoterFilters
  ): Promise<PagedResponseEligibleVoterResponse> => {
    const { data } = await axiosInstance.get<PagedResponseEligibleVoterResponse>(
      ELIGIBLE_VOTERS_ENDPOINTS.LIST(electionId, votingPeriodId),
      { params }
    )
    return data
  },
  count: async (
    electionId: number | string,
    votingPeriodId: number | string,
    status?: EligibleVoterStatus
  ): Promise<CountResponse> => {
    const { data } = await axiosInstance.get<CountResponse>(
      ELIGIBLE_VOTERS_ENDPOINTS.COUNT(electionId, votingPeriodId),
      { params: { status } }
    )
    return data
  },
}

export default eligibleVotersApi
