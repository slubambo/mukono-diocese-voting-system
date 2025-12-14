package com.mukono.voting.model.org;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.common.RecordStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Archdeaconry entity representing a subdivision within a Diocese.
 * Extends DateAudit for automatic timestamp tracking.
 * 
 * Constraint: unique combination of (diocese_id, name)
 */
@Entity
@Table(
    name = "archdeaconries",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"diocese_id", "name"}, name = "uk_archdeaconry_diocese_name")
    }
)
public class Archdeaconry extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "Archdeaconry name is required")
    private String name;

    @Column(nullable = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "diocese_id", nullable = false)
    @NotNull(message = "Diocese is required")
    private Diocese diocese;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordStatus status = RecordStatus.ACTIVE;

    public Archdeaconry() {
    }

    public Archdeaconry(String name, String code, Diocese diocese) {
        this.name = name;
        this.code = code;
        this.diocese = diocese;
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

    public Diocese getDiocese() {
        return diocese;
    }

    public void setDiocese(Diocese diocese) {
        this.diocese = diocese;
    }

    public RecordStatus getStatus() {
        return status;
    }

    public void setStatus(RecordStatus status) {
        this.status = status;
    }
}
