package com.mukono.voting.model.election;

/**
 * Enum representing the status of a voting period.
 * 
 * SCHEDULED: Period is scheduled but not yet open
 * OPEN: Period is currently open for voting
 * CLOSED: Period has been closed
 * CANCELLED: Period has been cancelled
 */
public enum VotingPeriodStatus {
    /**
     * Period is scheduled but not yet open.
     */
    SCHEDULED,
    
    /**
     * Period is currently open for voting.
     */
    OPEN,
    
    /**
     * Period has been closed.
     */
    CLOSED,
    
    /**
     * Period has been cancelled.
     */
    CANCELLED
}
