package com.mukono.voting.payload.response;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a single position on the ballot with its candidates.
 */
public class BallotPositionResponse {
    private Long positionId;
    private String positionName;
    private String scope;
    private Integer seats;
    private Integer maxVotesPerVoter;
    private List<BallotCandidateResponse> candidates = new ArrayList<>();

    public BallotPositionResponse() {}

    public BallotPositionResponse(Long positionId, String positionName, String scope,
                                  Integer seats, Integer maxVotesPerVoter) {
        this.positionId = positionId;
        this.positionName = positionName;
        this.scope = scope;
        this.seats = seats;
        this.maxVotesPerVoter = maxVotesPerVoter;
    }

    // Getters and Setters
    public Long getPositionId() { return positionId; }
    public void setPositionId(Long positionId) { this.positionId = positionId; }

    public String getPositionName() { return positionName; }
    public void setPositionName(String positionName) { this.positionName = positionName; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }

    public Integer getMaxVotesPerVoter() { return maxVotesPerVoter; }
    public void setMaxVotesPerVoter(Integer maxVotesPerVoter) { this.maxVotesPerVoter = maxVotesPerVoter; }

    public List<BallotCandidateResponse> getCandidates() { return candidates; }
    public void setCandidates(List<BallotCandidateResponse> candidates) { this.candidates = candidates; }
}
