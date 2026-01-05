package com.mukono.voting.payload.response;

public class VoteLoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private Long personId;
    private Long electionId;
    private Long votingPeriodId;
    private boolean hasPhone;
    private String phoneLast3;

    public VoteLoginResponse() {}

    public VoteLoginResponse(String accessToken, long expiresIn, Long personId, Long electionId, Long votingPeriodId,
                             boolean hasPhone, String phoneLast3) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.personId = personId;
        this.electionId = electionId;
        this.votingPeriodId = votingPeriodId;
        this.hasPhone = hasPhone;
        this.phoneLast3 = phoneLast3;
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

    public boolean isHasPhone() { return hasPhone; }
    public void setHasPhone(boolean hasPhone) { this.hasPhone = hasPhone; }

    public String getPhoneLast3() { return phoneLast3; }
    public void setPhoneLast3(String phoneLast3) { this.phoneLast3 = phoneLast3; }
}
