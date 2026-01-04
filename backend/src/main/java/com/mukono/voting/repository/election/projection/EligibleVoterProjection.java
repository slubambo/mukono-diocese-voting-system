package com.mukono.voting.repository.election.projection;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Projection used by the native eligible-voters query.
 * Includes information about voting codes, overrides, and leadership assignments.
 */
public interface EligibleVoterProjection {
    Long getPersonId();
    String getFullName();
    String getPhoneNumber();
    String getEmail();
    String getFellowshipName();
    String getScope();
    String getScopeName();
    Integer getVoted(); // MariaDB returns 1/0 from CASE WHEN
    Instant getVoteCastAt();
    String getLastCodeStatus();
    LocalDateTime getLastCodeIssuedAt();
    LocalDateTime getLastCodeUsedAt();
    // New fields
    Long getLeadershipAssignmentId(); // id of the leadership assignment
    String getCode(); // the voting code value
    Integer getIsOverride(); // 1/0 from CASE WHEN - true if from voter roll
    String getOverrideReason(); // reason for the override if applicable
    // Code history as JSON; will be mapped in service
    String getCodeHistoryJson();
    // New: position and location string
    String getPositionAndLocation();
    String getPositionsSummaryJson();
}