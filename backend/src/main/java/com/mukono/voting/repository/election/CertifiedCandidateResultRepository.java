package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.CertifiedCandidateResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CertifiedCandidateResultRepository extends JpaRepository<CertifiedCandidateResult, Long> {

    /**
     * Find certified candidate results for a certified position result.
     */
    List<CertifiedCandidateResult> findByCertifiedPositionResultId(Long certifiedPositionResultId);

    /**
     * Find winners for a certified position result.
     */
    List<CertifiedCandidateResult> findByCertifiedPositionResultIdAndIsWinnerTrue(Long certifiedPositionResultId);

    /**
     * Count winners across all positions for an election/period.
     */
    @Query("""
        SELECT COUNT(c) FROM CertifiedCandidateResult c
        WHERE c.certifiedPositionResult.election.id = :electionId
          AND c.certifiedPositionResult.votingPeriod.id = :votingPeriodId
          AND c.isWinner = true
    """)
    long countWinnersByElectionIdAndVotingPeriodId(
            @Param("electionId") Long electionId,
            @Param("votingPeriodId") Long votingPeriodId);
}
