package com.mukono.voting.payload.request.voting;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for recasting a vote (changing vote).
 * Same structure as CastVoteRequest but used for semantics.
 */
public class RecastVoteRequest {
    @NotNull(message = "Candidate ID is required")
    private Long candidateId;

    @NotNull(message = "Voter ID is required")
    private Long voterId;

    @Size(max = 50, message = "Source must not exceed 50 characters")
    private String source;

    public RecastVoteRequest() {
    }

    public RecastVoteRequest(Long candidateId, Long voterId, String source) {
        this.candidateId = candidateId;
        this.voterId = voterId;
        this.source = source;
    }

    public Long getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(Long candidateId) {
        this.candidateId = candidateId;
    }

    public Long getVoterId() {
        return voterId;
    }

    public void setVoterId(Long voterId) {
        this.voterId = voterId;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
