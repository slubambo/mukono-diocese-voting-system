package com.mukono.voting.model.election;

/**
 * Enum representing the lifecycle status of a voting code.
 * 
 * ACTIVE: Code is issued and ready for use
 * USED: Code has been used to access the ballot
 * REVOKED: Code has been revoked by an admin
 * EXPIRED: Code has expired (voting period closed)
 */
public enum VotingCodeStatus {
    /**
     * Code is issued and ready for use.
     */
    ACTIVE,
    
    /**
     * Code has been used to access the ballot.
     */
    USED,
    
    /**
     * Code has been revoked by an admin.
     */
    REVOKED,
    
    /**
     * Code has expired (voting period closed).
     */
    EXPIRED
}
