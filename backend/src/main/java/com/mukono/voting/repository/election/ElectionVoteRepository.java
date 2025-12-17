package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.ElectionVote;
import com.mukono.voting.model.election.VoteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ElectionVote entity.
 * Provides methods to manage votes, check duplicates, tally results, and track turnout.
 */
@Repository
public interface ElectionVoteRepository extends JpaRepository<ElectionVote, Long> {

    // =========================================================================
    // A) CORE LOOKUPS
    // =========================================================================

    /**
     * Find a specific vote by election, position, and voter.
     * Used to retrieve a voter's vote for a position in an election.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param voterId the voter ID
     * @return Optional containing the vote if found
     */
    Optional<ElectionVote> findByElectionIdAndElectionPositionIdAndVoterId(
            Long electionId, Long electionPositionId, Long voterId);

    /**
     * Find all votes in an election (paginated).
     * 
     * @param electionId the election ID
     * @param pageable pagination information
     * @return page of votes in the election
     */
    Page<ElectionVote> findByElectionId(Long electionId, Pageable pageable);

    /**
     * Find all votes for a position in an election (paginated).
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param pageable pagination information
     * @return page of votes for the position
     */
    Page<ElectionVote> findByElectionIdAndElectionPositionId(
            Long electionId, Long electionPositionId, Pageable pageable);

    /**
     * Find all votes cast by a voter in an election (paginated).
     * 
     * @param electionId the election ID
     * @param voterId the voter ID
     * @param pageable pagination information
     * @return page of votes cast by the voter
     */
    Page<ElectionVote> findByElectionIdAndVoterId(Long electionId, Long voterId, Pageable pageable);

    // =========================================================================
    // B) DUPLICATE PREVENTION
    // =========================================================================

    /**
     * Check if a vote already exists for a voter for a position in an election.
     * Prevents duplicate votes for the same position.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param voterId the voter ID
     * @return true if a vote exists, false otherwise
     */
    boolean existsByElectionIdAndElectionPositionIdAndVoterId(
            Long electionId, Long electionPositionId, Long voterId);

    // =========================================================================
    // C) VOTE COUNTS (status-aware)
    // =========================================================================

    /**
     * Count votes for a candidate for a position with a specific status.
     * Used in result tallying (only CAST votes count).
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param candidateId the candidate ID
     * @param status the vote status
     * @return count of votes for the candidate
     */
    long countByElectionIdAndElectionPositionIdAndCandidateIdAndStatus(
            Long electionId, Long electionPositionId, Long candidateId, VoteStatus status);

    /**
     * Count total votes for a position with a specific status.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param status the vote status
     * @return count of votes for the position
     */
    long countByElectionIdAndElectionPositionIdAndStatus(
            Long electionId, Long electionPositionId, VoteStatus status);

    // =========================================================================
    // JPQL QUERIES
    // =========================================================================

    /**
     * Tally votes by candidate for a position in an election.
     * Returns candidates ordered by vote count (highest first).
     * Only counts CAST votes (ignores REVOKED).
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @return list of candidate vote counts
     */
    @Query("""
        SELECT v.candidate.id as candidateId, COUNT(v.id) as votes
        FROM ElectionVote v
        WHERE v.election.id = :electionId
          AND v.electionPosition.id = :electionPositionId
          AND v.status = com.mukono.voting.model.election.VoteStatus.CAST
        GROUP BY v.candidate.id
        ORDER BY COUNT(v.id) DESC
    """)
    List<CandidateVoteCount> tallyByCandidate(
            @Param("electionId") Long electionId,
            @Param("electionPositionId") Long electionPositionId);

    /**
     * Calculate turnout by position in an election.
     * Returns positions ordered by vote count (highest first).
     * Only counts CAST votes.
     * 
     * @param electionId the election ID
     * @return list of position vote counts
     */
    @Query("""
        SELECT v.electionPosition.id as electionPositionId, COUNT(v.id) as votes
        FROM ElectionVote v
        WHERE v.election.id = :electionId
          AND v.status = com.mukono.voting.model.election.VoteStatus.CAST
        GROUP BY v.electionPosition.id
        ORDER BY COUNT(v.id) DESC
    """)
    List<PositionVoteCount> turnoutByPosition(@Param("electionId") Long electionId);

    /**
     * Count distinct voters who have cast votes in an election.
     * Used for turnout calculations (unique voter count).
     * Only counts CAST votes.
     * 
     * @param electionId the election ID
     * @return count of distinct voters
     */
    @Query("""
        SELECT COUNT(DISTINCT v.voter.id)
        FROM ElectionVote v
        WHERE v.election.id = :electionId
          AND v.status = com.mukono.voting.model.election.VoteStatus.CAST
    """)
    long countDistinctVoters(@Param("electionId") Long electionId);

    /**
     * Check if a voter has cast a vote for a position in an election.
     * Returns true only if a CAST vote exists (ignores REVOKED).
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param voterId the voter ID
     * @return true if voter has cast a vote, false otherwise
     */
    @Query("""
        SELECT CASE WHEN COUNT(v.id) > 0 THEN true ELSE false END
        FROM ElectionVote v
        WHERE v.election.id = :electionId
          AND v.electionPosition.id = :electionPositionId
          AND v.voter.id = :voterId
          AND v.status = com.mukono.voting.model.election.VoteStatus.CAST
    """)
    boolean hasCastVote(
            @Param("electionId") Long electionId,
            @Param("electionPositionId") Long electionPositionId,
            @Param("voterId") Long voterId);
}
