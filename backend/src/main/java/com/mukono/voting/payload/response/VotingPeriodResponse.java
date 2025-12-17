package com.mukono.voting.payload.response;

import com.mukono.voting.model.election.VotingPeriodStatus;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Response DTO for voting periods.
 * Includes full details and audit timestamps.
 */
public class VotingPeriodResponse {

    private Long id;
    private Long electionId;
    private String name;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private VotingPeriodStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    // Constructors
    public VotingPeriodResponse() {
    }

    public VotingPeriodResponse(Long id, Long electionId, String name, String description,
                                LocalDateTime startTime, LocalDateTime endTime,
                                VotingPeriodStatus status, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.electionId = electionId;
        this.name = name;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public VotingPeriodStatus getStatus() {
        return status;
    }

    public void setStatus(VotingPeriodStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
