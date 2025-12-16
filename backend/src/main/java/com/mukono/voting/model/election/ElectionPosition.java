package com.mukono.voting.model.election;

import com.mukono.voting.model.leadership.FellowshipPosition;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * ElectionPosition entity linking an election to a fellowship position being contested.
 * Represents a single position in an election with a configurable number of seats.
 */
@Entity
@Table(name = "election_positions", 
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_election_fellowship_position",
            columnNames = {"election_id", "fellowship_position_id"}
        )
    },
    indexes = {
        @Index(name = "idx_election_positions_election", columnList = "election_id"),
        @Index(name = "idx_election_positions_fellowship_position", columnList = "fellowship_position_id")
    }
)
public class ElectionPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    @NotNull(message = "Election is required")
    private Election election;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fellowship_position_id", nullable = false)
    @NotNull(message = "Fellowship position is required")
    private FellowshipPosition fellowshipPosition;

    @Column(nullable = false)
    @NotNull(message = "Number of seats is required")
    @Min(value = 1, message = "Number of seats must be at least 1")
    private Integer seats;

    // Constructors
    public ElectionPosition() {
    }

    public ElectionPosition(Election election, FellowshipPosition fellowshipPosition, Integer seats) {
        this.election = election;
        this.fellowshipPosition = fellowshipPosition;
        this.seats = seats;
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

    public FellowshipPosition getFellowshipPosition() {
        return fellowshipPosition;
    }

    public void setFellowshipPosition(FellowshipPosition fellowshipPosition) {
        this.fellowshipPosition = fellowshipPosition;
    }

    public Integer getSeats() {
        return seats;
    }

    public void setSeats(Integer seats) {
        this.seats = seats;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ElectionPosition)) return false;
        ElectionPosition that = (ElectionPosition) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
