package com.mukono.voting.api.admin.dto;

import java.time.Instant;

/**
 * Tally status response.
 */
public class TallyStatusResponse {
	private Boolean tallyExists;
	private Long tallyRunId;
	private String status;
	private Long electionId;
	private Long votingPeriodId;
	private Instant startedAt;
	private Instant completedAt;
	private Long startedByPersonId;
	private Long completedByPersonId;
	private String remarks;
	private Integer totalPositionsCertified;
	private Integer totalWinnersApplied;

	public TallyStatusResponse() {
		super();
	}

	public Boolean getTallyExists() {
		return tallyExists;
	}

	public void setTallyExists(Boolean tallyExists) {
		this.tallyExists = tallyExists;
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

	public Instant getStartedAt() {
		return startedAt;
	}

	public void setStartedAt(Instant startedAt) {
		this.startedAt = startedAt;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Instant completedAt) {
		this.completedAt = completedAt;
	}

	public Long getStartedByPersonId() {
		return startedByPersonId;
	}

	public void setStartedByPersonId(Long startedByPersonId) {
		this.startedByPersonId = startedByPersonId;
	}

	public Long getCompletedByPersonId() {
		return completedByPersonId;
	}

	public void setCompletedByPersonId(Long completedByPersonId) {
		this.completedByPersonId = completedByPersonId;
	}

	public String getRemarks() {
		return remarks;
	}

	public void setRemarks(String remarks) {
		this.remarks = remarks;
	}

	public Integer getTotalPositionsCertified() {
		return totalPositionsCertified;
	}

	public void setTotalPositionsCertified(Integer totalPositionsCertified) {
		this.totalPositionsCertified = totalPositionsCertified;
	}

	public Integer getTotalWinnersApplied() {
		return totalWinnersApplied;
	}

	public void setTotalWinnersApplied(Integer totalWinnersApplied) {
		this.totalWinnersApplied = totalWinnersApplied;
	}

}
