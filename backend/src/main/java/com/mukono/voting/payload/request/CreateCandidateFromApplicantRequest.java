package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateCandidateFromApplicantRequest {
    @NotNull(message = "Applicant ID is required")
    private Long applicantId;

    @NotNull(message = "Created by is required")
    @Size(max = 255, message = "Created by must be at most 255 characters")
    private String createdBy;

    public Long getApplicantId() { return applicantId; }
    public void setApplicantId(Long applicantId) { this.applicantId = applicantId; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
