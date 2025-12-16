package com.mukono.voting.payload.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for adding a position to an election.
 */
public class AddElectionPositionRequest {
    
    @NotNull(message = "Fellowship position ID is required")
    private Long fellowshipPositionId;

    @Min(value = 1, message = "Number of seats must be at least 1")
    private Integer seats;

    public Long getFellowshipPositionId() { return fellowshipPositionId; }
    public void setFellowshipPositionId(Long fellowshipPositionId) { this.fellowshipPositionId = fellowshipPositionId; }

    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }
}
