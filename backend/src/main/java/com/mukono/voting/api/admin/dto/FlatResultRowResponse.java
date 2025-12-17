package com.mukono.voting.api.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Flat row for export (suitable for CSV conversion in UI).
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FlatResultRowResponse {
    private Long electionId;
    private Long votingPeriodId;
    private Long positionId;
    private String positionName;
    private Long candidateId;
    private Long personId;
    private String fullName;
    private Long voteCount;
    private Long turnoutForPosition;
    private Long totalBallotsForPosition;
	public FlatResultRowResponse() {
		super();
	}
	public Long getElectionId() {
		return electionId;
	}
	public void setElectionId(Long electionId) {
		this.electionId = electionId;
	}
	public Long getVotingPeriodId() {
		return votingPeriodId;
	}
	public void setVotingPeriodId(Long votingPeriodId) {
		this.votingPeriodId = votingPeriodId;
	}
	public Long getPositionId() {
		return positionId;
	}
	public void setPositionId(Long positionId) {
		this.positionId = positionId;
	}
	public String getPositionName() {
		return positionName;
	}
	public void setPositionName(String positionName) {
		this.positionName = positionName;
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
	public Long getTurnoutForPosition() {
		return turnoutForPosition;
	}
	public void setTurnoutForPosition(Long turnoutForPosition) {
		this.turnoutForPosition = turnoutForPosition;
	}
	public Long getTotalBallotsForPosition() {
		return totalBallotsForPosition;
	}
	public void setTotalBallotsForPosition(Long totalBallotsForPosition) {
		this.totalBallotsForPosition = totalBallotsForPosition;
	}
    
}
