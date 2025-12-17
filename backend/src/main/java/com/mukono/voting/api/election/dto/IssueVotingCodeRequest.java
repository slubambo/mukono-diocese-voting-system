package com.mukono.voting.api.election.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for issuing a voting code.
 */
public class IssueVotingCodeRequest {

    @NotNull(message = "Person ID is required")
    private Long personId;

    @Size(max = 1000, message = "Remarks must not exceed 1000 characters")
    private String remarks;

    public IssueVotingCodeRequest() {
    }

    public IssueVotingCodeRequest(Long personId, String remarks) {
        this.personId = personId;
        this.remarks = remarks;
    }

    public Long getPersonId() {
        return personId;
    }

    public void setPersonId(Long personId) {
        this.personId = personId;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
