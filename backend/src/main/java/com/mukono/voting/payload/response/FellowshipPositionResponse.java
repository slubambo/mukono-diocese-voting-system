package com.mukono.voting.payload.response;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.FellowshipPosition;
import com.mukono.voting.model.leadership.PositionScope;

import java.time.Instant;

/**
 * Full response DTO for a fellowship position.
 */
public class FellowshipPositionResponse {
    private Long id;
    private PositionScope scope;
    private Integer seats;
    private RecordStatus status;
    private FellowshipSummary fellowship;
    private PositionTitleSummary title;
    private Long currentAssignmentsCount;
    private Integer availableSeats;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PositionScope getScope() { return scope; }
    public void setScope(PositionScope scope) { this.scope = scope; }
    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
    public FellowshipSummary getFellowship() { return fellowship; }
    public void setFellowship(FellowshipSummary fellowship) { this.fellowship = fellowship; }
    public PositionTitleSummary getTitle() { return title; }
    public void setTitle(PositionTitleSummary title) { this.title = title; }
    public Long getCurrentAssignmentsCount() { return currentAssignmentsCount; }
    public void setCurrentAssignmentsCount(Long currentAssignmentsCount) { this.currentAssignmentsCount = currentAssignmentsCount; }
    public Integer getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(Integer availableSeats) { this.availableSeats = availableSeats; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static FellowshipPositionResponse fromEntity(FellowshipPosition e) {
        FellowshipPositionResponse dto = new FellowshipPositionResponse();
        dto.setId(e.getId());
        dto.setScope(e.getScope());
        dto.setSeats(e.getSeats());
        dto.setStatus(e.getStatus());
        dto.setFellowship(FellowshipSummary.fromEntity(e.getFellowship()));
        dto.setTitle(PositionTitleSummary.fromEntity(e.getTitle()));
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }

    public static FellowshipPositionResponse fromEntity(FellowshipPosition e, Long currentAssignmentsCount) {
        FellowshipPositionResponse dto = fromEntity(e);
        dto.setCurrentAssignmentsCount(currentAssignmentsCount);
        dto.setAvailableSeats(e.getSeats() - currentAssignmentsCount.intValue());
        return dto;
    }
}
