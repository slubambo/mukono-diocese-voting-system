package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.ElectionCandidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ElectionCandidate entity.
 * Provides methods to manage ballot-ready candidates including listing,
 * lookup, and counting for election ballots and dashboards.
 */
@Repository
public interface ElectionCandidateRepository extends JpaRepository<ElectionCandidate, Long> {

    // =========================================================================
    // A) FETCHING
    // =========================================================================

    /**
     * Find all candidates for a specific election (paginated).
     * 
     * @param electionId the election ID
     * @param pageable pagination information
     * @return page of candidates for the election
     */
    Page<ElectionCandidate> findByElectionId(Long electionId, Pageable pageable);

    /**
     * Find all candidates for a specific election position (paginated).
     * 
     * @param electionPositionId the election position ID
     * @param pageable pagination information
     * @return page of candidates for the position
     */
    Page<ElectionCandidate> findByElectionPositionId(Long electionPositionId, Pageable pageable);

    /**
     * Find a specific candidate by election, position, and person.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param personId the person ID
     * @return Optional containing the candidate if found
     */
    Optional<ElectionCandidate> findByElectionIdAndElectionPositionIdAndPersonId(
            Long electionId, Long electionPositionId, Long personId);

    // =========================================================================
    // B) EXISTENCE / DUPLICATE PREVENTION
    // =========================================================================

    /**
     * Check if a candidate already exists for the given election, position, and person.
     * Prevents duplicate candidate entries.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param personId the person ID
     * @return true if candidate exists, false otherwise
     */
    boolean existsByElectionIdAndElectionPositionIdAndPersonId(
            Long electionId, Long electionPositionId, Long personId);

    // =========================================================================
    // C) CANDIDATE LISTS FOR BALLOT
    // =========================================================================

    /**
     * Find all candidates for a position in an election (non-paginated).
     * Returns candidates in stable order ready for ballot generation.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @return list of candidates for the position
     */
    List<ElectionCandidate> findByElectionIdAndElectionPositionId(Long electionId, Long electionPositionId);

    // =========================================================================
    // D) PERSON-CENTRIC
    // =========================================================================

    /**
     * Find all elections/positions where a person is a candidate (paginated).
     * 
     * @param personId the person ID
     * @param pageable pagination information
     * @return page of candidate entries for the person
     */
    Page<ElectionCandidate> findByPersonId(Long personId, Pageable pageable);

    // =========================================================================
    // E) COUNTS
    // =========================================================================

    /**
     * Count total candidates for an election.
     * Used for dashboard statistics.
     * 
     * @param electionId the election ID
     * @return count of candidates in the election
     */
    long countByElectionId(Long electionId);

    /**
     * Count total candidates for a position.
     * Used for ballot preparation and statistics.
     * 
     * @param electionPositionId the election position ID
     * @return count of candidates for the position
     */
    long countByElectionPositionId(Long electionPositionId);

    // =========================================================================
    // F) CUSTOM JPQL QUERIES
    // =========================================================================

    /**
     * Find all candidates for a position in an election, sorted alphabetically by person's full name.
     * Used for stable, readable ballot generation.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @return list of candidates sorted by person's full name ascending
     */
    @Query("""
        SELECT c FROM ElectionCandidate c 
        WHERE c.election.id = :electionId 
          AND c.electionPosition.id = :electionPositionId
        ORDER BY c.person.fullName ASC
    """)
    List<ElectionCandidate> findCandidatesForBallot(
            @Param("electionId") Long electionId, 
            @Param("electionPositionId") Long electionPositionId);
}
