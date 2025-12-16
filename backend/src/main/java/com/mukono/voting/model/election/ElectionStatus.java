package com.mukono.voting.model.election;

/**
 * Enum representing the lifecycle status of an election.
 * Tracks the progression from draft through nomination, voting, tallying, and publication.
 */
public enum ElectionStatus {
    /**
     * Election is being configured and not yet active
     */
    DRAFT,
    
    /**
     * Nomination period is active; candidates can be nominated
     */
    NOMINATION_OPEN,
    
    /**
     * Nomination period has ended; no more nominations accepted
     */
    NOMINATION_CLOSED,
    
    /**
     * Voting period is active; eligible voters can cast ballots
     */
    VOTING_OPEN,
    
    /**
     * Voting period has ended; no more votes accepted
     */
    VOTING_CLOSED,
    
    /**
     * Votes have been counted and results calculated
     */
    TALLIED,
    
    /**
     * Results have been officially published
     */
    PUBLISHED,
    
    /**
     * Election has been cancelled and is no longer valid
     */
    CANCELLED
}
