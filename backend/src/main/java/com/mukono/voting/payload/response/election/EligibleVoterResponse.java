package com.mukono.voting.payload.response.election;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO describing an eligible voter with their latest vote/code status for UI consumption.
 * Includes information about overrides and voting codes.
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
    // New fields
    private String code; // the actual voting code if available
    private Boolean isOverride; // true if this voter was added via voter roll override
    private String overrideReason; // reason for the override if applicable
    private Long leadershipAssignmentId; // id of the leadership assignment for reference
    private List<VotingCodeHistory> codeHistory; // full history of codes for this voter
    private String positionAndLocation; // e.g., "Chairperson (Misindye Church)"
    private List<PositionSummary> positionsSummary; // all positions/fellowships for this voter on the day

    public EligibleVoterResponse(Long personId, String fullName, String phoneNumber, String email,
                                 String fellowshipName, String scope, String scopeName, boolean voted,
                                 Instant voteCastAt, String lastCodeStatus,
                                 LocalDateTime lastCodeIssuedAt, LocalDateTime lastCodeUsedAt,
                                 String code, Boolean isOverride, String overrideReason,
                                 Long leadershipAssignmentId, List<VotingCodeHistory> codeHistory,
                                 String positionAndLocation, List<PositionSummary> positionsSummary) {
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
        this.code = code;
        this.isOverride = isOverride;
        this.overrideReason = overrideReason;
        this.leadershipAssignmentId = leadershipAssignmentId;
        this.codeHistory = codeHistory;
        this.positionAndLocation = positionAndLocation;
        this.positionsSummary = positionsSummary;
    }

    // Getters
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
    public String getCode() { return code; }
    public Boolean getIsOverride() { return isOverride; }
    public String getOverrideReason() { return overrideReason; }
    public Long getLeadershipAssignmentId() { return leadershipAssignmentId; }
    public List<VotingCodeHistory> getCodeHistory() { return codeHistory; }
    public String getPositionAndLocation() { return positionAndLocation; }
    public List<PositionSummary> getPositionsSummary() { return positionsSummary; }

    // Lightweight history entry for voting codes
    public static class VotingCodeHistory {
        private final String code;
        private final String status;
        private final LocalDateTime issuedAt;
        private final LocalDateTime usedAt;
        private final LocalDateTime revokedAt;
        private final LocalDateTime expiredAt;

        public VotingCodeHistory(String code, String status, LocalDateTime issuedAt,
                                 LocalDateTime usedAt, LocalDateTime revokedAt, LocalDateTime expiredAt) {
            this.code = code;
            this.status = status;
            this.issuedAt = issuedAt;
            this.usedAt = usedAt;
            this.revokedAt = revokedAt;
            this.expiredAt = expiredAt;
        }

        public String getCode() { return code; }
        public String getStatus() { return status; }
        public LocalDateTime getIssuedAt() { return issuedAt; }
        public LocalDateTime getUsedAt() { return usedAt; }
        public LocalDateTime getRevokedAt() { return revokedAt; }
        public LocalDateTime getExpiredAt() { return expiredAt; }
    }

    // Summary of positions/fellowships for a voter
    public static class PositionSummary {
        private final String positionName;
        private final String fellowshipName;
        private final String scope;
        private final String scopeName;

        public PositionSummary(String positionName, String fellowshipName, String scope, String scopeName) {
            this.positionName = positionName;
            this.fellowshipName = fellowshipName;
            this.scope = scope;
            this.scopeName = scopeName;
        }

        public String getPositionName() { return positionName; }
        public String getFellowshipName() { return fellowshipName; }
        public String getScope() { return scope; }
        public String getScopeName() { return scopeName; }
    }
}