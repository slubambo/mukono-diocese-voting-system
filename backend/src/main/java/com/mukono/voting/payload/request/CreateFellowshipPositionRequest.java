package com.mukono.voting.payload.request;

import com.mukono.voting.model.leadership.PositionScope;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for creating a new fellowship position.
 */
public class CreateFellowshipPositionRequest {
    @NotNull(message = "Fellowship ID is required")
    private Long fellowshipId;

    @NotNull(message = "Position title ID is required")
    private Long titleId;

    @NotNull(message = "Position scope is required")
    private PositionScope scope;

    private Integer seats; // optional, service defaults to 1

    public Long getFellowshipId() { return fellowshipId; }
    public void setFellowshipId(Long fellowshipId) { this.fellowshipId = fellowshipId; }
    public Long getTitleId() { return titleId; }
    public void setTitleId(Long titleId) { this.titleId = titleId; }
    public PositionScope getScope() { return scope; }
    public void setScope(PositionScope scope) { this.scope = scope; }
    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }
}
