package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO for creating a new leadership assignment.
 */
public class CreateLeadershipAssignmentRequest {
    @NotNull(message = "Person ID is required")
    private Long personId;

    @NotNull(message = "Fellowship position ID is required")
    private Long fellowshipPositionId;

    private Long dioceseId; // nullable, scope-driven

    private Long archdeaconryId; // nullable, scope-driven

    private Long churchId; // nullable, scope-driven

    @NotNull(message = "Term start date is required")
    private LocalDate termStartDate;

    private LocalDate termEndDate; // optional

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes; // optional

    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public Long getFellowshipPositionId() { return fellowshipPositionId; }
    public void setFellowshipPositionId(Long fellowshipPositionId) { this.fellowshipPositionId = fellowshipPositionId; }
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
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
