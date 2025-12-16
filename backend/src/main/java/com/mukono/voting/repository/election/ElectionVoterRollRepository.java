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
     * Find a voter roll entry for a person in an election.
     * Used to check eligibility overrides.
     * 
     * @param electionId the election ID
     * @param personId the person ID
     * @return Optional containing the voter roll entry if found
     */
    Optional<ElectionVoterRoll> findByElectionIdAndPersonId(Long electionId, Long personId);

    /**
     * Check if a voter roll entry exists for a person in an election.
     * 
     * @param electionId the election ID
     * @param personId the person ID
     * @return true if entry exists, false otherwise
     */
    boolean existsByElectionIdAndPersonId(Long electionId, Long personId);

    /**
     * Find all voter roll entries for an election (paginated).
     * 
     * @param electionId the election ID
     * @param pageable pagination information
     * @return page of voter roll entries
     */
    Page<ElectionVoterRoll> findByElectionId(Long electionId, Pageable pageable);

    /**
     * Find voter roll entries filtered by eligibility (paginated).
     * 
     * @param electionId the election ID
     * @param eligible the eligibility flag (true for whitelist, false for blacklist)
     * @param pageable pagination information
     * @return page of voter roll entries with matching eligibility
     */
    Page<ElectionVoterRoll> findByElectionIdAndEligible(Long electionId, Boolean eligible, Pageable pageable);

    // =========================================================================
    // COUNTS
    // =========================================================================

    /**
     * Count voter roll entries by eligibility for an election.
     * Useful for dashboard statistics (eligible vs ineligible voters).
     * 
     * @param electionId the election ID
     * @param eligible the eligibility flag
     * @return count of voters with the specified eligibility
     */
    long countByElectionIdAndEligible(Long electionId, Boolean eligible);

    // =========================================================================
    // JPQL QUERIES
    // =========================================================================

    /**
     * Fetch all eligible overrides (whitelisted voters) for an election.
     * Used for audit exports and voter management dashboards.
     * 
     * @param electionId the election ID
     * @return list of eligible voter roll entries
     */
    @Query("""
        SELECT vr FROM ElectionVoterRoll vr
        WHERE vr.election.id = :electionId
          AND vr.eligible = true
        ORDER BY vr.addedAt DESC
    """)
    List<ElectionVoterRoll> findEligibleOverrides(@Param("electionId") Long electionId);
}
