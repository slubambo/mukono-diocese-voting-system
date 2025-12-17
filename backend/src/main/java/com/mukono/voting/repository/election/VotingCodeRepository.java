package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.VotingCode;
import com.mukono.voting.model.election.VotingCodeStatus;
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
}
