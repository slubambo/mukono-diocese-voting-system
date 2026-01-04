package com.mukono.voting.payload.response.election;

import java.time.Instant;

/**
 * Response DTO for voter roll entries (overrides).
 * Maps from ElectionVoterRoll entity (without nested objects).
 * Scoped to a specific voting period.
 */
public class VoterRollEntryResponse {
    private Long id;
    private Long electionId;
    private Long votingPeriodId;
    private Long personId;
    private Boolean eligible;
    private String reason;
    private String addedBy;
    private Instant addedAt;

    public VoterRollEntryResponse(Long id, Long electionId, Long votingPeriodId, Long personId, Boolean eligible, 
                                 String reason, String addedBy, Instant addedAt) {
        this.id = id;
        this.electionId = electionId;
        this.votingPeriodId = votingPeriodId;
        this.personId = personId;
        this.eligible = eligible;
        this.reason = reason;
        this.addedBy = addedBy;
        this.addedAt = addedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getElectionId() {
        return electionId;
    }

    public Long getVotingPeriodId() {
        return votingPeriodId;
    }

    public Long getPersonId() {
        return personId;
    }

    public Boolean getEligible() {
        return eligible;
    }

    public String getReason() {
        return reason;
    }

    public String getAddedBy() {
        return addedBy;
    }

    public Instant getAddedAt() {
        return addedAt;
    }
}
