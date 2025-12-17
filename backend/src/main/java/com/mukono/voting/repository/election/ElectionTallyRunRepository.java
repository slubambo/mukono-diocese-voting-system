package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.ElectionTallyRun;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ElectionTallyRunRepository extends JpaRepository<ElectionTallyRun, Long> {

    /**
     * Find tally run by election and voting period with pessimistic write lock.
     * Prevents concurrent tally attempts.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM ElectionTallyRun t WHERE t.election.id = :electionId AND t.votingPeriod.id = :votingPeriodId")
    Optional<ElectionTallyRun> findByElectionIdAndVotingPeriodIdWithLock(
            @Param("electionId") Long electionId,
            @Param("votingPeriodId") Long votingPeriodId);

    /**
     * Find tally run by election and voting period (no lock).
     */
    Optional<ElectionTallyRun> findByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);

    /**
     * Check if tally exists.
     */
    boolean existsByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);

    /**
     * Count tally runs for an election and voting period.
     */
    long countByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);
}
