package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

/**
 * Authoritative election outcome linking winners to positions.
 * Used for audit and to update LeadershipAssignment.
 */
@Entity
@Table(name = "election_winner_assignments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_winner_assignment",
                        columnNames = {"election_id", "voting_period_id", "position_id", "person_id"})
        },
        indexes = {
                @Index(name = "idx_winner_election", columnList = "election_id"),
                @Index(name = "idx_winner_period", columnList = "voting_period_id"),
                @Index(name = "idx_winner_position", columnList = "position_id"),
                @Index(name = "idx_winner_person", columnList = "person_id"),
                @Index(name = "idx_winner_tally", columnList = "tally_run_id")
        }
)
public class ElectionWinnerAssignment extends DateAudit {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    @NotNull
    private ElectionCandidate candidate;

    @Column(name = "person_id", nullable = false)
    @NotNull
    private Long personId;

    @Column(name = "vote_count", nullable = false)
    @NotNull
    private Long voteCount;

    @Column(name = "rank", nullable = false)
    @NotNull
    private Integer rank;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tally_run_id", nullable = false)
    @NotNull
    private ElectionTallyRun tallyRun;

    @Column(name = "created_by_person_id")
    private Long createdByPersonId;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public VotingPeriod getVotingPeriod() { return votingPeriod; }
    public void setVotingPeriod(VotingPeriod votingPeriod) { this.votingPeriod = votingPeriod; }

    public ElectionPosition getPosition() { return position; }
    public void setPosition(ElectionPosition position) { this.position = position; }

    public ElectionCandidate getCandidate() { return candidate; }
    public void setCandidate(ElectionCandidate candidate) { this.candidate = candidate; }

    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }

    public Long getVoteCount() { return voteCount; }
    public void setVoteCount(Long voteCount) { this.voteCount = voteCount; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public ElectionTallyRun getTallyRun() { return tallyRun; }
    public void setTallyRun(ElectionTallyRun tallyRun) { this.tallyRun = tallyRun; }

    public Long getCreatedByPersonId() { return createdByPersonId; }
    public void setCreatedByPersonId(Long createdByPersonId) { this.createdByPersonId = createdByPersonId; }
}
