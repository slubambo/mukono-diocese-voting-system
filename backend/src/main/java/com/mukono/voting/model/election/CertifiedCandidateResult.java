package com.mukono.voting.model.election;

import com.mukono.voting.audit.DateAudit;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

/**
 * Persisted final vote counts per candidate inside a certified position result.
 */
@Entity
@Table(name = "certified_candidate_results",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_certified_candidate_result",
                        columnNames = {"certified_position_result_id", "candidate_id"})
        },
        indexes = {
                @Index(name = "idx_certified_cand_position", columnList = "certified_position_result_id"),
                @Index(name = "idx_certified_cand_candidate", columnList = "candidate_id"),
                @Index(name = "idx_certified_cand_winner", columnList = "is_winner")
        }
)
public class CertifiedCandidateResult extends DateAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certified_position_result_id", nullable = false)
    @NotNull
    private CertifiedPositionResult certifiedPositionResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    @NotNull
    private ElectionCandidate candidate;

    @Column(name = "vote_count", nullable = false)
    @NotNull
    private Long voteCount;

    @Column(name = "vote_share_percent")
    private Double voteSharePercent;

    @Column(name = "rank", nullable = false)
    @NotNull
    private Integer rank;

    @Column(name = "is_winner", nullable = false)
    @NotNull
    private Boolean isWinner;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CertifiedPositionResult getCertifiedPositionResult() { return certifiedPositionResult; }
    public void setCertifiedPositionResult(CertifiedPositionResult certifiedPositionResult) { this.certifiedPositionResult = certifiedPositionResult; }

    public ElectionCandidate getCandidate() { return candidate; }
    public void setCandidate(ElectionCandidate candidate) { this.candidate = candidate; }

    public Long getVoteCount() { return voteCount; }
    public void setVoteCount(Long voteCount) { this.voteCount = voteCount; }

    public Double getVoteSharePercent() { return voteSharePercent; }
    public void setVoteSharePercent(Double voteSharePercent) { this.voteSharePercent = voteSharePercent; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public Boolean getIsWinner() { return isWinner; }
    public void setIsWinner(Boolean isWinner) { this.isWinner = isWinner; }
}
