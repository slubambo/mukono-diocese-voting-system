package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.ApplicantSource;
import com.mukono.voting.model.election.ApplicantStatus;
import com.mukono.voting.model.election.ElectionApplicant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for ElectionApplicant entity.
 * Provides methods to manage applicants including filtering by status, source,
 * election, position, and person for applicant intake workflows.
 */
@Repository
public interface ElectionApplicantRepository extends JpaRepository<ElectionApplicant, Long> {

    // =========================================================================
    // A) CORE FETCHING
    // =========================================================================

    /**
     * Find all applicants for a specific election (paginated).
     * 
     * @param electionId the election ID
     * @param pageable pagination information
     * @return page of applicants for the election
     */
    Page<ElectionApplicant> findByElectionId(Long electionId, Pageable pageable);

    /**
     * Find all applicants for a specific election position (paginated).
     * 
     * @param electionPositionId the election position ID
     * @param pageable pagination information
     * @return page of applicants for the position
     */
    Page<ElectionApplicant> findByElectionPositionId(Long electionPositionId, Pageable pageable);

    /**
     * Find a specific applicant by election, position, and person.
     * Used to check if a person has already applied for a position in an election.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param personId the person ID
     * @return Optional containing the applicant if found
     */
    Optional<ElectionApplicant> findByElectionIdAndElectionPositionIdAndPersonId(
            Long electionId, Long electionPositionId, Long personId);

    // =========================================================================
    // B) EXISTENCE / DUPLICATE PREVENTION
    // =========================================================================

    /**
     * Check if an applicant already exists for the given election, position, and person.
     * Prevents duplicate applications.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param personId the person ID
     * @return true if applicant exists, false otherwise
     */
    boolean existsByElectionIdAndElectionPositionIdAndPersonId(
            Long electionId, Long electionPositionId, Long personId);

    // =========================================================================
    // C) STATUS-BASED FILTERING
    // =========================================================================

    /**
     * Find all applicants for an election with a specific status (paginated).
     * 
     * @param electionId the election ID
     * @param status the applicant status
     * @param pageable pagination information
     * @return page of applicants with the specified status
     */
    Page<ElectionApplicant> findByElectionIdAndStatus(Long electionId, ApplicantStatus status, Pageable pageable);

    /**
     * Find all applicants for a position with a specific status (paginated).
     * 
     * @param electionPositionId the election position ID
     * @param status the applicant status
     * @param pageable pagination information
     * @return page of applicants with the specified status
     */
    Page<ElectionApplicant> findByElectionPositionIdAndStatus(
            Long electionPositionId, ApplicantStatus status, Pageable pageable);

    // =========================================================================
    // D) SOURCE-BASED FILTERING
    // =========================================================================

    /**
     * Find all applicants for an election from a specific source (paginated).
     * 
     * @param electionId the election ID
     * @param source the applicant source (NOMINATION or MANUAL)
     * @param pageable pagination information
     * @return page of applicants from the specified source
     */
    Page<ElectionApplicant> findByElectionIdAndSource(Long electionId, ApplicantSource source, Pageable pageable);

    // =========================================================================
    // E) COMBINED FILTERS (Election + Position + Status)
    // =========================================================================

    /**
     * Find applicants for a specific election position with a specific status (paginated).
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param status the applicant status
     * @param pageable pagination information
     * @return page of applicants matching all criteria
     */
    Page<ElectionApplicant> findByElectionIdAndElectionPositionIdAndStatus(
            Long electionId, Long electionPositionId, ApplicantStatus status, Pageable pageable);

    // =========================================================================
    // F) PERSON-CENTRIC VIEWS (for "my applications")
    // =========================================================================

    /**
     * Find all applications by a specific person (paginated).
     * 
     * @param personId the person ID
     * @param pageable pagination information
     * @return page of applications submitted by the person
     */
    Page<ElectionApplicant> findByPersonId(Long personId, Pageable pageable);

    /**
     * Find applications by a specific person with a specific status (paginated).
     * 
     * @param personId the person ID
     * @param status the applicant status
     * @param pageable pagination information
     * @return page of person's applications with the specified status
     */
    Page<ElectionApplicant> findByPersonIdAndStatus(Long personId, ApplicantStatus status, Pageable pageable);

    // =========================================================================
    // G) REPORTING COUNTS (fast dashboards)
    // =========================================================================

    /**
     * Count applicants for an election with a specific status.
     * Used for dashboard statistics.
     * 
     * @param electionId the election ID
     * @param status the applicant status
     * @return count of applicants with the specified status
     */
    long countByElectionIdAndStatus(Long electionId, ApplicantStatus status);

    /**
     * Count applicants for a position with a specific status.
     * Used for dashboard statistics.
     * 
     * @param electionPositionId the election position ID
     * @param status the applicant status
     * @return count of applicants with the specified status
     */
    long countByElectionPositionIdAndStatus(Long electionPositionId, ApplicantStatus status);

    // =========================================================================
    // H) CUSTOM JPQL QUERIES
    // =========================================================================

    /**
     * Find pending applicants for an election sorted by submission date (latest first).
     * Used by DS admins to review applicants.
     * 
     * @param electionId the election ID
     * @param pageable pagination information
     * @return page of pending applicants sorted by submission date descending
     */
    @Query("""
        SELECT a FROM ElectionApplicant a 
        WHERE a.election.id = :electionId 
          AND a.status = com.mukono.voting.model.election.ApplicantStatus.PENDING
        ORDER BY a.submittedAt DESC
    """)
    Page<ElectionApplicant> findPendingApplicantsForElection(
            @Param("electionId") Long electionId, Pageable pageable);
}
