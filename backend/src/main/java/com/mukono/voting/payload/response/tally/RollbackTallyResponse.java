package com.mukono.voting.payload.response.tally;

import java.time.Instant;

/**
 * Rollback response.
 */
public class RollbackTallyResponse {
	private Long tallyRunId;
	private String status; // ROLLED_BACK
	private Integer winnersRemoved;
	private Instant rolledBackAt;
	private String message;

	public RollbackTallyResponse() {
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

	public Integer getWinnersRemoved() {
		return winnersRemoved;
	}

	public void setWinnersRemoved(Integer winnersRemoved) {
		this.winnersRemoved = winnersRemoved;
	}

	public Instant getRolledBackAt() {
		return rolledBackAt;
	}

	public void setRolledBackAt(Instant rolledBackAt) {
		this.rolledBackAt = rolledBackAt;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

}
