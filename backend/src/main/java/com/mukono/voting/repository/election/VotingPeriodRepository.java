package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.VotingPeriod;
import com.mukono.voting.model.election.VotingPeriodStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for VotingPeriod entity.
 * Provides methods for managing voting periods (rounds) within elections.
 */
@Repository
public interface VotingPeriodRepository extends JpaRepository<VotingPeriod, Long> {

    /**
     * Find all voting periods for an election.
     * 
     * @param electionId the election ID
     * @return list of voting periods
     */
    List<VotingPeriod> findByElectionId(Long electionId);

    /**
     * Find all voting periods for an election (paginated).
     * 
     * @param electionId the election ID
     * @param pageable pagination information
     * @return page of voting periods
     */
    Page<VotingPeriod> findByElectionId(Long electionId, Pageable pageable);

    /**
     * Find all voting periods for an election with status filter.
     * 
     * @param electionId the election ID
     * @param status the voting period status
     * @return list of voting periods
     */
    List<VotingPeriod> findByElectionIdAndStatus(Long electionId, VotingPeriodStatus status);

    /**
     * Find voting period by election ID and voting period ID.
     * 
     * @param electionId the election ID
     * @param id the voting period ID
     * @return Optional containing the voting period if found
     */
    Optional<VotingPeriod> findByElectionIdAndId(Long electionId, Long id);

    /**
     * Find all voting periods for an election with status filter (paginated).
     * 
     * @param electionId the election ID
     * @param status the voting period status
     * @param pageable pagination information
     * @return page of voting periods
     */
    Page<VotingPeriod> findByElectionIdAndStatus(Long electionId, VotingPeriodStatus status, Pageable pageable);

    /**
     * Count voting periods for an election.
     * 
     * @param electionId the election ID
     * @return count of voting periods
     */
    long countByElectionId(Long electionId);

    /**
     * Count voting periods for an election with a specific status.
     * 
     * @param electionId the election ID
     * @param status the voting period status
     * @return count of voting periods with the specified status
     */
    long countByElectionIdAndStatus(Long electionId, VotingPeriodStatus status);
}
