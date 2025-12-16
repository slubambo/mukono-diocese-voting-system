package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.model.org.Archdeaconry;
import com.mukono.voting.model.org.Church;
import com.mukono.voting.model.org.Diocese;
import com.mukono.voting.model.org.Fellowship;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Election entity representing an election for leadership positions within a fellowship.
 * Supports elections at different scopes (DIOCESE, ARCHDEACONRY, CHURCH) with configurable
 * term dates and nomination/voting windows.
 */
@Entity
@Table(name = "elections", indexes = {
    @Index(name = "idx_elections_fellowship", columnList = "fellowship_id"),
    @Index(name = "idx_elections_scope", columnList = "scope"),
    @Index(name = "idx_elections_status", columnList = "status"),
    @Index(name = "idx_elections_diocese", columnList = "diocese_id"),
    @Index(name = "idx_elections_archdeaconry", columnList = "archdeaconry_id"),
    @Index(name = "idx_elections_church", columnList = "church_id")
})
public class Election extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    @NotBlank(message = "Election name is required")
    @Size(max = 255, message = "Election name must not exceed 255 characters")
    private String name;

    @Column(length = 1000)
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Election status is required")
    private ElectionStatus status = ElectionStatus.DRAFT;

    // Ownership / Context
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fellowship_id", nullable = false)
    @NotNull(message = "Fellowship is required")
    private Fellowship fellowship;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Scope is required")
    private PositionScope scope;

    // Target (scope-driven; nullable at DB, enforced in service)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diocese_id")
    private Diocese diocese;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archdeaconry_id")
    private Archdeaconry archdeaconry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id")
    private Church church;

    // Term (feeds leadership assignments later)
    @Column(nullable = false)
    @NotNull(message = "Term start date is required")
    private LocalDate termStartDate;

    @Column(nullable = false)
    @NotNull(message = "Term end date is required")
    private LocalDate termEndDate;

    // Nomination window (optional but included in model)
    @Column
    private Instant nominationStartAt;

    @Column
    private Instant nominationEndAt;

    // Voting window (required for real election)
    @Column(nullable = false)
    @NotNull(message = "Voting start time is required")
    private Instant votingStartAt;

    @Column(nullable = false)
    @NotNull(message = "Voting end time is required")
    private Instant votingEndAt;

    // Relationships
    @OneToMany(mappedBy = "election", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ElectionPosition> electionPositions = new ArrayList<>();

    // Constructors
    public Election() {
    }

    public Election(String name, Fellowship fellowship, PositionScope scope, 
                    LocalDate termStartDate, LocalDate termEndDate,
                    Instant votingStartAt, Instant votingEndAt) {
        this.name = name;
        this.fellowship = fellowship;
        this.scope = scope;
        this.termStartDate = termStartDate;
        this.termEndDate = termEndDate;
        this.votingStartAt = votingStartAt;
        this.votingEndAt = votingEndAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public ElectionStatus getStatus() {
        return status;
    }

    public void setStatus(ElectionStatus status) {
        this.status = status;
    }

    public Fellowship getFellowship() {
        return fellowship;
    }

    public void setFellowship(Fellowship fellowship) {
        this.fellowship = fellowship;
    }

    public PositionScope getScope() {
        return scope;
    }

    public void setScope(PositionScope scope) {
        this.scope = scope;
    }

    public Diocese getDiocese() {
        return diocese;
    }

    public void setDiocese(Diocese diocese) {
        this.diocese = diocese;
    }

    public Archdeaconry getArchdeaconry() {
        return archdeaconry;
    }

    public void setArchdeaconry(Archdeaconry archdeaconry) {
        this.archdeaconry = archdeaconry;
    }

    public Church getChurch() {
        return church;
    }

    public void setChurch(Church church) {
        this.church = church;
    }

    public LocalDate getTermStartDate() {
        return termStartDate;
    }

    public void setTermStartDate(LocalDate termStartDate) {
        this.termStartDate = termStartDate;
    }

    public LocalDate getTermEndDate() {
        return termEndDate;
    }

    public void setTermEndDate(LocalDate termEndDate) {
        this.termEndDate = termEndDate;
    }

    public Instant getNominationStartAt() {
        return nominationStartAt;
    }

    public void setNominationStartAt(Instant nominationStartAt) {
        this.nominationStartAt = nominationStartAt;
    }

    public Instant getNominationEndAt() {
        return nominationEndAt;
    }

    public void setNominationEndAt(Instant nominationEndAt) {
        this.nominationEndAt = nominationEndAt;
    }

    public Instant getVotingStartAt() {
        return votingStartAt;
    }

    public void setVotingStartAt(Instant votingStartAt) {
        this.votingStartAt = votingStartAt;
    }

    public Instant getVotingEndAt() {
        return votingEndAt;
    }

    public void setVotingEndAt(Instant votingEndAt) {
        this.votingEndAt = votingEndAt;
    }

    public List<ElectionPosition> getElectionPositions() {
        return electionPositions;
    }

    public void setElectionPositions(List<ElectionPosition> electionPositions) {
        this.electionPositions = electionPositions;
    }

    // Helper methods for managing positions
    public void addElectionPosition(ElectionPosition electionPosition) {
        electionPositions.add(electionPosition);
        electionPosition.setElection(this);
    }

    public void removeElectionPosition(ElectionPosition electionPosition) {
        electionPositions.remove(electionPosition);
        electionPosition.setElection(null);
    }
}
