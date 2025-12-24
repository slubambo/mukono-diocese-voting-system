package com.mukono.voting.payload.response;

import com.mukono.voting.model.leadership.PositionScope;
import java.util.List;

/**
 * Ballot preview DTO containing positions and candidates without casting ability.
 */
public class BallotPreviewResponse {
    private Long electionId;
    private Long votingPeriodId; // nullable
    private String ballotTitle;
    private List<Position> positions;

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }
    public Long getVotingPeriodId() { return votingPeriodId; }
    public void setVotingPeriodId(Long votingPeriodId) { this.votingPeriodId = votingPeriodId; }
    public String getBallotTitle() { return ballotTitle; }
    public void setBallotTitle(String ballotTitle) { this.ballotTitle = ballotTitle; }
    public List<Position> getPositions() { return positions; }
    public void setPositions(List<Position> positions) { this.positions = positions; }

    public static class Position {
        private Long electionPositionId;
        private String positionTitle;
        private String fellowshipName;
        private Long fellowshipId;
        private PositionScope scope;
        private Integer seats;
        private Integer maxVotesPerVoter;
        private List<Candidate> candidates;

        public Long getElectionPositionId() { return electionPositionId; }
        public void setElectionPositionId(Long electionPositionId) { this.electionPositionId = electionPositionId; }
        public String getPositionTitle() { return positionTitle; }
        public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }
        public String getFellowshipName() { return fellowshipName; }
        public void setFellowshipName(String fellowshipName) { this.fellowshipName = fellowshipName; }
        public Long getFellowshipId() { return fellowshipId; }
        public void setFellowshipId(Long fellowshipId) { this.fellowshipId = fellowshipId; }
        public PositionScope getScope() { return scope; }
        public void setScope(PositionScope scope) { this.scope = scope; }
        public Integer getSeats() { return seats; }
        public void setSeats(Integer seats) { this.seats = seats; }
        public Integer getMaxVotesPerVoter() { return maxVotesPerVoter; }
        public void setMaxVotesPerVoter(Integer maxVotesPerVoter) { this.maxVotesPerVoter = maxVotesPerVoter; }
        public List<Candidate> getCandidates() { return candidates; }
        public void setCandidates(List<Candidate> candidates) { this.candidates = candidates; }
    }

    public static class Candidate {
        private Long candidateId;
        private Long personId;
        private String fullName;

        public Long getCandidateId() { return candidateId; }
        public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
        public Long getPersonId() { return personId; }
        public void setPersonId(Long personId) { this.personId = personId; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
    }
}
