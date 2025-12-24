package com.mukono.voting.payload.response;

import com.mukono.voting.model.election.ElectionApplicant;

import java.time.Instant;

public class ElectionApplicantResponse {
    private Long id;
    private Long electionId;
    private Long electionPositionId;
    private String positionTitle; // Display field from electionPosition.fellowshipPosition.title.name
    private String fellowshipName; // Display field from electionPosition.fellowship.name
    private PersonSummary person;
    private PersonSummary submittedBy; // nullable
    private String source;
    private String status;
    private Instant submittedAt;
    private Instant decisionAt;
    private String decisionBy;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }
    public Long getElectionPositionId() { return electionPositionId; }
    public void setElectionPositionId(Long electionPositionId) { this.electionPositionId = electionPositionId; }
    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }
    public String getFellowshipName() { return fellowshipName; }
    public void setFellowshipName(String fellowshipName) { this.fellowshipName = fellowshipName; }
    public PersonSummary getPerson() { return person; }
    public void setPerson(PersonSummary person) { this.person = person; }
    public PersonSummary getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(PersonSummary submittedBy) { this.submittedBy = submittedBy; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Instant getDecisionAt() { return decisionAt; }
    public void setDecisionAt(Instant decisionAt) { this.decisionAt = decisionAt; }
    public String getDecisionBy() { return decisionBy; }
    public void setDecisionBy(String decisionBy) { this.decisionBy = decisionBy; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static ElectionApplicantResponse fromEntity(ElectionApplicant a) {
        ElectionApplicantResponse dto = new ElectionApplicantResponse();
        dto.setId(a.getId());
        dto.setElectionId(a.getElection().getId());
        dto.setElectionPositionId(a.getElectionPosition().getId());
        
        // Populate position display fields for UI convenience
        if (a.getElectionPosition() != null && a.getElectionPosition().getFellowshipPosition() != null) {
            if (a.getElectionPosition().getFellowshipPosition().getTitle() != null) {
                dto.setPositionTitle(a.getElectionPosition().getFellowshipPosition().getTitle().getName());
            }
            if (a.getElectionPosition().getFellowship() != null) {
                dto.setFellowshipName(a.getElectionPosition().getFellowship().getName());
            }
        }
        
        dto.setPerson(PersonSummary.fromEntity(a.getPerson()));
        dto.setSubmittedBy(a.getSubmittedBy() != null ? PersonSummary.fromEntity(a.getSubmittedBy()) : null);
        dto.setSource(a.getSource().name());
        dto.setStatus(a.getStatus().name());
        dto.setSubmittedAt(a.getSubmittedAt());
        dto.setDecisionAt(a.getDecisionAt());
        dto.setDecisionBy(a.getDecisionBy());
        dto.setNotes(a.getNotes());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());
        return dto;
    }
}
