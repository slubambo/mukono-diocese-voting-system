package com.mukono.voting.model.election;

/**
 * Enum representing the status of a vote.
 * Supports audit trails and vote revocation tracking.
 */
public enum VoteStatus {
    /**
     * Vote has been cast
     */
    CAST,
    
    /**
     * Vote has been revoked
     */
    REVOKED
}
