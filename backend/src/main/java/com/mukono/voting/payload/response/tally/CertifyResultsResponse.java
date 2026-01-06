package com.mukono.voting.payload.response.tally;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for certifying voting period results.
 */
public class CertifyResultsResponse {
    private String message;
    private Instant certifiedAt;
    private List<CertifiedLeadershipAssignmentResponse> assignments;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getCertifiedAt() { return certifiedAt; }
    public void setCertifiedAt(Instant certifiedAt) { this.certifiedAt = certifiedAt; }
    public List<CertifiedLeadershipAssignmentResponse> getAssignments() { return assignments; }
    public void setAssignments(List<CertifiedLeadershipAssignmentResponse> assignments) { this.assignments = assignments; }
}
