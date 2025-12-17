package com.mukono.voting.payload.response;

public class VoteLoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private Long personId;
    private Long electionId;
    private Long votingPeriodId;

    public VoteLoginResponse() {}

    public VoteLoginResponse(String accessToken, long expiresIn, Long personId, Long electionId, Long votingPeriodId) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.personId = personId;
        this.electionId = electionId;
        this.votingPeriodId = votingPeriodId;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }

    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public Long getVotingPeriodId() { return votingPeriodId; }
    public void setVotingPeriodId(Long votingPeriodId) { this.votingPeriodId = votingPeriodId; }
}
