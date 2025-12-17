package com.mukono.voting.payload.request;

import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * Request DTO for updating a voting period.
 * All fields are optional to allow partial updates.
 */
public class UpdateVotingPeriodRequest {

    @Size(max = 120, message = "Name must not exceed 120 characters")
    private String name;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    // Constructors
    public UpdateVotingPeriodRequest() {
    }

    // Getters and Setters
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
}
