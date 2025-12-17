package com.mukono.voting.model.election;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "vote_selections",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_vote_selection_unique",
                        columnNames = {"vote_record_id", "candidate_id"})
        },
        indexes = {
                @Index(name = "idx_vote_selection_record", columnList = "vote_record_id"),
                @Index(name = "idx_vote_selection_candidate", columnList = "candidate_id")
        }
)
public class VoteSelection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vote_record_id", nullable = false)
    @NotNull
    private VoteRecord voteRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    @NotNull
    private ElectionCandidate candidate;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public VoteRecord getVoteRecord() { return voteRecord; }
    public void setVoteRecord(VoteRecord voteRecord) { this.voteRecord = voteRecord; }

    public ElectionCandidate getCandidate() { return candidate; }
    public void setCandidate(ElectionCandidate candidate) { this.candidate = candidate; }
}
