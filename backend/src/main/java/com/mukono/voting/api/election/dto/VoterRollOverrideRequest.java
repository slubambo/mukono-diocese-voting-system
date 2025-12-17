package com.mukono.voting.api.election.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for adding/updating voter roll overrides (whitelist/blacklist).
 */
public class VoterRollOverrideRequest {
    @NotNull(message = "Eligible flag is required")
    private Boolean eligible;

    @Size(max = 255, message = "Added by must not exceed 255 characters")
    private String addedBy;

    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;

    public VoterRollOverrideRequest() {
    }

    public VoterRollOverrideRequest(Boolean eligible, String addedBy, String reason) {
        this.eligible = eligible;
        this.addedBy = addedBy;
        this.reason = reason;
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
