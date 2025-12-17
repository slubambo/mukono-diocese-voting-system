package com.mukono.voting.service.election;

/**
 * EligibilityDecision represents the result of an eligibility check for a voter in an election.
 * Contains the eligibility determination, the rule applied, and a human-readable reason.
 */
public class EligibilityDecision {
    private boolean eligible;
    private String rule;      // VOTER_ROLL_ALLOW, VOTER_ROLL_BLOCK, FELLOWSHIP_CHECK, SCOPE_CHECK
    private String reason;    // Human-readable explanation

    // Constructors
    public EligibilityDecision(boolean eligible, String rule, String reason) {
        this.eligible = eligible;
        this.rule = rule;
        this.reason = reason;
    }

    // Getters
    public boolean isEligible() {
        return eligible;
    }

    public String getRule() {
        return rule;
    }

    public String getReason() {
        return reason;
    }

    @Override
    public String toString() {
        return "EligibilityDecision{" +
                "eligible=" + eligible +
                ", rule='" + rule + '\'' +
                ", reason='" + reason + '\'' +
                '}';
    }
}
