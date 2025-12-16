package com.mukono.voting.model.election;

/**
 * Enum representing the source of an applicant.
 * Indicates whether the applicant was nominated or manually submitted.
 */
public enum ApplicantSource {
    /**
     * Applicant was nominated by the system/users
     */
    NOMINATION,
    
    /**
     * Applicant was manually submitted/created
     */
    MANUAL
}
