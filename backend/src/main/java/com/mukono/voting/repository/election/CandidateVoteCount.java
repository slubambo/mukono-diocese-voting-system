package com.mukono.voting.repository.election;

/**
 * Projection interface for candidate vote count in a position.
 * Used to aggregate votes by candidate without returning raw Object[].
 */
public interface CandidateVoteCount {
    Long getCandidateId();
    Long getVotes();
}
