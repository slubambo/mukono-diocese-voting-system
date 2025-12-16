package com.mukono.voting.model.leadership;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Archdeaconry;
import com.mukono.voting.model.org.Church;
import com.mukono.voting.model.org.Diocese;
import com.mukono.voting.model.people.Person;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * LeadershipAssignment entity representing the assignment of a Person to a 
 * FellowshipPosition for a specific organizational target (Diocese/Archdeaconry/Church)
 * and a 4-year term.
 * 
 * The target scope fields (diocese, archdeaconry, church) are nullable at the database level,
 * but validation rules are enforced in the service layer based on the FellowshipPosition's scope.
 * 
 * Supports multi-seat positions - the service layer enforces seat limits.
 */
@Entity
@Table(
    name = "leadership_assignments",
    indexes = {
        @Index(name = "idx_leadership_person", columnList = "person_id"),
        @Index(name = "idx_leadership_fellowship_position", columnList = "fellowship_position_id"),
        @Index(name = "idx_leadership_status", columnList = "status"),
        @Index(name = "idx_leadership_diocese", columnList = "diocese_id"),
        @Index(name = "idx_leadership_archdeaconry", columnList = "archdeaconry_id"),
        @Index(name = "idx_leadership_church", columnList = "church_id")
    }
)
public class LeadershipAssignment extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    @NotNull(message = "Person is required")
    private Person person;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fellowship_position_id", nullable = false)
    @NotNull(message = "Fellowship position is required")
    private FellowshipPosition fellowshipPosition;

    // Target scope fields - nullable at DB level, validated in service layer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diocese_id", nullable = true)
    private Diocese diocese;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archdeaconry_id", nullable = true)
    private Archdeaconry archdeaconry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id", nullable = true)
    private Church church;

    // Term fields
    @Column(name = "term_start_date", nullable = false)
    @NotNull(message = "Term start date is required")
    private LocalDate termStartDate;

    @Column(name = "term_end_date", nullable = true)
    private LocalDate termEndDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Status is required")
    private RecordStatus status = RecordStatus.ACTIVE;

    @Column(length = 1000)
    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    public LeadershipAssignment() {
    }

    public LeadershipAssignment(Person person, FellowshipPosition fellowshipPosition, LocalDate termStartDate) {
        this.person = person;
        this.fellowshipPosition = fellowshipPosition;
        this.termStartDate = termStartDate;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Person getPerson() {
        return person;
    }

    public void setPerson(Person person) {
        this.person = person;
    }

    public FellowshipPosition getFellowshipPosition() {
        return fellowshipPosition;
    }

    public void setFellowshipPosition(FellowshipPosition fellowshipPosition) {
        this.fellowshipPosition = fellowshipPosition;
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

    public RecordStatus getStatus() {
        return status;
    }

    public void setStatus(RecordStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
