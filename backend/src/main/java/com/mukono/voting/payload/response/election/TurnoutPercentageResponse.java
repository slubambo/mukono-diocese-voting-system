package com.mukono.voting.payload.response.election;

/**
 * Response DTO for turnout percentage of a position.
 */
public class TurnoutPercentageResponse {
    private Long electionId;
    private Long positionId;
    private double turnoutPercentage;

    public TurnoutPercentageResponse(Long electionId, Long positionId, double turnoutPercentage) {
        this.electionId = electionId;
        this.positionId = positionId;
        this.turnoutPercentage = turnoutPercentage;
    }

    public Long getElectionId() {
        return electionId;
    }

    public Long getPositionId() {
        return positionId;
    }

    public double getTurnoutPercentage() {
        return turnoutPercentage;
    }
}
