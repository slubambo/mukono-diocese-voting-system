package com.mukono.voting.api.admin.dto;

import java.time.Instant;

/**
 * Response from running a tally.
 */
public class RunTallyResponse {
	private Long tallyRunId;
	private String status; // COMPLETED, FAILED
	private Long electionId;
	private Long votingPeriodId;
	private Integer totalPositionsTallied;
	private Integer totalWinnersApplied;
	private Integer tiesDetectedCount;
	private Instant serverTime;
	private String message; // e.g., "Tally already completed" for idempotent case

	public RunTallyResponse() {
		super();
	}

	public Long getTallyRunId() {
		return tallyRunId;
	}

	public void setTallyRunId(Long tallyRunId) {
		this.tallyRunId = tallyRunId;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
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

	public Integer getTotalPositionsTallied() {
		return totalPositionsTallied;
	}

	public void setTotalPositionsTallied(Integer totalPositionsTallied) {
		this.totalPositionsTallied = totalPositionsTallied;
	}

	public Integer getTotalWinnersApplied() {
		return totalWinnersApplied;
	}

	public void setTotalWinnersApplied(Integer totalWinnersApplied) {
		this.totalWinnersApplied = totalWinnersApplied;
	}

	public Integer getTiesDetectedCount() {
		return tiesDetectedCount;
	}

	public void setTiesDetectedCount(Integer tiesDetectedCount) {
		this.tiesDetectedCount = tiesDetectedCount;
	}

	public Instant getServerTime() {
		return serverTime;
	}

	public void setServerTime(Instant serverTime) {
		this.serverTime = serverTime;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

}
