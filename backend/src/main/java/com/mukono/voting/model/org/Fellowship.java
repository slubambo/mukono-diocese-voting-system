package com.mukono.voting.model.org;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.common.RecordStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

/**
 * Fellowship entity representing a fellowship group within the church structure.
 * Extends DateAudit for automatic timestamp tracking.
 */
@Entity
@Table(name = "fellowships")
public class Fellowship extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @NotBlank(message = "Fellowship name is required")
    private String name;

    @Column(unique = true, nullable = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordStatus status = RecordStatus.ACTIVE;

    public Fellowship() {
    }

    public Fellowship(String name, String code) {
        this.name = name;
        this.code = code;
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

    public RecordStatus getStatus() {
        return status;
    }

    public void setStatus(RecordStatus status) {
        this.status = status;
    }
}
