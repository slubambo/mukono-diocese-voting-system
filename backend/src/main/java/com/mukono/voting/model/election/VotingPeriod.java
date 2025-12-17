package com.mukono.voting.model.election;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

import com.mukono.voting.audit.DateAudit;

/**
 * VotingPeriod entity representing a round of voting within an election.
 * 
 * Elections can have multiple voting periods (rounds) to accommodate different
 * voting sessions or phased voting.
 * 
 * Status Lifecycle: - SCHEDULED: Period is scheduled but not yet open - OPEN:
 * Period is currently open for voting - CLOSED: Period has been closed -
 * CANCELLED: Period has been cancelled
 */
@Entity
@Table(name = "voting_periods", indexes = { @Index(name = "idx_voting_period_election", columnList = "election_id"),
		@Index(name = "idx_voting_period_status", columnList = "status"),
		@Index(name = "idx_voting_period_start", columnList = "start_time"),
		@Index(name = "idx_voting_period_end", columnList = "end_time") })
public class VotingPeriod extends DateAudit {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "election_id", nullable = false)
	@NotNull(message = "Election is required")
	private Election election;

	@Column(nullable = false, length = 100)
	@NotNull(message = "Name is required")
	@Size(min = 1, max = 100, message = "Name must be 1-100 characters")
	private String name;

	@Column(length = 500)
	@Size(max = 500, message = "Description must not exceed 500 characters")
	private String description;

	@Column(name = "start_time", nullable = false)
	@NotNull(message = "Start time is required")
	private LocalDateTime startTime;

	@Column(name = "end_time", nullable = false)
	@NotNull(message = "End time is required")
	private LocalDateTime endTime;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	@NotNull(message = "Status is required")
	private VotingPeriodStatus status;

	// Constructors
	public VotingPeriod() {
		this.status = VotingPeriodStatus.SCHEDULED;
	}

	public VotingPeriod(Election election, String name, LocalDateTime startTime, LocalDateTime endTime) {
		this.election = election;
		this.name = name;
		this.startTime = startTime;
		this.endTime = endTime;
		this.status = VotingPeriodStatus.SCHEDULED;
	}

	// Getters and Setters
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Election getElection() {
		return election;
	}

	public void setElection(Election election) {
		this.election = election;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public LocalDateTime getStartTime() {
		return startTime;
	}

	public void setStartTime(LocalDateTime startTime) {
		this.startTime = startTime;
	}

	public LocalDateTime getEndTime() {
		return endTime;
	}

	public void setEndTime(LocalDateTime endTime) {
		this.endTime = endTime;
	}

	public VotingPeriodStatus getStatus() {
		return status;
	}

	public void setStatus(VotingPeriodStatus status) {
		this.status = status;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (!(o instanceof VotingPeriod))
			return false;
		VotingPeriod that = (VotingPeriod) o;
		return id != null && id.equals(that.id);
	}

	@Override
	public int hashCode() {
		return getClass().hashCode();
	}
}
