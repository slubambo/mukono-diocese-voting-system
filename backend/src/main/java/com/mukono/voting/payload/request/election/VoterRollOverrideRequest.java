package com.mukono.voting.payload.request.election;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for adding/updating voter roll overrides (whitelist/blacklist) for a specific voting period.
 */
public class VoterRollOverrideRequest {
    @NotNull(message = "Voting period ID is required")
    private Long votingPeriodId;

    @NotNull(message = "Eligible flag is required")
    private Boolean eligible;

    @Size(max = 255, message = "Added by must not exceed 255 characters")
    private String addedBy;

    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;

    public VoterRollOverrideRequest() {
    }

    public VoterRollOverrideRequest(Long votingPeriodId, Boolean eligible, String addedBy, String reason) {
        this.votingPeriodId = votingPeriodId;
        this.eligible = eligible;
        this.addedBy = addedBy;
        this.reason = reason;
    }

    public Long getVotingPeriodId() {
        return votingPeriodId;
    }

    public void setVotingPeriodId(Long votingPeriodId) {
        this.votingPeriodId = votingPeriodId;
    }

    public Boolean getEligible() {
        return eligible;
    }

    public void setEligible(Boolean eligible) {
        this.eligible = eligible;
    }

    public String getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(String addedBy) {
        this.addedBy = addedBy;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
