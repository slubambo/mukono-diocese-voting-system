package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.VotingPeriodPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VotingPeriodPositionRepository extends JpaRepository<VotingPeriodPosition, Long> {

    /**
     * Find all election position IDs assigned to a voting period.
     */
    @Query("SELECT vpp.electionPosition.id FROM VotingPeriodPosition vpp " +
           "WHERE vpp.electionId = :electionId AND vpp.votingPeriod.id = :votingPeriodId")
    List<Long> findElectionPositionIdsByVotingPeriod(
            @Param("electionId") Long electionId,
            @Param("votingPeriodId") Long votingPeriodId);

    /**
     * Find all mappings for a specific voting period.
     */
    List<VotingPeriodPosition> findByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);

    /**
     * Check if a position is assigned to a voting period.
     */
    boolean existsByVotingPeriodIdAndElectionPositionId(Long votingPeriodId, Long electionPositionId);

    /**
     * Delete all position mappings for a voting period (for bulk replace).
     */
    void deleteByVotingPeriodId(Long votingPeriodId);

    /**
     * Count positions assigned to a voting period.
     */
    long countByVotingPeriodId(Long votingPeriodId);

    /**
     * Bulk count positions for multiple voting period IDs.
     * Returns pairs (votingPeriodId, count).
     */
    @Query("SELECT vpp.votingPeriod.id, COUNT(vpp.id) FROM VotingPeriodPosition vpp " +
           "WHERE vpp.votingPeriod.id IN :votingPeriodIds GROUP BY vpp.votingPeriod.id")
    List<Object[]> countByVotingPeriodIds(@Param("votingPeriodIds") List<Long> votingPeriodIds);

    /**
     * Fetch pairs of (votingPeriodId, electionPositionId) for an election.
     */
    @Query("SELECT vpp.votingPeriod.id, vpp.electionPosition.id FROM VotingPeriodPosition vpp " +
           "WHERE vpp.electionId = :electionId")
    List<Object[]> findPairsByElectionId(@Param("electionId") Long electionId);
}