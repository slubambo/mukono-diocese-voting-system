package com.mukono.voting.security;

/**
 * Minimal principal representation for voter JWTs.
 */
public class VoterPrincipal {
    private final Long personId;
    private final Long electionId;
    private final Long votingPeriodId;
    private final Long codeId;

    public VoterPrincipal(Long personId, Long electionId, Long votingPeriodId, Long codeId) {
        this.personId = personId;
        this.electionId = electionId;
        this.votingPeriodId = votingPeriodId;
        this.codeId = codeId;
    }

    public Long getPersonId() { return personId; }
    public Long getElectionId() { return electionId; }
    public Long getVotingPeriodId() { return votingPeriodId; }
    public Long getCodeId() { return codeId; }
}
