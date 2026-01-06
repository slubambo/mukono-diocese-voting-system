package com.mukono.voting.payload.response.tally;

import java.util.List;

/**
 * Represents results for a single election position.
 */
public class PositionResultsResponse {
	private Long positionId;
	private String positionName;
	private String scope;
	private Long electionId;
	private String electionName;
	private Long votingPeriodId;
	private String votingPeriodName;
	private Long fellowshipId;
	private String fellowshipName;
	private String locationScope;
	private Long locationId;
	private String locationName;
	private Integer seats;
	private Integer maxVotesPerVoter;
	private Long turnoutForPosition; // distinct voters who voted for this position
	private Long totalBallotsForPosition; // total VoteRecords for this position
	private Double positionVoteShareOfTotal; // percent of total ballots in period
	private List<CandidateResultsResponse> candidates; // sorted by voteCount DESC, then fullName ASC

	public PositionResultsResponse() {
		super();
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

	public String getScope() {
		return scope;
	}

	public void setScope(String scope) {
		this.scope = scope;
	}

	public Long getElectionId() {
		return electionId;
	}

	public void setElectionId(Long electionId) {
		this.electionId = electionId;
	}

	public String getElectionName() {
		return electionName;
	}

	public void setElectionName(String electionName) {
		this.electionName = electionName;
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

	public Long getFellowshipId() {
		return fellowshipId;
	}

	public void setFellowshipId(Long fellowshipId) {
		this.fellowshipId = fellowshipId;
	}

	public String getFellowshipName() {
		return fellowshipName;
	}

	public void setFellowshipName(String fellowshipName) {
		this.fellowshipName = fellowshipName;
	}

	public String getLocationScope() {
		return locationScope;
	}

	public void setLocationScope(String locationScope) {
		this.locationScope = locationScope;
	}

	public Long getLocationId() {
		return locationId;
	}

	public void setLocationId(Long locationId) {
		this.locationId = locationId;
	}

	public String getLocationName() {
		return locationName;
	}

	public void setLocationName(String locationName) {
		this.locationName = locationName;
	}

	public Integer getSeats() {
		return seats;
	}

	public void setSeats(Integer seats) {
		this.seats = seats;
	}

	public Integer getMaxVotesPerVoter() {
		return maxVotesPerVoter;
	}

	public void setMaxVotesPerVoter(Integer maxVotesPerVoter) {
		this.maxVotesPerVoter = maxVotesPerVoter;
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

	public Double getPositionVoteShareOfTotal() {
		return positionVoteShareOfTotal;
	}

	public void setPositionVoteShareOfTotal(Double positionVoteShareOfTotal) {
		this.positionVoteShareOfTotal = positionVoteShareOfTotal;
	}

	public List<CandidateResultsResponse> getCandidates() {
		return candidates;
	}

	public void setCandidates(List<CandidateResultsResponse> candidates) {
		this.candidates = candidates;
	}

}
