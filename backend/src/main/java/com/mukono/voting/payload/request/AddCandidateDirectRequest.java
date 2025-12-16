package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AddCandidateDirectRequest {
    @NotNull(message = "Election position ID is required")
    private Long electionPositionId;

    @NotNull(message = "Person ID is required")
    private Long personId;

    @NotNull(message = "Decision by is required")
    @Size(max = 255, message = "Decision by must be at most 255 characters")
    private String decisionBy;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes; // optional

    public Long getElectionPositionId() { return electionPositionId; }
    public void setElectionPositionId(Long electionPositionId) { this.electionPositionId = electionPositionId; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public String getDecisionBy() { return decisionBy; }
    public void setDecisionBy(String decisionBy) { this.decisionBy = decisionBy; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
