package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

/**
 * VotingPeriodPosition join entity linking voting periods to election positions.
 * Represents which positions are active for voting during a specific voting period/day.
 */
@Entity
@Table(name = "voting_period_positions",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_voting_period_position",
            columnNames = {"voting_period_id", "election_position_id"}
        )
    },
    indexes = {
        @Index(name = "idx_vpp_voting_period", columnList = "voting_period_id"),
        @Index(name = "idx_vpp_election_position", columnList = "election_position_id"),
        @Index(name = "idx_vpp_election", columnList = "election_id")
    }
)
public class VotingPeriodPosition extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "election_id", nullable = false)
    @NotNull(message = "Election ID is required")
    private Long electionId; // denormalized for easier queries

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voting_period_id", nullable = false)
    @NotNull(message = "Voting period is required")
    private VotingPeriod votingPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_position_id", nullable = false)
    @NotNull(message = "Election position is required")
    private ElectionPosition electionPosition;

    // Constructors
    public VotingPeriodPosition() {
    }

    public VotingPeriodPosition(Long electionId, VotingPeriod votingPeriod, ElectionPosition electionPosition) {
        this.electionId = electionId;
        this.votingPeriod = votingPeriod;
        this.electionPosition = electionPosition;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public VotingPeriod getVotingPeriod() {
        return votingPeriod;
    }

    public void setVotingPeriod(VotingPeriod votingPeriod) {
        this.votingPeriod = votingPeriod;
    }

    public ElectionPosition getElectionPosition() {
        return electionPosition;
    }

    public void setElectionPosition(ElectionPosition electionPosition) {
        this.electionPosition = electionPosition;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof VotingPeriodPosition)) return false;
        VotingPeriodPosition that = (VotingPeriodPosition) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
