package com.mukono.voting.api.election.dto;

import java.util.List;

/**
 * Response DTO for position tally (vote counts by candidate).
 */
public class PositionTallyResponse {
    private Long electionId;
    private Long positionId;
    private List<CandidateTallyItem> items;
    private long totalVotes;

    public PositionTallyResponse(Long electionId, Long positionId, List<CandidateTallyItem> items, long totalVotes) {
        this.electionId = electionId;
        this.positionId = positionId;
        this.items = items;
        this.totalVotes = totalVotes;
    }

    public Long getElectionId() {
        return electionId;
    }

    public Long getPositionId() {
        return positionId;
    }

    public List<CandidateTallyItem> getItems() {
        return items;
    }

    public long getTotalVotes() {
        return totalVotes;
    }
}
