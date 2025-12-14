package com.mukono.voting.model.org;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.common.RecordStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Church entity representing a church within an Archdeaconry.
 * Extends DateAudit for automatic timestamp tracking.
 * 
 * Constraint: unique combination of (archdeaconry_id, name)
 */
@Entity
@Table(
    name = "churches",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"archdeaconry_id", "name"}, name = "uk_church_archdeaconry_name")
    }
)
public class Church extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "Church name is required")
    private String name;

    @Column(nullable = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "archdeaconry_id", nullable = false)
    @NotNull(message = "Archdeaconry is required")
    private Archdeaconry archdeaconry;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordStatus status = RecordStatus.ACTIVE;

    public Church() {
    }

    public Church(String name, String code, Archdeaconry archdeaconry) {
        this.name = name;
        this.code = code;
        this.archdeaconry = archdeaconry;
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Archdeaconry getArchdeaconry() {
        return archdeaconry;
    }

    public void setArchdeaconry(Archdeaconry archdeaconry) {
        this.archdeaconry = archdeaconry;
    }

    public RecordStatus getStatus() {
        return status;
    }

    public void setStatus(RecordStatus status) {
        this.status = status;
    }
}
