package com.mukono.voting.model.election;

/**
 * Enum representing the status of an applicant in the election process.
 * Tracks the approval/rejection workflow of candidates.
 */
public enum ApplicantStatus {
    /**
     * Applicant submitted but not yet reviewed
     */
    PENDING,
    
    /**
     * Applicant has been approved and is eligible for ballot
     */
    APPROVED,
    
    /**
     * Applicant has been rejected and is not eligible
     */
    REJECTED,
    
    /**
     * Applicant has withdrawn their application
     */
    WITHDRAWN
}
