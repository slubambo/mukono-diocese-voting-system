package com.mukono.voting.payload.request.voting;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for regenerating a voting code.
 */
public class RegenerateVotingCodeRequest {

    @NotNull(message = "Person ID is required")
    private Long personId;

    @NotNull(message = "Reason is required")
    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;

    public RegenerateVotingCodeRequest() {
    }

    public RegenerateVotingCodeRequest(Long personId, String reason) {
        this.personId = personId;
        this.reason = reason;
    }

    public Long getPersonId() {
        return personId;
    }

    public void setPersonId(Long personId) {
        this.personId = personId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
