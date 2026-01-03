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
     * Includes both leadership assignment eligible voters and voter roll overrides.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID (optional)
     * @param status the vote/code status (ALL, VOTED, NOT_VOTED)
     * @param q search query for voter details (name, phone, email)
     * @param fellowshipId optional filter by fellowship ID
     * @param electionPositionId optional filter by election position ID
     * @param pageable pagination information
     * @return Page of eligible voters projection
     */
    @Query(value = """
        SELECT p.id               AS personId,
               p.full_name        AS fullName,
               p.phone_number     AS phoneNumber,
               p.email            AS email,
               COALESCE(f.name, 'Manual Override') AS fellowshipName,
               COALESCE(e.scope, 'N/A') AS scope,
               COALESCE(d.name, ad.name, ch.name, 'N/A') AS scopeName,
               CASE WHEN vr_vote.person_id IS NOT NULL THEN 1 ELSE 0 END AS voted,
               vr_vote.submitted_at AS voteCastAt,
               vc.status          AS lastCodeStatus,
               vc.issued_at       AS lastCodeIssuedAt,
               vc.used_at         AS lastCodeUsedAt,
               vc.code            AS code,
               CASE WHEN evr.id IS NOT NULL THEN 1 ELSE 0 END AS isOverride,
               evr.reason         AS overrideReason,
               la.id              AS leadershipAssignmentId,
               -- Position + location string, e.g., "Chairperson (Misindye Church)"
               CASE 
                 WHEN la.id IS NOT NULL THEN CONCAT(pt.name, ' (', COALESCE(d.name, ad.name, ch.name, 'N/A'), ')')
                 WHEN evr.id IS NOT NULL THEN 'Manual Override (N/A)'
                 ELSE 'N/A'
               END AS positionAndLocation,
               -- build JSON history of previous codes for this person
               (
                   SELECT JSON_ARRAYAGG(JSON_OBJECT(
                       'code', all_vc.code,
                       'status', all_vc.status,
                       'issuedAt', all_vc.issued_at,
                       'usedAt', all_vc.used_at,
                       'revokedAt', all_vc.revoked_at,
                       'expiredAt', all_vc.expired_at
                   ))
                   FROM voting_codes all_vc
                   WHERE all_vc.election_id = :electionId
                     AND (:votingPeriodId IS NULL OR all_vc.voting_period_id = :votingPeriodId)
                     AND all_vc.person_id = p.id
               ) AS codeHistoryJson
        FROM (
            -- Union of leadership assignment voters and voter roll voters
            SELECT p.id, la.id as la_id, f.name, f.id as f_id, e.scope, 
                   d.id as d_id, d.name as d_name, ad.id as ad_id, ad.name as ad_name, 
                   ch.id as ch_id, ch.name as ch_name, ep.id as ep_id, NULL as evr_id
            FROM people p
            JOIN leadership_assignments la ON la.person_id = p.id AND la.status = 'ACTIVE'
            JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
            JOIN position_titles pt ON pt.id = fp.title_id
            JOIN fellowships f ON f.id = fp.fellowship_id
            JOIN election_positions ep ON ep.fellowship_position_id = fp.id AND ep.election_id = :electionId
            JOIN elections e ON e.id = ep.election_id
            LEFT JOIN dioceses d ON la.diocese_id = d.id
            LEFT JOIN archdeaconries ad ON la.archdeaconry_id = ad.id
            LEFT JOIN churches ch ON la.church_id = ch.id
            UNION
            SELECT p.id, NULL as la_id, NULL as f_name, NULL as f_id, NULL as e_scope,
                   NULL as d_id, NULL as d_name, NULL as ad_id, NULL as ad_name,
                   NULL as ch_id, NULL as ch_name, NULL as ep_id, evr.id as evr_id
            FROM people p
            JOIN election_voter_roll evr ON evr.person_id = p.id AND evr.election_id = :electionId AND evr.eligible = true
        ) eligible_voters
        LEFT JOIN leadership_assignments la ON la.id = eligible_voters.la_id
        LEFT JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
        LEFT JOIN position_titles pt ON pt.id = fp.title_id
        LEFT JOIN fellowships f ON f.id = fp.fellowship_id
        LEFT JOIN elections e ON e.id = :electionId
        LEFT JOIN dioceses d ON d.id = eligible_voters.d_id
        LEFT JOIN archdeaconries ad ON ad.id = eligible_voters.ad_id
        LEFT JOIN churches ch ON ch.id = eligible_voters.ch_id
        LEFT JOIN election_positions ep ON ep.id = eligible_voters.ep_id
        LEFT JOIN election_voter_roll evr ON evr.id = eligible_voters.evr_id
        JOIN people p ON p.id = eligible_voters.id
        LEFT JOIN (
            SELECT vr.person_id, MIN(vr.submitted_at) AS submitted_at
            FROM vote_records vr
            WHERE vr.election_id = :electionId
              AND (:votingPeriodId IS NULL OR vr.voting_period_id = :votingPeriodId)
            GROUP BY vr.person_id
        ) vr_vote ON vr_vote.person_id = p.id
        LEFT JOIN (
            SELECT person_id, code, status, issued_at, used_at
            FROM (
                SELECT vc.person_id, vc.code, vc.status, vc.issued_at, vc.used_at,
                       ROW_NUMBER() OVER (PARTITION BY vc.person_id ORDER BY vc.issued_at DESC) AS rn
                FROM voting_codes vc
                WHERE vc.election_id = :electionId
                  AND (:votingPeriodId IS NULL OR vc.voting_period_id = :votingPeriodId)
            ) t
            WHERE t.rn = 1
        ) vc ON vc.person_id = p.id
        WHERE (:fellowshipId IS NULL OR f.id = :fellowshipId)
              AND (:electionPositionId IS NULL OR ep.id = :electionPositionId)
              AND (:status = 'ALL'
                   OR (:status = 'VOTED' AND vr_vote.person_id IS NOT NULL)
                   OR (:status = 'NOT_VOTED' AND vr_vote.person_id IS NULL))
              AND (:q IS NULL OR LOWER(p.full_name) LIKE CONCAT('%', LOWER(:q), '%')
                   OR LOWER(p.phone_number) LIKE CONCAT('%', LOWER(:q), '%')
                   OR LOWER(p.email) LIKE CONCAT('%', LOWER(:q), '%'))
        GROUP BY p.id, p.full_name, p.phone_number, p.email, f.name, e.scope, 
                 d.name, ad.name, ch.name, vr_vote.person_id, vr_vote.submitted_at, 
                 vc.status, vc.issued_at, vc.used_at, vc.code, evr.id, evr.reason, la.id, pt.name
        """,
        countQuery = """
        SELECT COUNT(DISTINCT p.id)
        FROM (
            -- Union of leadership assignment voters and voter roll voters
            SELECT p.id, la.id as la_id, f.id as f_id, ep.id as ep_id, NULL as evr_id
            FROM people p
            JOIN leadership_assignments la ON la.person_id = p.id AND la.status = 'ACTIVE'
            JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
            JOIN fellowships f ON f.id = fp.fellowship_id
            JOIN election_positions ep ON ep.fellowship_position_id = fp.id AND ep.election_id = :electionId
            WHERE :electionId IS NOT NULL
            UNION
            SELECT p.id, NULL as la_id, NULL as f_id, NULL as ep_id, evr.id as evr_id
            FROM people p
            JOIN election_voter_roll evr ON evr.person_id = p.id AND evr.election_id = :electionId AND evr.eligible = true
        ) eligible_voters
        LEFT JOIN people p ON p.id = eligible_voters.id
        LEFT JOIN leadership_assignments la ON la.id = eligible_voters.la_id
        LEFT JOIN fellowship_positions fp ON fp.id = la.fellowship_position_id
        LEFT JOIN fellowships f ON f.id = fp.fellowship_id
        LEFT JOIN election_positions ep ON ep.id = eligible_voters.ep_id
        LEFT JOIN (
            SELECT vr.person_id
            FROM vote_records vr
            WHERE vr.election_id = :electionId
              AND (:votingPeriodId IS NULL OR vr.voting_period_id = :votingPeriodId)
            GROUP BY vr.person_id
        ) vr_vote ON vr_vote.person_id = p.id
        WHERE (:fellowshipId IS NULL OR f.id = :fellowshipId)
              AND (:electionPositionId IS NULL OR ep.id = :electionPositionId)
              AND (:status = 'ALL'
                   OR (:status = 'VOTED' AND vr_vote.person_id IS NOT NULL)
                   OR (:status = 'NOT_VOTED' AND vr_vote.person_id IS NULL))
              AND (:q IS NULL OR LOWER(p.full_name) LIKE CONCAT('%', LOWER(:q), '%')
                   OR LOWER(p.phone_number) LIKE CONCAT('%', LOWER(:q), '%')
                   OR LOWER(p.email) LIKE CONCAT('%', LOWER(:q), '%'))
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
