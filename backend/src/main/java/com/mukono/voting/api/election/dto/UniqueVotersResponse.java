package com.mukono.voting.api.election.dto;

/**
 * Response DTO for unique voter count.
 */
public class UniqueVotersResponse {
    private Long electionId;
    private long uniqueVoters;

    public UniqueVotersResponse(Long electionId, long uniqueVoters) {
        this.electionId = electionId;
        this.uniqueVoters = uniqueVoters;
    }

    public Long getElectionId() {
        return electionId;
    }

    public long getUniqueVoters() {
        return uniqueVoters;
    }
}
