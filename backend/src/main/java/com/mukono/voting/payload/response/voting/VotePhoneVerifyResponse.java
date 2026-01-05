package com.mukono.voting.payload.response.voting;

public class VotePhoneVerifyResponse {
    private boolean verified;
    private String reason;

    public VotePhoneVerifyResponse() {
    }

    public VotePhoneVerifyResponse(boolean verified, String reason) {
        this.verified = verified;
        this.reason = reason;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
