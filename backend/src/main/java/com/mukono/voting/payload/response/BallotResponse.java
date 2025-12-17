package com.mukono.voting.payload.response;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Complete ballot response for a voter.
 * Contains all positions and candidates the voter is eligible to see.
 */
public class BallotResponse {
    private Long electionId;
    private Long votingPeriodId;
    private Long personId;
    private Instant serverTime;
    private String ballotTitle;
    private List<BallotPositionResponse> positions = new ArrayList<>();

    public BallotResponse() {
        this.serverTime = Instant.now();
    }

    public BallotResponse(Long electionId, Long votingPeriodId, Long personId, String ballotTitle) {
        this.electionId = electionId;
        this.votingPeriodId = votingPeriodId;
        this.personId = personId;
        this.ballotTitle = ballotTitle;
        this.serverTime = Instant.now();
    }

    // Getters and Setters
    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public Long getVotingPeriodId() { return votingPeriodId; }
    public void setVotingPeriodId(Long votingPeriodId) { this.votingPeriodId = votingPeriodId; }

    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }

    public Instant getServerTime() { return serverTime; }
    public void setServerTime(Instant serverTime) { this.serverTime = serverTime; }

    public String getBallotTitle() { return ballotTitle; }
    public void setBallotTitle(String ballotTitle) { this.ballotTitle = ballotTitle; }

    public List<BallotPositionResponse> getPositions() { return positions; }
    public void setPositions(List<BallotPositionResponse> positions) { this.positions = positions; }
}
