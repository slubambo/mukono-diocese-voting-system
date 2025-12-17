package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.CertifiedPositionResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertifiedPositionResultRepository extends JpaRepository<CertifiedPositionResult, Long> {

    /**
     * Find certified results for an election and voting period.
     */
    List<CertifiedPositionResult> findByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);

    /**
     * Find certified result for a specific position.
     */
    Optional<CertifiedPositionResult> findByElectionIdAndVotingPeriodIdAndPositionId(
            Long electionId, Long votingPeriodId, Long positionId);

    /**
     * Count certified results.
     */
    long countByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);
}
