package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.ElectionVoterRoll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ElectionVoterRoll entity.
 * Manages voter eligibility overrides (whitelist/blacklist) for elections.
 */
@Repository
public interface ElectionVoterRollRepository extends JpaRepository<ElectionVoterRoll, Long> {

    // =========================================================================
    // CORE LOOKUPS
    // =========================================================================

    /**
     * Find a voter roll entry for a person in an election and specific voting period.
     * Used to check eligibility overrides for the voting period.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param personId the person ID
     * @return Optional containing the voter roll entry if found
     */
    Optional<ElectionVoterRoll> findByElectionIdAndVotingPeriodIdAndPersonId(Long electionId, Long votingPeriodId, Long personId);

    /**
     * Check if a voter roll entry exists for a person in an election and voting period.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param personId the person ID
     * @return true if entry exists, false otherwise
     */
    boolean existsByElectionIdAndVotingPeriodIdAndPersonId(Long electionId, Long votingPeriodId, Long personId);

    /**
     * Find all voter roll entries for an election and voting period (paginated).
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param pageable pagination information
     * @return page of voter roll entries
     */
    Page<ElectionVoterRoll> findByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId, Pageable pageable);

    /**
     * Find voter roll entries filtered by eligibility for a voting period (paginated).
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param eligible the eligibility flag (true for whitelist, false for blacklist)
     * @param pageable pagination information
     * @return page of voter roll entries with matching eligibility
     */
    Page<ElectionVoterRoll> findByElectionIdAndVotingPeriodIdAndEligible(Long electionId, Long votingPeriodId, Boolean eligible, Pageable pageable);

    // =========================================================================
    // COUNTS
    // =========================================================================

    /**
     * Count voter roll entries for an election and voting period.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return count of voter roll entries
     */
    long countByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);

    /**
     * Count voter roll entries by eligibility for an election and voting period.
     * Useful for dashboard statistics (eligible vs ineligible voters).
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param eligible the eligibility flag
     * @return count of voters with the specified eligibility
     */
    long countByElectionIdAndVotingPeriodIdAndEligible(Long electionId, Long votingPeriodId, Boolean eligible);

    // =========================================================================
    // JPQL QUERIES
    // =========================================================================

    /**
     * Fetch all eligible overrides (whitelisted voters) for an election and voting period.
     * Used for audit exports and voter management dashboards.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return list of eligible voter roll entries
     */
    @Query("""
        SELECT vr FROM ElectionVoterRoll vr
        WHERE vr.election.id = :electionId
          AND vr.votingPeriod.id = :votingPeriodId
          AND vr.eligible = true
        ORDER BY vr.addedAt DESC
    """)
    List<ElectionVoterRoll> findEligibleOverrides(@Param("electionId") Long electionId, @Param("votingPeriodId") Long votingPeriodId);
}
