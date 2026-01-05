package com.mukono.voting.payload.response.voting;

public class VoterPositionSummary {
    private String positionName;
    private String fellowshipName;
    private String scopeName;

    public VoterPositionSummary() {
    }

    public VoterPositionSummary(String positionName, String fellowshipName, String scopeName) {
        this.positionName = positionName;
        this.fellowshipName = fellowshipName;
        this.scopeName = scopeName;
    }

    public String getPositionName() {
        return positionName;
    }

    public void setPositionName(String positionName) {
        this.positionName = positionName;
    }

    public String getFellowshipName() {
        return fellowshipName;
    }

    public void setFellowshipName(String fellowshipName) {
        this.fellowshipName = fellowshipName;
    }

    public String getScopeName() {
        return scopeName;
    }

    public void setScopeName(String scopeName) {
        this.scopeName = scopeName;
    }
}
