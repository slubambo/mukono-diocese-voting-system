package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.people.Person;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

/**
 * ElectionCandidate entity representing a ballot-ready candidate in an election.
 * Candidates are only created from approved applicants.
 * Extends DateAudit for automatic timestamp tracking.
 */
@Entity
@Table(name = "election_candidates", uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_election_candidate_unique",
        columnNames = {"election_id", "election_position_id", "person_id"}
    )
}, indexes = {
    @Index(name = "idx_election_candidates_election", columnList = "election_id"),
    @Index(name = "idx_election_candidates_election_position", columnList = "election_position_id"),
    @Index(name = "idx_election_candidates_person", columnList = "person_id")
})
public class ElectionCandidate extends DateAudit {

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
    @JoinColumn(name = "person_id", nullable = false)
    @NotNull(message = "Person is required")
    private Person person;

    // Optional Relationship - link to original applicant
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id")
    private ElectionApplicant applicant;

    // Constructors
    public ElectionCandidate() {
    }

    public ElectionCandidate(Election election, ElectionPosition electionPosition, Person person) {
        this.election = election;
        this.electionPosition = electionPosition;
        this.person = person;
    }

    public ElectionCandidate(Election election, ElectionPosition electionPosition, Person person,
                            ElectionApplicant applicant) {
        this.election = election;
        this.electionPosition = electionPosition;
        this.person = person;
        this.applicant = applicant;
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

    public Person getPerson() {
        return person;
    }

    public void setPerson(Person person) {
        this.person = person;
    }

    public ElectionApplicant getApplicant() {
        return applicant;
    }

    public void setApplicant(ElectionApplicant applicant) {
        this.applicant = applicant;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ElectionCandidate)) return false;
        ElectionCandidate that = (ElectionCandidate) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
