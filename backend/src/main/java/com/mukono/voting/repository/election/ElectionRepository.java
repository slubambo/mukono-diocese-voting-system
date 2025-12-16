package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.ElectionStatus;
import com.mukono.voting.model.leadership.PositionScope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Repository for Election entity.
 * Provides methods to manage elections including filtering by fellowship, scope, status,
 * target organization, and time-window queries for automation.
 */
@Repository
public interface ElectionRepository extends JpaRepository<Election, Long> {

    // =========================================================================
    // CORE LISTING BY FELLOWSHIP (most common)
    // =========================================================================

    /**
     * Find all elections for a specific fellowship.
     * 
     * @param fellowshipId the fellowship ID
     * @param pageable pagination information
     * @return a page of elections
     */
    Page<Election> findByFellowshipId(Long fellowshipId, Pageable pageable);

    /**
     * Filter elections by fellowship and scope.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (DIOCESE, ARCHDEACONRY, CHURCH)
     * @param pageable pagination information
     * @return a page of elections matching the criteria
     */
    Page<Election> findByFellowshipIdAndScope(Long fellowshipId, PositionScope scope, Pageable pageable);

    /**
     * Filter elections by fellowship and status.
     * 
     * @param fellowshipId the fellowship ID
     * @param status the election status
     * @param pageable pagination information
     * @return a page of elections matching the criteria
     */
    Page<Election> findByFellowshipIdAndStatus(Long fellowshipId, ElectionStatus status, Pageable pageable);

    /**
     * Filter elections by fellowship, scope, and status.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (DIOCESE, ARCHDEACONRY, CHURCH)
     * @param status the election status
     * @param pageable pagination information
     * @return a page of elections matching the criteria
     */
    Page<Election> findByFellowshipIdAndScopeAndStatus(
            Long fellowshipId, PositionScope scope, ElectionStatus status, Pageable pageable);

    // =========================================================================
    // TARGET-AWARE FILTERS (scope-driven)
    // =========================================================================

    /**
     * Find diocese-level elections for a specific diocese.
     * Scope is included to prevent cross-target confusion.
     * 
     * @param scope the position scope (should be DIOCESE)
     * @param dioceseId the diocese ID
     * @param pageable pagination information
     * @return a page of diocese elections
     */
    Page<Election> findByScopeAndDioceseId(PositionScope scope, Long dioceseId, Pageable pageable);

    /**
     * Find archdeaconry-level elections for a specific archdeaconry.
     * Scope is included to prevent cross-target confusion.
     * 
     * @param scope the position scope (should be ARCHDEACONRY)
     * @param archdeaconryId the archdeaconry ID
     * @param pageable pagination information
     * @return a page of archdeaconry elections
     */
    Page<Election> findByScopeAndArchdeaconryId(PositionScope scope, Long archdeaconryId, Pageable pageable);

    /**
     * Find church-level elections for a specific church.
     * Scope is included to prevent cross-target confusion.
     * 
     * @param scope the position scope (should be CHURCH)
     * @param churchId the church ID
     * @param pageable pagination information
     * @return a page of church elections
     */
    Page<Election> findByScopeAndChurchId(PositionScope scope, Long churchId, Pageable pageable);

    // =========================================================================
    // EXISTENCE / UNIQUENESS GUARDRAILS
    // =========================================================================

    /**
     * Check if a diocese election already exists with the given parameters.
     * Prevents duplicate active elections for the same fellowship, scope, diocese, and term.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (should be DIOCESE)
     * @param dioceseId the diocese ID
     * @param termStartDate the term start date
     * @param termEndDate the term end date
     * @return true if a matching election exists, false otherwise
     */
    boolean existsByFellowshipIdAndScopeAndDioceseIdAndTermStartDateAndTermEndDate(
            Long fellowshipId, PositionScope scope, Long dioceseId, 
            LocalDate termStartDate, LocalDate termEndDate);

    /**
     * Check if an archdeaconry election already exists with the given parameters.
     * Prevents duplicate active elections for the same fellowship, scope, archdeaconry, and term.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (should be ARCHDEACONRY)
     * @param archdeaconryId the archdeaconry ID
     * @param termStartDate the term start date
     * @param termEndDate the term end date
     * @return true if a matching election exists, false otherwise
     */
    boolean existsByFellowshipIdAndScopeAndArchdeaconryIdAndTermStartDateAndTermEndDate(
            Long fellowshipId, PositionScope scope, Long archdeaconryId,
            LocalDate termStartDate, LocalDate termEndDate);

    /**
     * Check if a church election already exists with the given parameters.
     * Prevents duplicate active elections for the same fellowship, scope, church, and term.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (should be CHURCH)
     * @param churchId the church ID
     * @param termStartDate the term start date
     * @param termEndDate the term end date
     * @return true if a matching election exists, false otherwise
     */
    boolean existsByFellowshipIdAndScopeAndChurchIdAndTermStartDateAndTermEndDate(
            Long fellowshipId, PositionScope scope, Long churchId,
            LocalDate termStartDate, LocalDate termEndDate);

    // =========================================================================
    // TIME-WINDOW QUERIES (for automation / "what is open now")
    // =========================================================================

    /**
     * Find elections whose voting window is currently open.
     * Used for automation to determine which elections are accepting votes.
     * 
     * @param now the current timestamp
     * @return list of elections with voting open at the given time
     */
    @Query("""
        SELECT e FROM Election e
        WHERE e.votingStartAt <= :now AND e.votingEndAt >= :now
    """)
    List<Election> findVotingOpenAt(@Param("now") Instant now);

    /**
     * Find elections whose nomination window is currently open.
     * Null-safe: only returns elections where nomination dates are set and currently open.
     * 
     * @param now the current timestamp
     * @return list of elections with nomination open at the given time
     */
    @Query("""
        SELECT e FROM Election e
        WHERE e.nominationStartAt IS NOT NULL
          AND e.nominationEndAt IS NOT NULL
          AND e.nominationStartAt <= :now
          AND e.nominationEndAt >= :now
    """)
    List<Election> findNominationOpenAt(@Param("now") Instant now);
}
