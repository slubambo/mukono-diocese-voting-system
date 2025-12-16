package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.ElectionPosition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ElectionPosition entity.
 * Provides methods to manage positions within elections including listing,
 * lookup, duplicate prevention, and bulk operations.
 */
@Repository
public interface ElectionPositionRepository extends JpaRepository<ElectionPosition, Long> {

    // =========================================================================
    // LIST POSITIONS FOR AN ELECTION
    // =========================================================================

    /**
     * Find all positions for a specific election (paginated).
     * Useful for admin dashboards with pagination.
     * 
     * @param electionId the election ID
     * @param pageable pagination information
     * @return a page of election positions
     */
    Page<ElectionPosition> findByElectionId(Long electionId, Pageable pageable);

    /**
     * Find all positions for a specific election (non-paginated).
     * Useful for service layer operations that need complete list.
     * 
     * @param electionId the election ID
     * @return list of all election positions for the election
     */
    List<ElectionPosition> findByElectionId(Long electionId);

    // =========================================================================
    // LOOKUP SPECIFIC POSITION ENTRY
    // =========================================================================

    /**
     * Get a specific position entry within an election.
     * Used in services to retrieve or update a specific election-position mapping.
     * 
     * @param electionId the election ID
     * @param fellowshipPositionId the fellowship position ID
     * @return Optional containing the election position if found
     */
    Optional<ElectionPosition> findByElectionIdAndFellowshipPositionId(
            Long electionId, Long fellowshipPositionId);

    // =========================================================================
    // DUPLICATE PREVENTION
    // =========================================================================

    /**
     * Check if a position is already added to an election.
     * Matches the unique constraint at repository level for service validation.
     * Prevents adding the same position twice to the same election.
     * 
     * @param electionId the election ID
     * @param fellowshipPositionId the fellowship position ID
     * @return true if the position is already in the election, false otherwise
     */
    boolean existsByElectionIdAndFellowshipPositionId(Long electionId, Long fellowshipPositionId);

    // =========================================================================
    // BULK DELETE BY ELECTION
    // =========================================================================

    /**
     * Delete all positions associated with an election.
     * Used when an election is deleted or reset.
     * Note: With orphanRemoval=true on Election.electionPositions,
     * this may be redundant, but provides explicit control.
     * 
     * @param electionId the election ID
     */
    void deleteByElectionId(Long electionId);
}
