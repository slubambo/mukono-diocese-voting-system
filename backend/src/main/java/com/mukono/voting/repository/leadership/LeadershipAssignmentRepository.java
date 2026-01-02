package com.mukono.voting.repository.leadership;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.LeadershipAssignment;
import com.mukono.voting.model.leadership.PositionScope;

import java.util.List;

/**
 * Repository for LeadershipAssignment entity.
 * Provides methods for managing leadership assignments, checking seat availability,
 * and retrieving eligible leaders for voting purposes.
 */
@Repository
public interface LeadershipAssignmentRepository extends JpaRepository<LeadershipAssignment, Long> {

    // ========== Slot Counting Methods (for seats enforcement in service layer) ==========
    
    /**
     * Count active assignments for a specific fellowship position (any target).
     * Used for overall seat limit checking.
     * 
     * @param fellowshipPositionId the fellowship position ID
     * @param status the record status
     * @return count of matching assignments
     */
    long countByFellowshipPositionIdAndStatus(Long fellowshipPositionId, RecordStatus status);

    /**
     * Count active assignments for a fellowship position at a specific archdeaconry.
     * Used for archdeaconry-level seat limit checking.
     * 
     * @param fellowshipPositionId the fellowship position ID
     * @param archdeaconryId the archdeaconry ID
     * @param status the record status
     * @return count of matching assignments
     */
    long countByFellowshipPositionIdAndArchdeaconryIdAndStatus(
        Long fellowshipPositionId, 
        Long archdeaconryId, 
        RecordStatus status
    );

    /**
     * Count active assignments for a fellowship position at a specific diocese.
     * Used for diocese-level seat limit checking.
     * 
     * @param fellowshipPositionId the fellowship position ID
     * @param dioceseId the diocese ID
     * @param status the record status
     * @return count of matching assignments
     */
    long countByFellowshipPositionIdAndDioceseIdAndStatus(
        Long fellowshipPositionId, 
        Long dioceseId, 
        RecordStatus status
    );

    /**
     * Count active assignments for a fellowship position at a specific church.
     * Used for church-level seat limit checking.
     * 
     * @param fellowshipPositionId the fellowship position ID
     * @param churchId the church ID
     * @param status the record status
     * @return count of matching assignments
     */
    long countByFellowshipPositionIdAndChurchIdAndStatus(
        Long fellowshipPositionId, 
        Long churchId, 
        RecordStatus status
    );

    // ========== Listing/Filtering Methods (for DS views) ==========
    
    /**
     * Find all assignments with a specific status.
     * 
     * @param status the record status
     * @param pageable pagination information
     * @return a page of leadership assignments
     */
    Page<LeadershipAssignment> findByStatus(RecordStatus status, Pageable pageable);

    /**
     * Find all assignments for a specific person.
     * 
     * @param personId the person ID
     * @param pageable pagination information
     * @return a page of leadership assignments
     */
    Page<LeadershipAssignment> findByPersonId(Long personId, Pageable pageable);

    /**
     * Find all assignments for a specific fellowship.
     * 
     * @param fellowshipId the fellowship ID
     * @param pageable pagination information
     * @return a page of leadership assignments
     */
    Page<LeadershipAssignment> findByFellowshipPositionFellowshipId(Long fellowshipId, Pageable pageable);

    /**
     * Find all assignments for a specific archdeaconry.
     * 
     * @param archdeaconryId the archdeaconry ID
     * @param pageable pagination information
     * @return a page of leadership assignments
     */
    Page<LeadershipAssignment> findByArchdeaconryId(Long archdeaconryId, Pageable pageable);

    /**
     * Find all assignments for a specific diocese.
     * 
     * @param dioceseId the diocese ID
     * @param pageable pagination information
     * @return a page of leadership assignments
     */
    Page<LeadershipAssignment> findByDioceseId(Long dioceseId, Pageable pageable);

    /**
     * Find all assignments for a specific church.
     * 
     * @param churchId the church ID
     * @param pageable pagination information
     * @return a page of leadership assignments
     */
    Page<LeadershipAssignment> findByChurchId(Long churchId, Pageable pageable);

    /**
     * Find all assignments for a specific diocese with status filter.
     * 
     * @param dioceseId the diocese ID
     * @param status the record status
     * @param pageable pagination information
     * @return a page of leadership assignments
     */
    Page<LeadershipAssignment> findByDioceseIdAndStatus(Long dioceseId, RecordStatus status, Pageable pageable);

    /**
     * Find all assignments for a specific archdeaconry with status filter.
     * 
     * @param archdeaconryId the archdeaconry ID
     * @param status the record status
     * @param pageable pagination information
     * @return a page of leadership assignments
     */
    Page<LeadershipAssignment> findByArchdeaconryIdAndStatus(Long archdeaconryId, RecordStatus status, Pageable pageable);

    /**
     * Find all assignments for a specific church with status filter.
     * 
     * @param churchId the church ID
     * @param status the record status
     * @param pageable pagination information
     * @return a page of leadership assignments
     */
    Page<LeadershipAssignment> findByChurchIdAndStatus(Long churchId, RecordStatus status, Pageable pageable);

    // ========== Eligibility Queries (core for voting) ==========
    
    /**
     * Find active assignments for a fellowship at a specific scope (paginated).
     * Used for retrieving eligible leaders for voting purposes.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (DIOCESE, ARCHDEACONRY, CHURCH)
     * @param status the record status
     * @param pageable pagination information
     * @return a page of matching leadership assignments
     */
    Page<LeadershipAssignment> findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
        Long fellowshipId, 
        PositionScope scope, 
        RecordStatus status, 
        Pageable pageable
    );

    /**
     * Find active assignments for a fellowship at a specific scope (non-paginated).
     * Used for eligibility exports and validation.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (DIOCESE, ARCHDEACONRY, CHURCH)
     * @param status the record status
     * @return a list of matching leadership assignments
     */
    List<LeadershipAssignment> findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
        Long fellowshipId, 
        PositionScope scope, 
        RecordStatus status
    );

    /**
     * Find assignments for a fellowship at a specific scope and diocese.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope
     * @param dioceseId the diocese ID
     * @param status the record status
     * @param pageable pagination information
     * @return a page of matching leadership assignments
     */
    Page<LeadershipAssignment> findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndDioceseIdAndStatus(
        Long fellowshipId,
        PositionScope scope,
        Long dioceseId,
        RecordStatus status,
        Pageable pageable
    );

    /**
     * Find assignments for a fellowship at a specific scope and archdeaconry.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope
     * @param archdeaconryId the archdeaconry ID
     * @param status the record status
     * @param pageable pagination information
     * @return a page of matching leadership assignments
     */
    Page<LeadershipAssignment> findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndArchdeaconryIdAndStatus(
        Long fellowshipId,
        PositionScope scope,
        Long archdeaconryId,
        RecordStatus status,
        Pageable pageable
    );

    /**
     * Find assignments for a fellowship at a specific scope and church.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope
     * @param churchId the church ID
     * @param status the record status
     * @param pageable pagination information
     * @return a page of matching leadership assignments
     */
    Page<LeadershipAssignment> findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndChurchIdAndStatus(
        Long fellowshipId,
        PositionScope scope,
        Long churchId,
        RecordStatus status,
        Pageable pageable
    );

    /**
     * Find assignments by scope and status.
     * 
     * @param scope the position scope
     * @param status the record status
     * @param pageable pagination information
     * @return a page of matching leadership assignments
     */
    Page<LeadershipAssignment> findByFellowshipPositionScopeAndStatus(
        PositionScope scope,
        RecordStatus status,
        Pageable pageable
    );

    /**
     * Find assignments by scope, diocese, and status.
     * 
     * @param scope the position scope
     * @param dioceseId the diocese ID
     * @param status the record status
     * @param pageable pagination information
     * @return a page of matching leadership assignments
     */
    Page<LeadershipAssignment> findByFellowshipPositionScopeAndDioceseIdAndStatus(
        PositionScope scope,
        Long dioceseId,
        RecordStatus status,
        Pageable pageable
    );

    /**
     * Find assignments by scope, archdeaconry, and status.
     * 
     * @param scope the position scope
     * @param archdeaconryId the archdeaconry ID
     * @param status the record status
     * @param pageable pagination information
     * @return a page of matching leadership assignments
     */
    Page<LeadershipAssignment> findByFellowshipPositionScopeAndArchdeaconryIdAndStatus(
        PositionScope scope,
        Long archdeaconryId,
        RecordStatus status,
        Pageable pageable
    );

    /**
     * Find assignments by scope, church, and status.
     * 
     * @param scope the position scope
     * @param churchId the church ID
     * @param status the record status
     * @param pageable pagination information
     * @return a page of matching leadership assignments
     */
    Page<LeadershipAssignment> findByFellowshipPositionScopeAndChurchIdAndStatus(
        PositionScope scope,
        Long churchId,
        RecordStatus status,
        Pageable pageable
    );

    // ========== Duplicate Prevention Methods ==========
    
    /**
     * Check if a person already has an active assignment for a specific fellowship position + diocese.
     * Prevents duplicate active assignments.
     * 
     * @param personId the person ID
     * @param fellowshipPositionId the fellowship position ID
     * @param dioceseId the diocese ID
     * @param status the record status
     * @return true if a matching assignment exists
     */
    boolean existsByPersonIdAndFellowshipPositionIdAndDioceseIdAndStatus(
        Long personId, 
        Long fellowshipPositionId, 
        Long dioceseId, 
        RecordStatus status
    );

    /**
     * Check if a person already has an active assignment for a specific fellowship position + archdeaconry.
     * 
     * @param personId the person ID
     * @param fellowshipPositionId the fellowship position ID
     * @param archdeaconryId the archdeaconry ID
     * @param status the record status
     * @return true if a matching assignment exists
     */
    boolean existsByPersonIdAndFellowshipPositionIdAndArchdeaconryIdAndStatus(
        Long personId, 
        Long fellowshipPositionId, 
        Long archdeaconryId, 
        RecordStatus status
    );

    /**
     * Check if a person already has an active assignment for a specific fellowship position + church.
     * 
     * @param personId the person ID
     * @param fellowshipPositionId the fellowship position ID
     * @param churchId the church ID
     * @param status the record status
     * @return true if a matching assignment exists
     */
    boolean existsByPersonIdAndFellowshipPositionIdAndChurchIdAndStatus(
        Long personId, 
        Long fellowshipPositionId, 
        Long churchId, 
        RecordStatus status
    );

    // ========== Person-Specific Eligibility Methods (for voting) ==========

    /**
     * Find a person's active assignment for a fellowship at a specific scope.
     * Used by eligibility service to verify voter belongs to fellowship.
     * 
     * @param personId the person ID
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (DIOCESE, ARCHDEACONRY, CHURCH)
     * @param status the record status
     * @return list of matching assignments (usually 0 or 1)
     */
    List<LeadershipAssignment> findByPersonIdAndFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
        Long personId,
        Long fellowshipId,
        PositionScope scope,
        RecordStatus status
    );

    /**
     * Find a person's active assignment for a specific scope target.
     * Used by eligibility service to verify voter eligible within scope (diocese/archdeaconry/church).
     * 
     * @param personId the person ID
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (DIOCESE, ARCHDEACONRY, CHURCH)
     * @param dioceseId the diocese ID (relevant if scope=DIOCESE)
     * @param archdeaconryId the archdeaconry ID (relevant if scope=ARCHDEACONRY)
     * @param churchId the church ID (relevant if scope=CHURCH)
     * @param status the record status
     * @return list of matching assignments (usually 0 or 1)
     */
    List<LeadershipAssignment> findByPersonIdAndFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndDioceseIdAndArchdeaconryIdAndChurchIdAndStatus(
        Long personId,
        Long fellowshipId,
        PositionScope scope,
        Long dioceseId,
        Long archdeaconryId,
        Long churchId,
        RecordStatus status
    );

    /**
     * Find a person's active assignment for a specific scope target (paginated).
     * Used for API responses with pagination.
     * 
     * @param personId the person ID
     * @param fellowshipId the fellowship ID
     * @param scope the position scope (DIOCESE, ARCHDEACONRY, CHURCH)
     * @param dioceseId the diocese ID (relevant if scope=DIOCESE)
     * @param archdeaconryId the archdeaconry ID (relevant if scope=ARCHDEACONRY)
     * @param churchId the church ID (relevant if scope=CHURCH)
     * @param status the record status
     * @param pageable pagination information
     * @return page of matching assignments
     */
    Page<LeadershipAssignment> findByPersonIdAndFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndDioceseIdAndArchdeaconryIdAndChurchIdAndStatus(
        Long personId,
        Long fellowshipId,
        PositionScope scope,
        Long dioceseId,
        Long archdeaconryId,
        Long churchId,
        RecordStatus status,
        Pageable pageable
    );

    /**
     * Find all assignments for a specific person with a given status.
     * Used for ballot generation to get candidate origin information.
     * 
     * @param personId the person ID
     * @param status the record status
     * @return list of leadership assignments
     */
    List<LeadershipAssignment> findByPersonIdAndStatus(Long personId, RecordStatus status);

    /**
     * Count active leadership assignments for an archdeaconry.
     * 
     * @param archdeaconryId the archdeaconry ID
     * @param status the record status
     * @return count of active leadership assignments
     */
    long countByArchdeaconryIdAndStatus(Long archdeaconryId, RecordStatus status);

    /**
     * Count active leadership assignments for a church.
     * 
     * @param churchId the church ID
     * @param status the record status
     * @return count of active leadership assignments
     */
    long countByChurchIdAndStatus(Long churchId, RecordStatus status);
}