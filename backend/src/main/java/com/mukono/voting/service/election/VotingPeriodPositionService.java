package com.mukono.voting.service.election;

import com.mukono.voting.model.election.ElectionPosition;
import com.mukono.voting.model.election.VotingPeriod;
import com.mukono.voting.model.election.VotingPeriodPosition;
import com.mukono.voting.model.election.VotingPeriodStatus;
import com.mukono.voting.repository.election.ElectionPositionRepository;
import com.mukono.voting.repository.election.VotingPeriodPositionRepository;
import com.mukono.voting.repository.election.VotingPeriodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing VotingPeriodPosition mappings.
 * Handles assignment of election positions to voting periods (days).
 */
@Service
@Transactional
public class VotingPeriodPositionService {

    private final VotingPeriodPositionRepository votingPeriodPositionRepository;
    private final VotingPeriodRepository votingPeriodRepository;
    private final ElectionPositionRepository electionPositionRepository;

    public VotingPeriodPositionService(
            VotingPeriodPositionRepository votingPeriodPositionRepository,
            VotingPeriodRepository votingPeriodRepository,
            ElectionPositionRepository electionPositionRepository) {
        this.votingPeriodPositionRepository = votingPeriodPositionRepository;
        this.votingPeriodRepository = votingPeriodRepository;
        this.electionPositionRepository = electionPositionRepository;
    }

    /**
     * Assign positions to a voting period (replaces existing assignments).
     * 
     * @param electionId election ID
     * @param votingPeriodId voting period ID
     * @param electionPositionIds list of election position IDs to assign
     * @throws IllegalArgumentException if validation fails
     */
    public void assignPositions(Long electionId, Long votingPeriodId, List<Long> electionPositionIds) {
        // Validate voting period exists and belongs to election
        VotingPeriod votingPeriod = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Voting period with ID " + votingPeriodId + " not found"));

        if (!votingPeriod.getElection().getId().equals(electionId)) {
            throw new IllegalArgumentException(
                    "Voting period does not belong to election " + electionId);
        }

        // Only allow modifications when period is SCHEDULED
        if (votingPeriod.getStatus() != VotingPeriodStatus.SCHEDULED) {
            throw new IllegalArgumentException(
                    "Cannot modify position assignments for a voting period that is " + 
                    votingPeriod.getStatus() + ". Only SCHEDULED periods can be modified.");
        }

        // Validate all election positions exist and belong to the election
        if (electionPositionIds == null || electionPositionIds.isEmpty()) {
            throw new IllegalArgumentException("At least one election position must be assigned");
        }

        List<ElectionPosition> electionPositions = electionPositionRepository.findAllById(electionPositionIds);
        if (electionPositions.size() != electionPositionIds.size()) {
            throw new IllegalArgumentException("One or more election position IDs are invalid");
        }

        // Validate all positions belong to the election
        for (ElectionPosition electionPosition : electionPositions) {
            if (!electionPosition.getElection().getId().equals(electionId)) {
                throw new IllegalArgumentException(
                        "Election position " + electionPosition.getId() + 
                        " does not belong to election " + electionId);
            }
        }

        // Delete existing assignments for this period (replace pattern)
        votingPeriodPositionRepository.deleteByVotingPeriodId(votingPeriodId);

        // Create new assignments
        for (ElectionPosition electionPosition : electionPositions) {
            VotingPeriodPosition mapping = new VotingPeriodPosition(
                    electionId,
                    votingPeriod,
                    electionPosition
            );
            votingPeriodPositionRepository.save(mapping);
        }
    }

    /**
     * Get election position IDs assigned to a voting period.
     * 
     * @param electionId election ID
     * @param votingPeriodId voting period ID
     * @return list of election position IDs
     */
    @Transactional(readOnly = true)
    public List<Long> getAssignedPositionIds(Long electionId, Long votingPeriodId) {
        return votingPeriodPositionRepository.findElectionPositionIdsByVotingPeriod(
                electionId, votingPeriodId);
    }

    /**
     * Get all voting period position mappings for a voting period.
     * 
     * @param electionId election ID
     * @param votingPeriodId voting period ID
     * @return list of VotingPeriodPosition entities
     */
    @Transactional(readOnly = true)
    public List<VotingPeriodPosition> getAssignedPositions(Long electionId, Long votingPeriodId) {
        return votingPeriodPositionRepository.findByElectionIdAndVotingPeriodId(
                electionId, votingPeriodId);
    }

    /**
     * Count positions assigned to a voting period.
     * 
     * @param votingPeriodId voting period ID
     * @return count of assigned positions
     */
    @Transactional(readOnly = true)
    public long countAssignedPositions(Long votingPeriodId) {
        return votingPeriodPositionRepository.countByVotingPeriodId(votingPeriodId);
    }
}
