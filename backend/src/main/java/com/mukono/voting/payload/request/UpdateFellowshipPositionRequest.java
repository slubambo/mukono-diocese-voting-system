package com.mukono.voting.payload.request;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.PositionScope;

/**
 * DTO for updating an existing fellowship position (all fields optional).
 */
public class UpdateFellowshipPositionRequest {
    private Long titleId;

    private PositionScope scope;

    private Integer seats;

    private RecordStatus status;

    public Long getTitleId() { return titleId; }
    public void setTitleId(Long titleId) { this.titleId = titleId; }
    public PositionScope getScope() { return scope; }
    public void setScope(PositionScope scope) { this.scope = scope; }
    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
}
