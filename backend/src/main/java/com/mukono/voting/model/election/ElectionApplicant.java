package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.people.Person;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * ElectionApplicant entity representing an applicant to a position in an election.
 * Tracks applicants from nomination or manual submission through approval workflow.
 * Extends DateAudit for automatic timestamp tracking.
 */
@Entity
@Table(name = "election_applicants", uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_election_applicant_unique",
        columnNames = {"election_id", "election_position_id", "person_id"}
    )
}, indexes = {
    @Index(name = "idx_election_applicants_election", columnList = "election_id"),
    @Index(name = "idx_election_applicants_election_position", columnList = "election_position_id"),
    @Index(name = "idx_election_applicants_person", columnList = "person_id"),
    @Index(name = "idx_election_applicants_status", columnList = "status"),
    @Index(name = "idx_election_applicants_source", columnList = "source")
})
public class ElectionApplicant extends DateAudit {

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

    // Optional Relationship - nominator/submitter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_person_id")
    private Person submittedBy;

    // Source and Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Applicant source is required")
    private ApplicantSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Applicant status is required")
    private ApplicantStatus status = ApplicantStatus.PENDING;

    // Timestamps
    @Column(nullable = false)
    @NotNull(message = "Submitted at timestamp is required")
    private Instant submittedAt;

    @Column
    private Instant decisionAt;

    // Decision metadata
    @Column(length = 255)
    @Size(max = 255, message = "Decision by must not exceed 255 characters")
    private String decisionBy;

    // Notes
    @Column(length = 1000)
    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    // Constructors
    public ElectionApplicant() {
    }

    public ElectionApplicant(Election election, ElectionPosition electionPosition, Person person,
                            ApplicantSource source) {
        this.election = election;
        this.electionPosition = electionPosition;
        this.person = person;
        this.source = source;
        this.status = ApplicantStatus.PENDING;
    }

    // Lifecycle callbacks
    @PrePersist
    public void prePersist() {
        if (this.submittedAt == null) {
            this.submittedAt = Instant.now();
        }
        if (this.status == null) {
            this.status = ApplicantStatus.PENDING;
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

    public Person getPerson() {
        return person;
    }

    public void setPerson(Person person) {
        this.person = person;
    }

    public Person getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(Person submittedBy) {
        this.submittedBy = submittedBy;
    }

    public ApplicantSource getSource() {
        return source;
    }

    public void setSource(ApplicantSource source) {
        this.source = source;
    }

    public ApplicantStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicantStatus status) {
        this.status = status;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Instant getDecisionAt() {
        return decisionAt;
    }

    public void setDecisionAt(Instant decisionAt) {
        this.decisionAt = decisionAt;
    }

    public String getDecisionBy() {
        return decisionBy;
    }

    public void setDecisionBy(String decisionBy) {
        this.decisionBy = decisionBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ElectionApplicant)) return false;
        ElectionApplicant that = (ElectionApplicant) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
