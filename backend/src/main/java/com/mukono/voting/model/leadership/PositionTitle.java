package com.mukono.voting.model.leadership;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.common.RecordStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * PositionTitle entity representing a reusable leadership position title.
 * Examples: "Chairperson", "Secretary", "Treasurer", etc.
 */
@Entity
@Table(name = "position_titles", uniqueConstraints = {
    @UniqueConstraint(name = "uk_position_title_name", columnNames = "name")
})
public class PositionTitle extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255, unique = true)
    @NotBlank(message = "Position title name is required")
    @Size(max = 255, message = "Position title name must not exceed 255 characters")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordStatus status = RecordStatus.ACTIVE;

    public PositionTitle() {
    }

    public PositionTitle(String name) {
        this.name = name;
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

    public RecordStatus getStatus() {
        return status;
    }

    public void setStatus(RecordStatus status) {
        this.status = status;
    }
}
