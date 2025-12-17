package com.mukono.voting.payload.response;

/**
 * Represents a candidate on the ballot.
 * Contains minimal information needed for the voter UI.
 */
public class BallotCandidateResponse {
    private Long candidateId;
    private Long personId;
    private String fullName;
    private String gender;
    private Long originArchdeaconryId;
    private String originArchdeaconryName;
    private Long churchId;
    private String churchName;

    public BallotCandidateResponse() {}

    public BallotCandidateResponse(Long candidateId, Long personId, String fullName, String gender,
                                   Long originArchdeaconryId, String originArchdeaconryName,
                                   Long churchId, String churchName) {
        this.candidateId = candidateId;
        this.personId = personId;
        this.fullName = fullName;
        this.gender = gender;
        this.originArchdeaconryId = originArchdeaconryId;
        this.originArchdeaconryName = originArchdeaconryName;
        this.churchId = churchId;
        this.churchName = churchName;
    }

    // Getters and Setters
    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }

    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Long getOriginArchdeaconryId() { return originArchdeaconryId; }
    public void setOriginArchdeaconryId(Long originArchdeaconryId) { this.originArchdeaconryId = originArchdeaconryId; }

    public String getOriginArchdeaconryName() { return originArchdeaconryName; }
    public void setOriginArchdeaconryName(String originArchdeaconryName) { this.originArchdeaconryName = originArchdeaconryName; }

    public Long getChurchId() { return churchId; }
    public void setChurchId(Long churchId) { this.churchId = churchId; }

    public String getChurchName() { return churchName; }
    public void setChurchName(String churchName) { this.churchName = churchName; }
}
