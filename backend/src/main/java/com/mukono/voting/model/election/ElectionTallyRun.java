package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Tracks tally attempts and enforces idempotency.
 * One certified tally per (election, votingPeriod).
 */
@Entity
@Table(name = "election_tally_runs",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_tally_run_election_period",
                        columnNames = {"election_id", "voting_period_id"})
        },
        indexes = {
                @Index(name = "idx_tally_run_election", columnList = "election_id"),
                @Index(name = "idx_tally_run_period", columnList = "voting_period_id"),
                @Index(name = "idx_tally_run_status", columnList = "status")
        }
)
public class ElectionTallyRun extends DateAudit {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull
    private TallyStatus status;

    @Column(name = "started_at", nullable = false)
    @NotNull
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "started_by_person_id")
    private Long startedByPersonId;

    @Column(name = "completed_by_person_id")
    private Long completedByPersonId;

    @Column(name = "remarks", length = 1000)
    @Size(max = 1000)
    private String remarks;

    @Column(name = "result_hash", length = 64)
    private String resultHash;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public VotingPeriod getVotingPeriod() { return votingPeriod; }
    public void setVotingPeriod(VotingPeriod votingPeriod) { this.votingPeriod = votingPeriod; }

    public TallyStatus getStatus() { return status; }
    public void setStatus(TallyStatus status) { this.status = status; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Long getStartedByPersonId() { return startedByPersonId; }
    public void setStartedByPersonId(Long startedByPersonId) { this.startedByPersonId = startedByPersonId; }

    public Long getCompletedByPersonId() { return completedByPersonId; }
    public void setCompletedByPersonId(Long completedByPersonId) { this.completedByPersonId = completedByPersonId; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getResultHash() { return resultHash; }
    public void setResultHash(String resultHash) { this.resultHash = resultHash; }
}
