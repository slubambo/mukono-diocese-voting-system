package com.mukono.voting.payload.response;

import com.mukono.voting.model.election.ElectionCandidate;

import java.time.Instant;

public class ElectionCandidateResponse {
    private Long id;
    private Long electionId;
    private Long electionPositionId;
    private PersonSummary person;
    private Long applicantId; // nullable
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }
    public Long getElectionPositionId() { return electionPositionId; }
    public void setElectionPositionId(Long electionPositionId) { this.electionPositionId = electionPositionId; }
    public PersonSummary getPerson() { return person; }
    public void setPerson(PersonSummary person) { this.person = person; }
    public Long getApplicantId() { return applicantId; }
    public void setApplicantId(Long applicantId) { this.applicantId = applicantId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static ElectionCandidateResponse fromEntity(ElectionCandidate c) {
        ElectionCandidateResponse dto = new ElectionCandidateResponse();
        dto.setId(c.getId());
        dto.setElectionId(c.getElection().getId());
        dto.setElectionPositionId(c.getElectionPosition().getId());
        dto.setPerson(PersonSummary.fromEntity(c.getPerson()));
        dto.setApplicantId(c.getApplicant() != null ? c.getApplicant().getId() : null);
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }
}
