package com.mukono.voting.api.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Represents vote results for a single candidate in a position.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CandidateResultsResponse {
    private Long candidateId;
    private Long personId;
    private String fullName;
    private Long voteCount;
    private Double voteSharePercent; // null if no votes in position
	public CandidateResultsResponse() {
		super();
	}
	public Long getCandidateId() {
		return candidateId;
	}
	public void setCandidateId(Long candidateId) {
		this.candidateId = candidateId;
	}
	public Long getPersonId() {
		return personId;
	}
	public void setPersonId(Long personId) {
		this.personId = personId;
	}
	public String getFullName() {
		return fullName;
	}
	public void setFullName(String fullName) {
		this.fullName = fullName;
	}
	public Long getVoteCount() {
		return voteCount;
	}
	public void setVoteCount(Long voteCount) {
		this.voteCount = voteCount;
	}
	public Double getVoteSharePercent() {
		return voteSharePercent;
	}
	public void setVoteSharePercent(Double voteSharePercent) {
		this.voteSharePercent = voteSharePercent;
	}
    
}
