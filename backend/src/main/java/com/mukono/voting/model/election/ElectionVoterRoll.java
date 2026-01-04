package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.people.Person;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * ElectionVoterRoll entity representing voter eligibility overrides for a specific voting period in an election.
 * Supports voter whitelisting, blacklisting, and special voter management.
 * Enables eligibility enforcement in combination with fellowship + scope rules.
 * Extends DateAudit for automatic timestamp tracking.
 */
@Entity
@Table(name = "election_voter_roll", uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_election_voter_roll_unique",
        columnNames = {"election_id", "voting_period_id", "person_id"}
    )
}, indexes = {
    @Index(name = "idx_voter_roll_election", columnList = "election_id"),
    @Index(name = "idx_voter_roll_voting_period", columnList = "voting_period_id"),
    @Index(name = "idx_voter_roll_person", columnList = "person_id"),
    @Index(name = "idx_voter_roll_eligible", columnList = "eligible"),
    @Index(name = "idx_voter_roll_election_period_eligible", columnList = "election_id, voting_period_id, eligible")
})
public class ElectionVoterRoll extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Required Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    @NotNull(message = "Election is required")
    private Election election;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voting_period_id", nullable = false)
    @NotNull(message = "Voting period is required")
    private VotingPeriod votingPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    @NotNull(message = "Person is required")
    private Person person;

    // Eligibility flag
    @Column(nullable = false)
    @NotNull(message = "Eligible flag is required")
    private Boolean eligible = true;

    // Metadata
    @Column(length = 1000)
    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason; // explanation for override

    @Column(length = 255)
    @Size(max = 255, message = "Added by must not exceed 255 characters")
    private String addedBy; // username/email of DS/admin for audit

    @Column(nullable = false)
    @NotNull(message = "Added at timestamp is required")
    private Instant addedAt;

    // Constructors
    public ElectionVoterRoll() {
    }

    public ElectionVoterRoll(Election election, VotingPeriod votingPeriod, Person person, Boolean eligible) {
        this.election = election;
        this.votingPeriod = votingPeriod;
        this.person = person;
        this.eligible = eligible;
    }

    public ElectionVoterRoll(Election election, VotingPeriod votingPeriod, Person person, Boolean eligible, String reason, String addedBy) {
        this.election = election;
        this.votingPeriod = votingPeriod;
        this.person = person;
        this.eligible = eligible;
        this.reason = reason;
        this.addedBy = addedBy;
    }

    // ...existing code...
    public VotingPeriod getVotingPeriod() {
        return votingPeriod;
    }

    public void setVotingPeriod(VotingPeriod votingPeriod) {
        this.votingPeriod = votingPeriod;
    }
    @PrePersist
    public void prePersist() {
        if (this.addedAt == null) {
            this.addedAt = Instant.now();
        }
        if (this.eligible == null) {
            this.eligible = true;
        }
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

    public Person getPerson() {
        return person;
    }

    public void setPerson(Person person) {
        this.person = person;
    }

    public Boolean getEligible() {
        return eligible;
    }

    public void setEligible(Boolean eligible) {
        this.eligible = eligible;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(String addedBy) {
        this.addedBy = addedBy;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ElectionVoterRoll)) return false;
        ElectionVoterRoll that = (ElectionVoterRoll) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
