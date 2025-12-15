package com.mukono.voting.payload.request;

import com.mukono.voting.model.common.RecordStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO for updating an existing leadership assignment (all fields optional).
 */
public class UpdateLeadershipAssignmentRequest {
    private Long personId;

    private Long fellowshipPositionId;

    private Long dioceseId;

    private Long archdeaconryId;

    private Long churchId;

    private LocalDate termStartDate;

    private LocalDate termEndDate;

    private RecordStatus status;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes;

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
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
