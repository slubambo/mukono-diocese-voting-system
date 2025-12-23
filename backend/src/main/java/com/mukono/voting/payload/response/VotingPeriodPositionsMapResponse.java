package com.mukono.voting.payload.response;

import java.util.List;
import java.util.Map;

/**
 * Response for bulk mapping of positions assigned to voting periods for an election.
 */
public class VotingPeriodPositionsMapResponse {

    private List<PeriodPositions> periods;
    private Map<Long, Long> positionToPeriod;

    public VotingPeriodPositionsMapResponse() {}

    public VotingPeriodPositionsMapResponse(List<PeriodPositions> periods, Map<Long, Long> positionToPeriod) {
        this.periods = periods;
        this.positionToPeriod = positionToPeriod;
    }

    public List<PeriodPositions> getPeriods() {
        return periods;
    }

    public void setPeriods(List<PeriodPositions> periods) {
        this.periods = periods;
    }

    public Map<Long, Long> getPositionToPeriod() {
        return positionToPeriod;
    }

    public void setPositionToPeriod(Map<Long, Long> positionToPeriod) {
        this.positionToPeriod = positionToPeriod;
    }

    public static class PeriodPositions {
        private Long votingPeriodId;
        private List<Long> electionPositionIds;

        public PeriodPositions() {}

        public PeriodPositions(Long votingPeriodId, List<Long> electionPositionIds) {
            this.votingPeriodId = votingPeriodId;
            this.electionPositionIds = electionPositionIds;
        }

        public Long getVotingPeriodId() {
            return votingPeriodId;
        }

        public void setVotingPeriodId(Long votingPeriodId) {
            this.votingPeriodId = votingPeriodId;
        }

        public List<Long> getElectionPositionIds() {
            return electionPositionIds;
        }

        public void setElectionPositionIds(List<Long> electionPositionIds) {
            this.electionPositionIds = electionPositionIds;
        }
    }
}
