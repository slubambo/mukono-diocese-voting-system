package com.mukono.voting.payload.request.tally;

/**
 * Request to run a tally.
 */
public class RunTallyRequest {
    private String remarks; // max 1000
    private Boolean force = false; // allow tally even if period not CLOSED
	public RunTallyRequest() {
		super();
	}
	public String getRemarks() {
		return remarks;
	}
	public void setRemarks(String remarks) {
		this.remarks = remarks;
	}
	public Boolean getForce() {
		return force;
	}
	public void setForce(Boolean force) {
		this.force = force;
	}
    
}
