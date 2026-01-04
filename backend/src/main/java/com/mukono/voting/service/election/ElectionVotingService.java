package com.mukono.voting.service.election;

import com.mukono.voting.model.election.*;
import com.mukono.voting.repository.election.*;
import com.mukono.voting.repository.people.PersonRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * ElectionVotingService manages vote casting, revocation, and recasting with eligibility enforcement.
 * 
 * Enforces:
 * - Election status validation (VOTING_OPEN)
 * - One vote per voter per position (unique constraint + repository checks)
 * - Voter eligibility (via ElectionVoterEligibilityService)
 * - Vote status transitions (CAST -> REVOKED, or REVOKED -> CAST)
 * 
 * Voting Rules (R1-R7):
 * R1: Election exists + VOTING_OPEN status
 * R2: Position belongs to election
 * R3: Candidate belongs to election + position
 * R4: Voter eligibility enforced
 * R5: One cast vote per position (prevents duplicates)
 * R6: Revoke does NOT delete (sets status to REVOKED)
 * R7: Recast logic (strict: must revoke first, OR soft: auto-revoke and recast)
 */
@Service
@Transactional
public class ElectionVotingService {

    private final ElectionRepository electionRepository;
    private final ElectionPositionRepository electionPositionRepository;
    private final ElectionCandidateRepository electionCandidateRepository;
    private final ElectionVoteRepository electionVoteRepository;
    private final PersonRepository personRepository;
    private final ElectionVoterEligibilityService eligibilityService;

    @Autowired
    public ElectionVotingService(
            ElectionRepository electionRepository,
            ElectionPositionRepository electionPositionRepository,
            ElectionCandidateRepository electionCandidateRepository,
            ElectionVoteRepository electionVoteRepository,
            PersonRepository personRepository,
            ElectionVoterEligibilityService eligibilityService) {
        this.electionRepository = electionRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.electionCandidateRepository = electionCandidateRepository;
        this.electionVoteRepository = electionVoteRepository;
        this.personRepository = personRepository;
        this.eligibilityService = eligibilityService;
    }

    /**
     * Cast a vote for a candidate in an election position during a voting period.
     * 
     * Applies rules R1-R6: validates election, position, candidate, voting-period-specific eligibility, and prevents duplicates.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param electionPositionId the election position ID
     * @param candidateId the candidate ID
     * @param voterId the voter's person ID
     * @param source vote source (e.g., "WEB", "MOBILE", "USSD")
     * @return the created ElectionVote
     * @throws IllegalArgumentException if any rule is violated
     */
    public ElectionVote castVote(Long electionId, Long votingPeriodId, Long electionPositionId, Long candidateId,
                                 Long voterId, String source) {
        // R1: Election exists + status is VOTING_OPEN
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found"));
        
        if (election.getStatus() != ElectionStatus.VOTING_OPEN) {
            throw new IllegalArgumentException("Voting is not open for this election");
        }

        // ...existing code...

        // R2: Position belongs to election
        ElectionPosition position = electionPositionRepository.findById(electionPositionId)
                .orElseThrow(() -> new IllegalArgumentException("Election position not found"));
        
        if (!position.getElection().getId().equals(electionId)) {
            throw new IllegalArgumentException("Election position does not belong to this election");
        }

        // ...existing code...

        // R3: Candidate belongs to election + position
        ElectionCandidate candidate = electionCandidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found"));
        
        if (!candidate.getElection().getId().equals(electionId)) {
            throw new IllegalArgumentException("Candidate does not belong to this election");
        }
        
        if (!candidate.getElectionPosition().getId().equals(electionPositionId)) {
            throw new IllegalArgumentException("Candidate does not belong to this position");
        }

        // R4: Voter eligibility for this voting period
        if (!eligibilityService.isEligible(electionId, votingPeriodId, voterId)) {
            throw new IllegalArgumentException("You are not eligible to vote in this election voting period");
        }

        // ...existing code...

        // R5: One cast vote per position
        if (electionVoteRepository.hasCastVote(electionId, electionPositionId, voterId)) {
            throw new IllegalArgumentException("You have already voted for this position");
        }

        // ...existing code...

        // Create and persist vote
        ElectionVote vote = new ElectionVote(election, position, candidate,
                personRepository.findById(voterId)
                        .orElseThrow(() -> new IllegalArgumentException("Voter not found")));
        vote.setStatus(VoteStatus.CAST);
        vote.setCastAt(Instant.now());
        vote.setSource(source);

        return electionVoteRepository.save(vote);
    }

    /**
     * Revoke a vote (R6: does NOT delete, sets status to REVOKED).
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param voterId the voter's person ID
     * @param revokedBy username/email of operator (optional)
     * @param reason reason for revocation (optional)
     * @return the updated ElectionVote
     * @throws IllegalArgumentException if vote not found or already revoked
     */
    public ElectionVote revokeVote(Long electionId, Long electionPositionId, Long voterId,
                                   String revokedBy, String reason) {
        Optional<ElectionVote> voteOpt = electionVoteRepository
                .findByElectionIdAndElectionPositionIdAndVoterId(electionId, electionPositionId, voterId);

        ElectionVote vote = voteOpt.orElseThrow(() ->
                new IllegalArgumentException("Vote not found for this election, position, and voter"));

        if (vote.getStatus() == VoteStatus.REVOKED) {
            throw new IllegalArgumentException("Vote is already revoked");
        }

        vote.setStatus(VoteStatus.REVOKED);
        // Note: castAt remains unchanged for audit trail
        // Could add fields for revokedBy and reason if needed later

        return electionVoteRepository.save(vote);
    }

    /**
     * Recast a vote (soft recast: automatically revokes existing CAST vote, then casts new one) during a voting period.
     * 
     * This implements Option B logic: if a CAST vote exists, it's automatically revoked,
     * and then a new vote is cast for the new candidate.
     * This is equivalent to calling revokeVote then castVote atomically.
     * 
     * Rule R7: Recast logic (soft implementation)
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param electionPositionId the election position ID
     * @param candidateId the new candidate ID
     * @param voterId the voter's person ID
     * @param source vote source
     * @return the new ElectionVote
     * @throws IllegalArgumentException if any rule is violated
     */
    public ElectionVote recastVote(Long electionId, Long votingPeriodId, Long electionPositionId, Long candidateId,
                                   Long voterId, String source) {
        // Check if a CAST vote exists
        Optional<ElectionVote> existingVote = electionVoteRepository
                .findByElectionIdAndElectionPositionIdAndVoterId(electionId, electionPositionId, voterId);

        if (existingVote.isPresent() && existingVote.get().getStatus() == VoteStatus.CAST) {
            // Auto-revoke the existing vote
            revokeVote(electionId, electionPositionId, voterId, null, "Auto-revoked for recast");
        }

        // Cast the new vote (this will perform all R1-R6 validations including voting-period-specific eligibility)
        return castVote(electionId, votingPeriodId, electionPositionId, candidateId, voterId, source);
    }

    /**
     * Get a voter's vote for a position in an election.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param voterId the voter's person ID
     * @return Optional containing the vote if found
     */
    @Transactional(readOnly = true)
    public Optional<ElectionVote> getMyVote(Long electionId, Long electionPositionId, Long voterId) {
        return electionVoteRepository
                .findByElectionIdAndElectionPositionIdAndVoterId(electionId, electionPositionId, voterId);
    }

    /**
     * List all votes in an election (paginated).
     * 
     * @param electionId the election ID
     * @param pageable pagination info
     * @return page of votes
     */
    @Transactional(readOnly = true)
    public Page<ElectionVote> listVotes(Long electionId, Pageable pageable) {
        return electionVoteRepository.findByElectionId(electionId, pageable);
    }

    /**
     * List all votes for a position in an election (paginated).
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param pageable pagination info
     * @return page of votes for position
     */
    @Transactional(readOnly = true)
    public Page<ElectionVote> listVotesForPosition(Long electionId, Long electionPositionId, Pageable pageable) {
        return electionVoteRepository.findByElectionIdAndElectionPositionId(electionId, electionPositionId, pageable);
    }

    /**
     * Check if a voter has cast a vote for a position in an election.
     * 
     * Only counts CAST votes (ignores REVOKED).
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param voterId the voter's person ID
     * @return true if CAST vote exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean hasVoted(Long electionId, Long electionPositionId, Long voterId) {
        return electionVoteRepository.hasCastVote(electionId, electionPositionId, voterId);
    }

    /**
     * Count CAST votes for a position in an election.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @return count of CAST votes
     */
    @Transactional(readOnly = true)
    public long countVotesForPosition(Long electionId, Long electionPositionId) {
        return electionVoteRepository.countByElectionIdAndElectionPositionIdAndStatus(
                electionId, electionPositionId, VoteStatus.CAST);
    }

    /**
     * Count unique voters who have cast votes in an election.
     * 
     * @param electionId the election ID
     * @return count of distinct voters with CAST votes
     */
    @Transactional(readOnly = true)
    public long countUniqueVoters(Long electionId) {
        return electionVoteRepository.countDistinctVoters(electionId);
    }
}
