package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for cancelling an election.
 */
public class CancelElectionRequest {
    
    @NotNull(message = "Cancellation reason is required")
    @Size(min = 1, max = 1000, message = "Reason must be between 1 and 1000 characters")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
