package com.mukono.voting.payload.response.election;

import java.util.List;

/**
 * Response DTO for winner determination.
 * Handles both single winner and tie cases.
 */
public class WinnerResponse {
    private boolean tie;
    private Long winnerCandidateId;
    private List<Long> topCandidateIds;
    private long topVotes;

    public WinnerResponse(boolean tie, Long winnerCandidateId, List<Long> topCandidateIds, long topVotes) {
        this.tie = tie;
        this.winnerCandidateId = winnerCandidateId;
        this.topCandidateIds = topCandidateIds;
        this.topVotes = topVotes;
    }

    public boolean isTie() {
        return tie;
    }

    public Long getWinnerCandidateId() {
        return winnerCandidateId;
    }

    public List<Long> getTopCandidateIds() {
        return topCandidateIds;
    }

    public long getTopVotes() {
        return topVotes;
    }
}
