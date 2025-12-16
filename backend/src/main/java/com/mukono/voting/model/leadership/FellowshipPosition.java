package com.mukono.voting.model.leadership;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Fellowship;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * FellowshipPosition entity representing a leadership position within a fellowship.
 * Links a fellowship to a position title with a specific scope and number of seats.
 */
@Entity
@Table(name = "fellowship_positions", uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_fellowship_position", 
        columnNames = {"fellowship_id", "scope", "title_id"}
    )
})
public class FellowshipPosition extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fellowship_id", nullable = false)
    @NotNull(message = "Fellowship is required")
    private Fellowship fellowship;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "title_id", nullable = false)
    @NotNull(message = "Position title is required")
    private PositionTitle title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Position scope is required")
    private PositionScope scope;

    @Column(nullable = false)
    @NotNull(message = "Number of seats is required")
    @Min(value = 1, message = "Number of seats must be at least 1")
    private Integer seats = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecordStatus status = RecordStatus.ACTIVE;

    public FellowshipPosition() {
    }

    public FellowshipPosition(Fellowship fellowship, PositionTitle title, PositionScope scope, Integer seats) {
        this.fellowship = fellowship;
        this.title = title;
        this.scope = scope;
        this.seats = seats;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Fellowship getFellowship() {
        return fellowship;
    }

    public void setFellowship(Fellowship fellowship) {
        this.fellowship = fellowship;
    }

    public PositionTitle getTitle() {
        return title;
    }

    public void setTitle(PositionTitle title) {
        this.title = title;
    }

    public PositionScope getScope() {
        return scope;
    }

    public void setScope(PositionScope scope) {
        this.scope = scope;
    }

    public Integer getSeats() {
        return seats;
    }

    public void setSeats(Integer seats) {
        this.seats = seats;
    }

    public RecordStatus getStatus() {
        return status;
    }

    public void setStatus(RecordStatus status) {
        this.status = status;
    }
}
