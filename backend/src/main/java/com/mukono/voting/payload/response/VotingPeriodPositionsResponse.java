package com.mukono.voting.payload.response;

import java.util.List;
import java.util.Map;

/**
 * Response payload for voting period position assignments.
 * Groups positions by fellowship for UI convenience.
 */
public class VotingPeriodPositionsResponse {

    private Long votingPeriodId;
    private Long electionId;
    private List<Long> electionPositionIds;
    private List<FellowshipPositionsGroup> byFellowship;

    public VotingPeriodPositionsResponse() {
    }

    public VotingPeriodPositionsResponse(Long votingPeriodId, Long electionId, 
                                        List<Long> electionPositionIds,
                                        List<FellowshipPositionsGroup> byFellowship) {
        this.votingPeriodId = votingPeriodId;
        this.electionId = electionId;
        this.electionPositionIds = electionPositionIds;
        this.byFellowship = byFellowship;
    }

    // Getters and Setters
    public Long getVotingPeriodId() {
        return votingPeriodId;
    }

    public void setVotingPeriodId(Long votingPeriodId) {
        this.votingPeriodId = votingPeriodId;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public List<Long> getElectionPositionIds() {
        return electionPositionIds;
    }

    public void setElectionPositionIds(List<Long> electionPositionIds) {
        this.electionPositionIds = electionPositionIds;
    }

    public List<FellowshipPositionsGroup> getByFellowship() {
        return byFellowship;
    }

    public void setByFellowship(List<FellowshipPositionsGroup> byFellowship) {
        this.byFellowship = byFellowship;
    }

    /**
     * Nested class representing positions grouped by fellowship.
     */
    public static class FellowshipPositionsGroup {
        private Long fellowshipId;
        private String fellowshipName;
        private List<PositionSummary> positions;

        public FellowshipPositionsGroup() {
        }

        public FellowshipPositionsGroup(Long fellowshipId, String fellowshipName, 
                                       List<PositionSummary> positions) {
            this.fellowshipId = fellowshipId;
            this.fellowshipName = fellowshipName;
            this.positions = positions;
        }

        public Long getFellowshipId() {
            return fellowshipId;
        }

        public void setFellowshipId(Long fellowshipId) {
            this.fellowshipId = fellowshipId;
        }

        public String getFellowshipName() {
            return fellowshipName;
        }

        public void setFellowshipName(String fellowshipName) {
            this.fellowshipName = fellowshipName;
        }

        public List<PositionSummary> getPositions() {
            return positions;
        }

        public void setPositions(List<PositionSummary> positions) {
            this.positions = positions;
        }
    }

    /**
     * Nested class representing a position summary.
     */
    public static class PositionSummary {
        private Long electionPositionId;
        private Long fellowshipPositionId;
        private String positionTitle;
        private Integer seats;
        private Integer maxVotesPerVoter;

        public PositionSummary() {
        }

        public PositionSummary(Long electionPositionId, Long fellowshipPositionId,
                              String positionTitle, Integer seats, Integer maxVotesPerVoter) {
            this.electionPositionId = electionPositionId;
            this.fellowshipPositionId = fellowshipPositionId;
            this.positionTitle = positionTitle;
            this.seats = seats;
            this.maxVotesPerVoter = maxVotesPerVoter;
        }

        public Long getElectionPositionId() {
            return electionPositionId;
        }

        public void setElectionPositionId(Long electionPositionId) {
            this.electionPositionId = electionPositionId;
        }

        public Long getFellowshipPositionId() {
            return fellowshipPositionId;
        }

        public void setFellowshipPositionId(Long fellowshipPositionId) {
            this.fellowshipPositionId = fellowshipPositionId;
        }

        public String getPositionTitle() {
            return positionTitle;
        }

        public void setPositionTitle(String positionTitle) {
            this.positionTitle = positionTitle;
        }

        public Integer getSeats() {
            return seats;
        }

        public void setSeats(Integer seats) {
            this.seats = seats;
        }

        public Integer getMaxVotesPerVoter() {
            return maxVotesPerVoter;
        }

        public void setMaxVotesPerVoter(Integer maxVotesPerVoter) {
            this.maxVotesPerVoter = maxVotesPerVoter;
        }
    }
}
