package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.VotingCode;
import com.mukono.voting.model.election.VotingCodeStatus;
import com.mukono.voting.repository.election.projection.EligibleVoterProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for VotingCode entity.
 * Provides methods for managing voting codes issued to eligible voters.
 */
@Repository
public interface VotingCodeRepository extends JpaRepository<VotingCode, Long> {

    /**
     * Find voting code by code string (globally unique).
     * 
     * @param code the voting code string
     * @return Optional containing the voting code if found
     */
    Optional<VotingCode> findByCode(String code);

    /**
     * Find active voting code for a specific person in an election + voting period.
     * Used to check if an active code already exists before issuing a new one.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param personId the person ID
     * @param status the voting code status
     * @return Optional containing the voting code if found
     */
    Optional<VotingCode> findByElectionIdAndVotingPeriodIdAndPersonIdAndStatus(
        Long electionId,
        Long votingPeriodId,
        Long personId,
        VotingCodeStatus status
    );

    /**
     * Find all voting codes for a specific election + voting period (paginated).
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param pageable pagination information
     * @return Page of voting codes
     */
    Page<VotingCode> findByElectionIdAndVotingPeriodId(
        Long electionId,
        Long votingPeriodId,
        Pageable pageable
    );

    /**
     * Find all voting codes for a specific election + voting period with status filter (paginated).
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param status the voting code status
     * @param pageable pagination information
     * @return Page of voting codes
     */
    Page<VotingCode> findByElectionIdAndVotingPeriodIdAndStatus(
        Long electionId,
        Long votingPeriodId,
        VotingCodeStatus status,
        Pageable pageable
    );

    /**
     * Check if a code string already exists (for uniqueness validation).
     * 
     * @param code the voting code string
     * @return true if code exists, false otherwise
     */
    boolean existsByCode(String code);

    /**
     * Count voting codes for an election + voting period.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return count of voting codes
     */
    long countByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);

    /**
     * Count voting codes for an election + voting period with status filter.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param status the voting code status
     * @return count of voting codes
     */
    long countByElectionIdAndVotingPeriodIdAndStatus(
        Long electionId,
        Long votingPeriodId,
        VotingCodeStatus status
    );

    /**
     * Find active voting code for a specific person with pessimistic locking.
     * Used for concurrency-safe regeneration.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param personId the person ID
     * @return Optional containing the locked voting code if found
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT vc FROM VotingCode vc WHERE vc.election.id = :electionId " +
           "AND vc.votingPeriod.id = :votingPeriodId AND vc.person.id = :personId AND vc.status = 'ACTIVE'")
    Optional<VotingCode> findActiveForUpdate(
        @Param("electionId") Long electionId,
        @Param("votingPeriodId") Long votingPeriodId,
        @Param("personId") Long personId
    );

    /**
     * Expire all ACTIVE codes for a specific voting period.
     * Used when period transitions to CLOSED or CANCELLED.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param expiredAt the expiration timestamp
     * @return count of codes expired
     */
    @Modifying
    @Query("UPDATE VotingCode vc SET vc.status = 'EXPIRED', vc.expiredAt = :expiredAt " +
           "WHERE vc.election.id = :electionId AND vc.votingPeriod.id = :votingPeriodId " +
           "AND vc.status = 'ACTIVE'")
    int expireActiveCodesForPeriod(
        @Param("electionId") Long electionId,
        @Param("votingPeriodId") Long votingPeriodId,
        @Param("expiredAt") LocalDateTime expiredAt
    );

    /**
     * Find all ACTIVE codes for a voting period.
     * Used to fetch codes for expiration processing.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return list of active voting codes
     */
    @Query("SELECT vc FROM VotingCode vc WHERE vc.election.id = :electionId " +
           "AND vc.votingPeriod.id = :votingPeriodId AND vc.status = 'ACTIVE'")
    java.util.List<VotingCode> findActiveCodesForPeriod(
        @Param("electionId") Long electionId,
        @Param("votingPeriodId") Long votingPeriodId
    );

    /**
     * Search for eligible voters with optional filters and pagination.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID (optional)
     * @param status the vote/code status (ALL, VOTED, NOT_VOTED)
     * @param q search query for voter details (name, phone, email)
     * @param pageable pagination information
     * @return Page of eligible voters projection
     */
    @Query(value = """
        SELECT p.id               AS personId,
               p.full_name        AS fullName,
               p.phone_number     AS phoneNumber,
               p.email            AS email,
               f.name             AS fellowshipName,
               e.scope            AS scope,
               COALESCE(d.name, ad.name, ch.name) AS scopeName,
               CASE WHEN vr.person_id IS NOT NULL THEN TRUE ELSE FALSE END AS voted,
               vr.submitted_at    AS voteCastAt,
               vc.status          AS lastCodeStatus,
               vc.issued_at       AS lastCodeIssuedAt,
               vc.used_at         AS lastCodeUsedAt
        FROM people p
        JOIN leadership_assignments la ON la.person_id = p.id AND la.status = 'ACTIVE'
        JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
        JOIN fellowships f ON f.id = fp.fellowship_id
        JOIN election_positions ep ON ep.fellowship_position_id = fp.id AND ep.election_id = :electionId
        JOIN elections e ON e.id = ep.election_id
        LEFT JOIN dioceses d ON la.diocese_id = d.id
        LEFT JOIN archdeaconries ad ON la.archdeaconry_id = ad.id
        LEFT JOIN churches ch ON la.church_id = ch.id
        LEFT JOIN (
            SELECT vr.person_id, MIN(vr.submitted_at) AS submitted_at
            FROM vote_records vr
            WHERE vr.election_id = :electionId
              AND (:votingPeriodId IS NULL OR vr.voting_period_id = :votingPeriodId)
            GROUP BY vr.person_id
        ) vr ON vr.person_id = p.id
        LEFT JOIN (
            SELECT DISTINCT ON (vc.person_id)
                   vc.person_id,
                   vc.status,
                   vc.issued_at,
                   vc.used_at
            FROM voting_codes vc
            WHERE vc.election_id = :electionId
              AND (:votingPeriodId IS NULL OR vc.voting_period_id = :votingPeriodId)
            ORDER BY vc.person_id, vc.issued_at DESC
        ) vc ON vc.person_id = p.id
        WHERE e.id = :electionId
          AND (:fellowshipId IS NULL OR f.id = :fellowshipId)
          AND (:electionPositionId IS NULL OR ep.id = :electionPositionId)
          AND (:status = 'ALL'
               OR (:status = 'VOTED' AND vr.person_id IS NOT NULL)
               OR (:status = 'NOT_VOTED' AND vr.person_id IS NULL))
          AND (:q IS NULL OR p.full_name ILIKE CONCAT('%', :q, '%')
               OR p.phone_number ILIKE CONCAT('%', :q, '%')
               OR p.email ILIKE CONCAT('%', :q, '%'))
        GROUP BY p.id, p.full_name, p.phone_number, p.email, f.name, e.scope, d.name, ad.name, ch.name,
                 vr.person_id, vr.submitted_at, vc.status, vc.issued_at, vc.used_at
        """,
        countQuery = """
        SELECT COUNT(*)
        FROM (
            SELECT p.id
            FROM people p
            JOIN leadership_assignments la ON la.person_id = p.id AND la.status = 'ACTIVE'
            JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
            JOIN fellowships f ON f.id = fp.fellowship_id
            JOIN election_positions ep ON ep.fellowship_position_id = fp.id AND ep.election_id = :electionId
            JOIN elections e ON e.id = ep.election_id
            WHERE e.id = :electionId
              AND (:status = 'ALL'
                   OR (:status = 'VOTED' AND EXISTS (
                        SELECT 1 FROM vote_records vr2
                        WHERE vr2.election_id = :electionId
                          AND (:votingPeriodId IS NULL OR vr2.voting_period_id = :votingPeriodId)
                          AND vr2.person_id = p.id
                    ))
                   OR (:status = 'NOT_VOTED' AND NOT EXISTS (
                        SELECT 1 FROM vote_records vr3
                        WHERE vr3.election_id = :electionId
                          AND (:votingPeriodId IS NULL OR vr3.voting_period_id = :votingPeriodId)
                          AND vr3.person_id = p.id
                    )))
              AND (:fellowshipId IS NULL OR f.id = :fellowshipId)
              AND (:electionPositionId IS NULL OR ep.id = :electionPositionId)
              AND (:q IS NULL OR p.full_name ILIKE CONCAT('%', :q, '%')
                   OR p.phone_number ILIKE CONCAT('%', :q, '%')
                   OR p.email ILIKE CONCAT('%', :q, '%'))
            GROUP BY p.id
        ) sub
        """,
        nativeQuery = true)
    Page<EligibleVoterProjection> searchEligibleVoters(
        @Param("electionId") Long electionId,
        @Param("votingPeriodId") Long votingPeriodId,
        @Param("status") String status,
        @Param("q") String q,
        @Param("fellowshipId") Long fellowshipId,
        @Param("electionPositionId") Long electionPositionId,
        Pageable pageable
    );
}
