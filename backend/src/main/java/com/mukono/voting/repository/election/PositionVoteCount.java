package com.mukono.voting.repository.election;

/**
 * Projection interface for position vote count (turnout).
 * Used to aggregate votes by position without returning raw Object[].
 */
public interface PositionVoteCount {
    Long getElectionPositionId();
    Long getVotes();
}
