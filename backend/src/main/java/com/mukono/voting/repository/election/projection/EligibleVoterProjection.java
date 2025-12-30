package com.mukono.voting.repository.election.projection;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Projection used by the native eligible-voters query.
 */
public interface EligibleVoterProjection {
    Long getPersonId();
    String getFullName();
    String getPhoneNumber();
    String getEmail();
    String getFellowshipName();
    String getScope();
    String getScopeName();
    Boolean getVoted();
    Instant getVoteCastAt();
    String getLastCodeStatus();
    LocalDateTime getLastCodeIssuedAt();
    LocalDateTime getLastCodeUsedAt();
}
