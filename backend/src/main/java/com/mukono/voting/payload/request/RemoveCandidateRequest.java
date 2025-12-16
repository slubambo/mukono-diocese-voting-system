package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RemoveCandidateRequest {
    @NotNull(message = "Removed by is required")
    @Size(max = 255, message = "Removed by must be at most 255 characters")
    private String removedBy;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes; // optional

    public String getRemovedBy() { return removedBy; }
    public void setRemovedBy(String removedBy) { this.removedBy = removedBy; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
