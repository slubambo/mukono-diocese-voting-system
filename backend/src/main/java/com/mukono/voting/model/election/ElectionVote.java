package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.people.Person;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * ElectionVote entity representing a vote cast in an election.
 * Ensures one vote per voter per position per election and provides audit trail.
 * Extends DateAudit for automatic timestamp tracking.
 */
@Entity
@Table(name = "election_votes", uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_election_vote_one_per_position",
        columnNames = {"election_id", "election_position_id", "voter_id"}
    )
}, indexes = {
    @Index(name = "idx_election_votes_election", columnList = "election_id"),
    @Index(name = "idx_election_votes_position", columnList = "election_position_id"),
    @Index(name = "idx_election_votes_candidate", columnList = "candidate_id"),
    @Index(name = "idx_election_votes_voter", columnList = "voter_id"),
    @Index(name = "idx_election_votes_election_position", columnList = "election_id, election_position_id"),
    @Index(name = "idx_election_votes_election_voter", columnList = "election_id, voter_id")
})
public class ElectionVote extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Required Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    @NotNull(message = "Election is required")
    private Election election;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_position_id", nullable = false)
    @NotNull(message = "Election position is required")
    private ElectionPosition electionPosition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    @NotNull(message = "Candidate is required")
    private ElectionCandidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voter_id", nullable = false)
    @NotNull(message = "Voter is required")
    private Person voter;

    // Vote metadata
    @Column(nullable = false)
    @NotNull(message = "Cast at timestamp is required")
    private Instant castAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Vote status is required")
    private VoteStatus status = VoteStatus.CAST;

    // Optional vote source
    @Column(length = 50)
    @Size(max = 50, message = "Source must not exceed 50 characters")
    private String source; // e.g., "WEB", "MOBILE", "USSD"

    // Constructors
    public ElectionVote() {
    }

    public ElectionVote(Election election, ElectionPosition electionPosition, ElectionCandidate candidate, Person voter) {
        this.election = election;
        this.electionPosition = electionPosition;
        this.candidate = candidate;
        this.voter = voter;
        this.status = VoteStatus.CAST;
    }

    // Lifecycle callbacks
    @PrePersist
    public void prePersist() {
        if (this.castAt == null) {
            this.castAt = Instant.now();
        }
        if (this.status == null) {
            this.status = VoteStatus.CAST;
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

    public ElectionPosition getElectionPosition() {
        return electionPosition;
    }

    public void setElectionPosition(ElectionPosition electionPosition) {
        this.electionPosition = electionPosition;
    }

    public ElectionCandidate getCandidate() {
        return candidate;
    }

    public void setCandidate(ElectionCandidate candidate) {
        this.candidate = candidate;
    }

    public Person getVoter() {
        return voter;
    }

    public void setVoter(Person voter) {
        this.voter = voter;
    }

    public Instant getCastAt() {
        return castAt;
    }

    public void setCastAt(Instant castAt) {
        this.castAt = castAt;
    }

    public VoteStatus getStatus() {
        return status;
    }

    public void setStatus(VoteStatus status) {
        this.status = status;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ElectionVote)) return false;
        ElectionVote that = (ElectionVote) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
