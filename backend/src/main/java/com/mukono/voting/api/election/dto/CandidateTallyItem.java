package com.mukono.voting.api.election.dto;

/**
 * Item in tally results (single candidate vote count).
 */
public class CandidateTallyItem {
    private Long candidateId;
    private Long votes;

    public CandidateTallyItem(Long candidateId, Long votes) {
        this.candidateId = candidateId;
        this.votes = votes;
    }

    public Long getCandidateId() {
        return candidateId;
    }

    public Long getVotes() {
        return votes;
    }
}
