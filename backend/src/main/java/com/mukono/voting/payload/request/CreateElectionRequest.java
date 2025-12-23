package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Request DTO for creating an election.
 */
public class CreateElectionRequest {
    
    @NotNull(message = "Election name is required")
    @Size(min = 1, max = 255, message = "Election name must be between 1 and 255 characters")
    private String name;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private Long fellowshipId;

    @NotNull(message = "Scope is required")
    private String scope;

    private Long dioceseId;
    private Long archdeaconryId;
    private Long churchId;

    @NotNull(message = "Term start date is required")
    private LocalDate termStartDate;

    @NotNull(message = "Term end date is required")
    private LocalDate termEndDate;

    private Instant nominationStartAt;
    private Instant nominationEndAt;

    @NotNull(message = "Voting start time is required")
    private Instant votingStartAt;

    @NotNull(message = "Voting end time is required")
    private Instant votingEndAt;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getFellowshipId() { return fellowshipId; }
    public void setFellowshipId(Long fellowshipId) { this.fellowshipId = fellowshipId; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public Long getDioceseId() { return dioceseId; }
    public void setDioceseId(Long dioceseId) { this.dioceseId = dioceseId; }

    public Long getArchdeaconryId() { return archdeaconryId; }
    public void setArchdeaconryId(Long archdeaconryId) { this.archdeaconryId = archdeaconryId; }

    public Long getChurchId() { return churchId; }
    public void setChurchId(Long churchId) { this.churchId = churchId; }

    public LocalDate getTermStartDate() { return termStartDate; }
    public void setTermStartDate(LocalDate termStartDate) { this.termStartDate = termStartDate; }

    public LocalDate getTermEndDate() { return termEndDate; }
    public void setTermEndDate(LocalDate termEndDate) { this.termEndDate = termEndDate; }

    public Instant getNominationStartAt() { return nominationStartAt; }
    public void setNominationStartAt(Instant nominationStartAt) { this.nominationStartAt = nominationStartAt; }

    public Instant getNominationEndAt() { return nominationEndAt; }
    public void setNominationEndAt(Instant nominationEndAt) { this.nominationEndAt = nominationEndAt; }

    public Instant getVotingStartAt() { return votingStartAt; }
    public void setVotingStartAt(Instant votingStartAt) { this.votingStartAt = votingStartAt; }

    public Instant getVotingEndAt() { return votingEndAt; }
    public void setVotingEndAt(Instant votingEndAt) { this.votingEndAt = votingEndAt; }
}
