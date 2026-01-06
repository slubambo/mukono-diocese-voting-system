package com.mukono.voting.payload.request.tally;

/**
 * Request to certify results for a voting period.
 */
public class CertifyResultsRequest {
    private String remarks;

    public CertifyResultsRequest() {
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
