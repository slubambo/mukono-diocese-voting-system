package com.mukono.voting.repository.leadership;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.LeadershipAssignment;
import com.mukono.voting.model.leadership.PositionScope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
