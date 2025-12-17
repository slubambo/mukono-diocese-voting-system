package com.mukono.voting.service.election;

import java.util.List;

/**
 * WinnerResult represents the outcome of an election position.
 * Handles single winners, ties, and related vote data.
 */
public class WinnerResult {
    private boolean tie;
    private Long winnerCandidateId;  // null if tie
    private List<Long> topCandidateIds;
    private long topVotes;

    // Constructors
    public WinnerResult(boolean tie, Long winnerCandidateId, List<Long> topCandidateIds, long topVotes) {
        this.tie = tie;
        this.winnerCandidateId = winnerCandidateId;
        this.topCandidateIds = topCandidateIds;
        this.topVotes = topVotes;
    }

    // Static factory methods
    public static WinnerResult ofWinner(Long candidateId, long votes) {
        return new WinnerResult(false, candidateId, List.of(candidateId), votes);
    }

    public static WinnerResult ofTie(List<Long> candidateIds, long votes) {
        return new WinnerResult(true, null, candidateIds, votes);
    }

    // Getters
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

    @Override
    public String toString() {
        return "WinnerResult{" +
                "tie=" + tie +
                ", winnerCandidateId=" + winnerCandidateId +
                ", topCandidateIds=" + topCandidateIds +
                ", topVotes=" + topVotes +
                '}';
    }
}
