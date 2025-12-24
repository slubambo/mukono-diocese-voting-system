package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Request payload for assigning election positions to a voting period.
 */
public class AssignVotingPeriodPositionsRequest {

    @NotNull(message = "Election position IDs are required")
    @NotEmpty(message = "At least one election position must be assigned")
    private List<Long> electionPositionIds;

    public AssignVotingPeriodPositionsRequest() {
    }

    public List<Long> getElectionPositionIds() {
        return electionPositionIds;
    }

    public void setElectionPositionIds(List<Long> electionPositionIds) {
        this.electionPositionIds = electionPositionIds;
    }
}
