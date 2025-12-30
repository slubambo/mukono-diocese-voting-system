package com.mukono.voting.payload.response.election;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * DTO describing an eligible voter with their latest vote/code status for UI consumption.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EligibleVoterResponse {
    private Long personId;
    private String fullName;
    private String phoneNumber;
    private String email;
    private String fellowshipName;
    private String scope;
    private String scopeName;
    private boolean voted;
    private Instant voteCastAt;
    private String lastCodeStatus;
    private LocalDateTime lastCodeIssuedAt;
    private LocalDateTime lastCodeUsedAt;

    public EligibleVoterResponse(Long personId, String fullName, String phoneNumber, String email,
                                 String fellowshipName, String scope, String scopeName, boolean voted,
                                 Instant voteCastAt, String lastCodeStatus,
                                 LocalDateTime lastCodeIssuedAt, LocalDateTime lastCodeUsedAt) {
        this.personId = personId;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.fellowshipName = fellowshipName;
        this.scope = scope;
        this.scopeName = scopeName;
        this.voted = voted;
        this.voteCastAt = voteCastAt;
        this.lastCodeStatus = lastCodeStatus;
        this.lastCodeIssuedAt = lastCodeIssuedAt;
        this.lastCodeUsedAt = lastCodeUsedAt;
    }

    public Long getPersonId() { return personId; }
    public String getFullName() { return fullName; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getEmail() { return email; }
    public String getFellowshipName() { return fellowshipName; }
    public String getScope() { return scope; }
    public String getScopeName() { return scopeName; }
    public boolean isVoted() { return voted; }
    public Instant getVoteCastAt() { return voteCastAt; }
    public String getLastCodeStatus() { return lastCodeStatus; }
    public LocalDateTime getLastCodeIssuedAt() { return lastCodeIssuedAt; }
    public LocalDateTime getLastCodeUsedAt() { return lastCodeUsedAt; }
}
