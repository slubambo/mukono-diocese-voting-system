package com.mukono.voting.payload.response;

import java.util.List;

/**
 * Grouped ballot response for candidates by election position.
 * Used when electionPositionId is omitted from the ballot endpoint.
 */
public class BallotGroupedByPositionResponse {

    private List<PositionGroup> positions;

    public BallotGroupedByPositionResponse() {}

    public BallotGroupedByPositionResponse(List<PositionGroup> positions) {
        this.positions = positions;
    }

    public List<PositionGroup> getPositions() {
        return positions;
    }

    public void setPositions(List<PositionGroup> positions) {
        this.positions = positions;
    }

    /**
     * A group of candidates for a single election position.
     */
    public static class PositionGroup {
        private Long electionPositionId;
        private String positionTitle;
        private String fellowshipName;
        private Long fellowshipId;
        private Integer seats;
        private PositionScope positionScope;
        private List<ElectionCandidateResponse> candidates;

        public PositionGroup() {}

        public PositionGroup(Long electionPositionId, String positionTitle, String fellowshipName,
                           Long fellowshipId, Integer seats, PositionScope positionScope,
                           List<ElectionCandidateResponse> candidates) {
            this.electionPositionId = electionPositionId;
            this.positionTitle = positionTitle;
            this.fellowshipName = fellowshipName;
            this.fellowshipId = fellowshipId;
            this.seats = seats;
            this.positionScope = positionScope;
            this.candidates = candidates;
        }

        public Long getElectionPositionId() { return electionPositionId; }
        public void setElectionPositionId(Long electionPositionId) { this.electionPositionId = electionPositionId; }

        public String getPositionTitle() { return positionTitle; }
        public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }

        public String getFellowshipName() { return fellowshipName; }
        public void setFellowshipName(String fellowshipName) { this.fellowshipName = fellowshipName; }

        public Long getFellowshipId() { return fellowshipId; }
        public void setFellowshipId(Long fellowshipId) { this.fellowshipId = fellowshipId; }

        public Integer getSeats() { return seats; }
        public void setSeats(Integer seats) { this.seats = seats; }

        public PositionScope getPositionScope() { return positionScope; }
        public void setPositionScope(PositionScope positionScope) { this.positionScope = positionScope; }

        public List<ElectionCandidateResponse> getCandidates() { return candidates; }
        public void setCandidates(List<ElectionCandidateResponse> candidates) { this.candidates = candidates; }
    }

    /**
     * Position scope enum (copied from PositionScope for clarity).
     */
    public enum PositionScope {
        DIOCESE,
        ARCHDEACONRY,
        CHURCH
    }
}
