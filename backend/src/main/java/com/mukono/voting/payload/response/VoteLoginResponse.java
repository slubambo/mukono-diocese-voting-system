package com.mukono.voting.payload.response;

import com.mukono.voting.payload.response.voting.VoterPositionSummary;

import java.util.List;

public class VoteLoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private Long personId;
    private String fullName;
    private Long electionId;
    private Long votingPeriodId;
    private boolean hasPhone;
    private String phoneMasked;
    private List<VoterPositionSummary> positions;

    public VoteLoginResponse() {}

    public VoteLoginResponse(String accessToken, long expiresIn, Long personId, String fullName,
                             Long electionId, Long votingPeriodId, boolean hasPhone, String phoneMasked,
                             List<VoterPositionSummary> positions) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.personId = personId;
        this.fullName = fullName;
        this.electionId = electionId;
        this.votingPeriodId = votingPeriodId;
        this.hasPhone = hasPhone;
        this.phoneMasked = phoneMasked;
        this.positions = positions;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }

    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public Long getVotingPeriodId() { return votingPeriodId; }
    public void setVotingPeriodId(Long votingPeriodId) { this.votingPeriodId = votingPeriodId; }

    public boolean isHasPhone() { return hasPhone; }
    public void setHasPhone(boolean hasPhone) { this.hasPhone = hasPhone; }

    public String getPhoneMasked() { return phoneMasked; }
    public void setPhoneMasked(String phoneMasked) { this.phoneMasked = phoneMasked; }

    public List<VoterPositionSummary> getPositions() { return positions; }
    public void setPositions(List<VoterPositionSummary> positions) { this.positions = positions; }
}
