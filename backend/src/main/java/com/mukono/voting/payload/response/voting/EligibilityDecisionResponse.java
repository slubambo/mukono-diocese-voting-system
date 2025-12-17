package com.mukono.voting.payload.response.voting;

/**
 * Response DTO for eligibility check results.
 * Maps from ElectionVoterEligibilityService.EligibilityDecision.
 */
public class EligibilityDecisionResponse {
    private boolean eligible;
    private String rule;
    private String reason;

    public EligibilityDecisionResponse(boolean eligible, String rule, String reason) {
        this.eligible = eligible;
        this.rule = rule;
        this.reason = reason;
    }

    public boolean isEligible() {
        return eligible;
    }

    public String getRule() {
        return rule;
    }

    public String getReason() {
        return reason;
    }
}
