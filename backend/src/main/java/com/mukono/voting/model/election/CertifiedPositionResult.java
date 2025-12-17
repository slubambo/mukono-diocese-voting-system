package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Persisted final results per position.
 * Certified snapshot that doesn't change on future queries.
 */
@Entity
@Table(name = "certified_position_results",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_certified_position_result",
                        columnNames = {"election_id", "voting_period_id", "position_id"})
        },
        indexes = {
                @Index(name = "idx_certified_pos_election", columnList = "election_id"),
                @Index(name = "idx_certified_pos_period", columnList = "voting_period_id"),
                @Index(name = "idx_certified_pos_position", columnList = "position_id")
        }
)
public class CertifiedPositionResult extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    @NotNull
    private Election election;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voting_period_id", nullable = false)
    @NotNull
    private VotingPeriod votingPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = false)
    @NotNull
    private ElectionPosition position;

    @Column(name = "total_ballots_for_position", nullable = false)
    @NotNull
    private Long totalBallotsForPosition;

    @Column(name = "turnout_for_position", nullable = false)
    @NotNull
    private Long turnoutForPosition;

    @Column(name = "computed_at", nullable = false)
    @NotNull
    private Instant computedAt;

    @Column(name = "computed_by_person_id")
    private Long computedByPersonId;

    @Column(name = "status", nullable = false, length = 20)
    @NotNull
    private String status = "CERTIFIED";

    @Column(name = "notes", length = 1000)
    @Size(max = 1000)
    private String notes;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public VotingPeriod getVotingPeriod() { return votingPeriod; }
    public void setVotingPeriod(VotingPeriod votingPeriod) { this.votingPeriod = votingPeriod; }

    public ElectionPosition getPosition() { return position; }
    public void setPosition(ElectionPosition position) { this.position = position; }

    public Long getTotalBallotsForPosition() { return totalBallotsForPosition; }
    public void setTotalBallotsForPosition(Long totalBallotsForPosition) { this.totalBallotsForPosition = totalBallotsForPosition; }

    public Long getTurnoutForPosition() { return turnoutForPosition; }
    public void setTurnoutForPosition(Long turnoutForPosition) { this.turnoutForPosition = turnoutForPosition; }

    public Instant getComputedAt() { return computedAt; }
    public void setComputedAt(Instant computedAt) { this.computedAt = computedAt; }

    public Long getComputedByPersonId() { return computedByPersonId; }
    public void setComputedByPersonId(Long computedByPersonId) { this.computedByPersonId = computedByPersonId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
