package com.mukono.voting.model.election;

/**
 * Status of an election tally run.
 */
public enum TallyStatus {
    PENDING,
    COMPLETED,
    FAILED,
    ROLLED_BACK
}
