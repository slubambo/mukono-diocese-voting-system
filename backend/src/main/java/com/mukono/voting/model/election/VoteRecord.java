package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import com.mukono.voting.model.people.Person;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vote_records",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_vote_record_unique",
                        columnNames = {"election_id", "voting_period_id", "person_id", "position_id"})
        },
        indexes = {
                @Index(name = "idx_vote_record_election", columnList = "election_id"),
                @Index(name = "idx_vote_record_period", columnList = "voting_period_id"),
                @Index(name = "idx_vote_record_person", columnList = "person_id"),
                @Index(name = "idx_vote_record_position", columnList = "position_id")
        }
)
public class VoteRecord extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    @NotNull
    private Election election;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voting_period_id", nullable = false)
    @NotNull
    private VotingPeriod votingPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    @NotNull
    private Person person;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = false)
    @NotNull
    private ElectionPosition position;

    @Column(name = "submitted_at", nullable = false)
    @NotNull
    private Instant submittedAt;

    @Column(name = "receipt_id", nullable = false, length = 50)
    @NotNull
    private String receiptId;

    @OneToMany(mappedBy = "voteRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VoteSelection> selections = new ArrayList<>();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Election getElection() { return election; }
    public void setElection(Election election) { this.election = election; }

    public VotingPeriod getVotingPeriod() { return votingPeriod; }
    public void setVotingPeriod(VotingPeriod votingPeriod) { this.votingPeriod = votingPeriod; }

    public Person getPerson() { return person; }
    public void setPerson(Person person) { this.person = person; }

    public ElectionPosition getPosition() { return position; }
    public void setPosition(ElectionPosition position) { this.position = position; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public String getReceiptId() { return receiptId; }
    public void setReceiptId(String receiptId) { this.receiptId = receiptId; }

    public List<VoteSelection> getSelections() { return selections; }
    public void setSelections(List<VoteSelection> selections) { this.selections = selections; }
}
