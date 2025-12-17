package com.mukono.voting.api.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/**
 * Election results summary for a voting period.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ElectionResultsSummaryResponse {
    private Long electionId;
    private Long votingPeriodId;
    private String votingPeriodName;
    private String periodStatus; // OPEN, CLOSED, SCHEDULED, CANCELLED
    private Instant periodStartTime;
    private Instant periodEndTime;
    private Integer totalPositions;
    private Long totalBallotsCast; // VoteRecord count
    private Long totalSelectionsCast; // VoteSelection count
    private Long totalDistinctVoters; // unique personId
    private Instant serverTime;
	public ElectionResultsSummaryResponse() {
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
	public String getVotingPeriodName() {
		return votingPeriodName;
	}
	public void setVotingPeriodName(String votingPeriodName) {
		this.votingPeriodName = votingPeriodName;
	}
	public String getPeriodStatus() {
		return periodStatus;
	}
	public void setPeriodStatus(String periodStatus) {
		this.periodStatus = periodStatus;
	}
	public Instant getPeriodStartTime() {
		return periodStartTime;
	}
	public void setPeriodStartTime(Instant periodStartTime) {
		this.periodStartTime = periodStartTime;
	}
	public Instant getPeriodEndTime() {
		return periodEndTime;
	}
	public void setPeriodEndTime(Instant periodEndTime) {
		this.periodEndTime = periodEndTime;
	}
	public Integer getTotalPositions() {
		return totalPositions;
	}
	public void setTotalPositions(Integer totalPositions) {
		this.totalPositions = totalPositions;
	}
	public Long getTotalBallotsCast() {
		return totalBallotsCast;
	}
	public void setTotalBallotsCast(Long totalBallotsCast) {
		this.totalBallotsCast = totalBallotsCast;
	}
	public Long getTotalSelectionsCast() {
		return totalSelectionsCast;
	}
	public void setTotalSelectionsCast(Long totalSelectionsCast) {
		this.totalSelectionsCast = totalSelectionsCast;
	}
	public Long getTotalDistinctVoters() {
		return totalDistinctVoters;
	}
	public void setTotalDistinctVoters(Long totalDistinctVoters) {
		this.totalDistinctVoters = totalDistinctVoters;
	}
	public Instant getServerTime() {
		return serverTime;
	}
	public void setServerTime(Instant serverTime) {
		this.serverTime = serverTime;
	}
    
}
