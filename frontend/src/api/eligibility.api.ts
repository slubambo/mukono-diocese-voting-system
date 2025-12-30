import axiosInstance from './axios'
import { ELIGIBILITY_ENDPOINTS } from '../config/endpoints'
import type { EligibilityDecisionResponse } from '../types/eligibility'

export const eligibilityApi = {
  check: async (electionId: number | string, voterPersonId: number) => {
    const { data } = await axiosInstance.get<EligibilityDecisionResponse>(
      ELIGIBILITY_ENDPOINTS.CHECK(electionId),
      { params: { voterPersonId } }
    )
    return data
  },
}

export default eligibilityApi
