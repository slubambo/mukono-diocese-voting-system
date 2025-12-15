package com.mukono.voting.payload.response;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.LeadershipAssignment;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Full response DTO for a leadership assignment.
 * Includes only the relevant target (diocese, archdeaconry, or church) based on position scope.
 */
public class LeadershipAssignmentResponse {
    private Long id;
    private RecordStatus status;
    private LocalDate termStartDate;
    private LocalDate termEndDate;
    private String notes;
    private PersonSummary person;
    private FellowshipPositionSummary fellowshipPosition;
    private DioceseSummary diocese;
    private ArchdeaconrySummary archdeaconry;
    private ChurchSummary church;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
    public LocalDate getTermStartDate() { return termStartDate; }
    public void setTermStartDate(LocalDate termStartDate) { this.termStartDate = termStartDate; }
    public LocalDate getTermEndDate() { return termEndDate; }
    public void setTermEndDate(LocalDate termEndDate) { this.termEndDate = termEndDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public PersonSummary getPerson() { return person; }
    public void setPerson(PersonSummary person) { this.person = person; }
    public FellowshipPositionSummary getFellowshipPosition() { return fellowshipPosition; }
    public void setFellowshipPosition(FellowshipPositionSummary fellowshipPosition) { this.fellowshipPosition = fellowshipPosition; }
    public DioceseSummary getDiocese() { return diocese; }
    public void setDiocese(DioceseSummary diocese) { this.diocese = diocese; }
    public ArchdeaconrySummary getArchdeaconry() { return archdeaconry; }
    public void setArchdeaconry(ArchdeaconrySummary archdeaconry) { this.archdeaconry = archdeaconry; }
    public ChurchSummary getChurch() { return church; }
    public void setChurch(ChurchSummary church) { this.church = church; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static LeadershipAssignmentResponse fromEntity(LeadershipAssignment e) {
        LeadershipAssignmentResponse dto = new LeadershipAssignmentResponse();
        dto.setId(e.getId());
        dto.setStatus(e.getStatus());
        dto.setTermStartDate(e.getTermStartDate());
        dto.setTermEndDate(e.getTermEndDate());
        dto.setNotes(e.getNotes());
        dto.setPerson(PersonSummary.fromEntity(e.getPerson()));
        dto.setFellowshipPosition(FellowshipPositionSummary.fromEntity(e.getFellowshipPosition()));
        
        // Only map the correct target based on which field is non-null
        if (e.getDiocese() != null) {
            dto.setDiocese(DioceseSummary.fromEntity(e.getDiocese()));
        }
        if (e.getArchdeaconry() != null) {
            dto.setArchdeaconry(ArchdeaconrySummary.fromEntity(e.getArchdeaconry()));
        }
        if (e.getChurch() != null) {
            dto.setChurch(ChurchSummary.fromEntity(e.getChurch()));
        }
        
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
