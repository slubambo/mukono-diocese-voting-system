package com.mukono.voting.model.election;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.people.Person;

/**
 * VotingCode entity representing a single-use credential issued to eligible voters.
 * 
 * Voting codes are issued by DS/Polling Officers and allow voters to access the ballot
 * during a specific Election + Voting Period (Round).
 * 
 * Lifecycle States:
 * - ACTIVE: Code is issued and ready for use
 * - USED: Code has been used to access the ballot
 * - REVOKED: Code has been revoked by an admin
 * - EXPIRED: Code has expired (voting period closed)
 * 
 * Business Rules:
 * - Code must be globally unique
 * - Person must be eligible for the election + voting period
 * - Only ACTIVE codes can be used or revoked
 * - Codes are never deleted (audit trail)
 */
@Entity
@Table(name = "voting_codes",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_voting_code", columnNames = "code")
    },
    indexes = {
        @Index(name = "idx_voting_code_election", columnList = "election_id"),
        @Index(name = "idx_voting_code_period", columnList = "voting_period_id"),
        @Index(name = "idx_voting_code_person", columnList = "person_id"),
        @Index(name = "idx_voting_code_status", columnList = "status"),
        @Index(name = "idx_voting_code_code", columnList = "code")
    }
)
public class VotingCode extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
    @NotNull(message = "Person (voter) is required")
    private Person person;

    @Column(nullable = false, unique = true, length = 20)
    @NotNull(message = "Code is required")
    @Size(min = 8, max = 20, message = "Code must be 8-20 characters")
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Status is required")
    private VotingCodeStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by_person_id", nullable = false)
    @NotNull(message = "Issued by person is required")
    private Person issuedBy;

    @Column(name = "issued_at", nullable = false)
    @NotNull(message = "Issued at timestamp is required")
    private LocalDateTime issuedAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revoked_by_person_id")
    private Person revokedBy;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(length = 1000)
    @Size(max = 1000, message = "Remarks must not exceed 1000 characters")
    private String remarks;

    // Constructors
    public VotingCode() {
    }

    public VotingCode(Election election, VotingPeriod votingPeriod, Person person, String code, Person issuedBy) {
        this.election = election;
        this.votingPeriod = votingPeriod;
        this.person = person;
        this.code = code;
        this.issuedBy = issuedBy;
        this.status = VotingCodeStatus.ACTIVE;
        this.issuedAt = LocalDateTime.now();
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

    public VotingPeriod getVotingPeriod() {
        return votingPeriod;
    }

    public void setVotingPeriod(VotingPeriod votingPeriod) {
        this.votingPeriod = votingPeriod;
    }

    public Person getPerson() {
        return person;
    }

    public void setPerson(Person person) {
        this.person = person;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public VotingCodeStatus getStatus() {
        return status;
    }

    public void setStatus(VotingCodeStatus status) {
        this.status = status;
    }

    public Person getIssuedBy() {
        return issuedBy;
    }

    public void setIssuedBy(Person issuedBy) {
        this.issuedBy = issuedBy;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    public Person getRevokedBy() {
        return revokedBy;
    }

    public void setRevokedBy(Person revokedBy) {
        this.revokedBy = revokedBy;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public void setExpiredAt(LocalDateTime expiredAt) {
        this.expiredAt = expiredAt;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof VotingCode)) return false;
        VotingCode that = (VotingCode) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
