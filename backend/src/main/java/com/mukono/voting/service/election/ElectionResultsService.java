package com.mukono.voting.service.election;

import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.ElectionStatus;
import com.mukono.voting.model.election.VoteStatus;
import com.mukono.voting.repository.election.CandidateVoteCount;
import com.mukono.voting.repository.election.ElectionCandidateRepository;
import com.mukono.voting.repository.election.ElectionPositionRepository;
import com.mukono.voting.repository.election.ElectionRepository;
import com.mukono.voting.repository.election.ElectionVoteRepository;
import com.mukono.voting.repository.election.PositionVoteCount;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ElectionResultsService computes election results, including vote tallies, turnout, and winner determination.
 * 
 * All result computations count CAST votes only (REVOKED votes are excluded).
 * 
 * Results can be computed at any time (live results), or only after election status changes to VOTING_CLOSED
 * (for final results). Currently allows computation at any time but marks results as "live" or "final" based on
 * calling code logic.
 */
@Service
@Transactional(readOnly = true)
public class ElectionResultsService {

    private final ElectionRepository electionRepository;
    private final ElectionPositionRepository electionPositionRepository;
    private final ElectionVoteRepository electionVoteRepository;
    private final ElectionCandidateRepository electionCandidateRepository;

    @Autowired
    public ElectionResultsService(
            ElectionRepository electionRepository,
            ElectionPositionRepository electionPositionRepository,
            ElectionVoteRepository electionVoteRepository,
            ElectionCandidateRepository electionCandidateRepository) {
        this.electionRepository = electionRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.electionVoteRepository = electionVoteRepository;
        this.electionCandidateRepository = electionCandidateRepository;
    }

    /**
     * Tally votes by candidate for a position in an election.
     * 
     * Returns a list of candidates with their vote counts, ordered by votes DESC.
     * Only counts CAST votes (excludes REVOKED).
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @return list of CandidateVoteCount (ordered by votes DESC)
     */
    public List<CandidateVoteCount> tallyPosition(Long electionId, Long electionPositionId) {
        // Validate election exists
        electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));
        
        // Validate position exists and belongs to election
        electionPositionRepository.findById(electionPositionId)
                .filter(pos -> pos.getElection().getId().equals(electionId))
                .orElseThrow(() -> new IllegalArgumentException("Election position not found or does not belong to election"));

        return electionVoteRepository.tallyByCandidate(electionId, electionPositionId);
    }

    /**
     * Calculate turnout by position in an election.
     * 
     * Returns a list of positions with their vote counts, ordered by votes DESC.
     * Only counts CAST votes (excludes REVOKED).
     * 
     * @param electionId the election ID
     * @return list of PositionVoteCount (ordered by votes DESC)
     */
    public List<PositionVoteCount> turnoutByPosition(Long electionId) {
        // Validate election exists
        electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));

        return electionVoteRepository.turnoutByPosition(electionId);
    }

    /**
     * Count unique voters who have cast votes in an election.
     * 
     * @param electionId the election ID
     * @return count of distinct voters
     */
    public long uniqueVoters(Long electionId) {
        // Validate election exists
        electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));

        return electionVoteRepository.countDistinctVoters(electionId);
    }

    /**
     * Count votes for a specific candidate in a position.
     * 
     * Only counts CAST votes.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @param candidateId the candidate ID
     * @return count of CAST votes for this candidate
     */
    public long votesForCandidate(Long electionId, Long electionPositionId, Long candidateId) {
        return electionVoteRepository.countByElectionIdAndElectionPositionIdAndCandidateIdAndStatus(
                electionId, electionPositionId, candidateId, VoteStatus.CAST);
    }

    /**
     * Count total votes for a position in an election.
     * 
     * Only counts CAST votes.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @return total count of CAST votes
     */
    public long totalVotesForPosition(Long electionId, Long electionPositionId) {
        return electionVoteRepository.countByElectionIdAndElectionPositionIdAndStatus(
                electionId, electionPositionId, VoteStatus.CAST);
    }

    /**
     * Determine the winner (or tie) for a position in an election.
     * 
     * Only counts CAST votes. If there's a tie at the top, returns tie info.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @return WinnerResult with winner or tie information
     * @throws IllegalArgumentException if election or position not found, or no votes cast
     */
    public WinnerResult getWinner(Long electionId, Long electionPositionId) {
        // Validate election exists
        electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));
        
        // Validate position exists and belongs to election
        electionPositionRepository.findById(electionPositionId)
                .filter(pos -> pos.getElection().getId().equals(electionId))
                .orElseThrow(() -> new IllegalArgumentException("Election position not found or does not belong to election"));

        // Get tally of votes by candidate
        List<CandidateVoteCount> tally = tallyPosition(electionId, electionPositionId);

        if (tally.isEmpty()) {
            throw new IllegalArgumentException("No votes have been cast for this position");
        }

        // Get top vote count
        long topVotes = tally.get(0).getVotes();

        // Find all candidates with top vote count (for tie detection)
        List<Long> topCandidates = tally.stream()
                .filter(cvs -> cvs.getVotes() == topVotes)
                .map(CandidateVoteCount::getCandidateId)
                .collect(Collectors.toList());

        // If multiple candidates at top, it's a tie
        if (topCandidates.size() > 1) {
            return WinnerResult.ofTie(topCandidates, topVotes);
        }

        // Single winner
        return WinnerResult.ofWinner(topCandidates.get(0), topVotes);
    }

    /**
     * Get detailed vote breakdown for a position (for reporting/display).
     * 
     * Returns a map of candidateId -> vote count, ordered by votes DESC.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @return map of candidate ID to vote count
     */
    public Map<Long, Long> getVoteBreakdown(Long electionId, Long electionPositionId) {
        return tallyPosition(electionId, electionPositionId).stream()
                .collect(Collectors.toMap(
                        CandidateVoteCount::getCandidateId,
                        CandidateVoteCount::getVotes,
                        (e1, e2) -> e1  // In case of duplicates, keep first
                ));
    }

    /**
     * Get turnout percentage for a position.
     * 
     * Returns: (votes for position / unique voters in election) * 100
     * This indicates what percentage of voters participated in this position.
     * 
     * @param electionId the election ID
     * @param electionPositionId the election position ID
     * @return turnout percentage (0-100), or 0 if no voters
     */
    public double getTurnoutPercentage(Long electionId, Long electionPositionId) {
        long uniqueVoterCount = uniqueVoters(electionId);
        if (uniqueVoterCount == 0) {
            return 0.0;
        }

        long positionVotes = totalVotesForPosition(electionId, electionPositionId);
        return (positionVotes * 100.0) / uniqueVoterCount;
    }

    /**
     * Check if election allows result computation.
     * 
     * Current logic: allows at any time (live results), but calling code
     * should respect election status (typically VOTING_CLOSED for final results).
     * 
     * @param electionId the election ID
     * @return true if results can be computed (currently always true)
     */
    public boolean canComputeResults(Long electionId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));

        // Allow results to be computed at any time (live results)
        // Calling code should enforce VOTING_CLOSED status for final results
        return true;
    }
}
