package com.mukono.voting.service.election;

import com.mukono.voting.model.election.ElectionPosition;
import com.mukono.voting.model.election.VotingPeriod;
import com.mukono.voting.model.election.VotingPeriodPosition;
import com.mukono.voting.model.election.VotingPeriodStatus;
import com.mukono.voting.repository.election.ElectionPositionRepository;
import com.mukono.voting.repository.election.VotingPeriodPositionRepository;
import com.mukono.voting.repository.election.VotingPeriodRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

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
    private final com.mukono.voting.repository.election.VoteRecordRepository voteRecordRepository;
    private final EntityManager entityManager;

    public VotingPeriodPositionService(
            VotingPeriodPositionRepository votingPeriodPositionRepository,
            VotingPeriodRepository votingPeriodRepository,
            ElectionPositionRepository electionPositionRepository,
            com.mukono.voting.repository.election.VoteRecordRepository voteRecordRepository,
            EntityManager entityManager) {
        this.votingPeriodPositionRepository = votingPeriodPositionRepository;
        this.votingPeriodRepository = votingPeriodRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.voteRecordRepository = voteRecordRepository;
        this.entityManager = entityManager;
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

        // Only allow modifications when period is SCHEDULED or OPEN
        if (votingPeriod.getStatus() == VotingPeriodStatus.CLOSED ||
            votingPeriod.getStatus() == VotingPeriodStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Cannot modify position assignments for a voting period that is " + 
                    votingPeriod.getStatus() + ".");
        }

        // Validate and deduplicate input
        if (electionPositionIds == null || electionPositionIds.isEmpty()) {
            throw new IllegalArgumentException("At least one election position must be assigned");
        }

        // Remove duplicates from input list
        List<Long> uniquePositionIds = new ArrayList<>(
                new LinkedHashSet<>(electionPositionIds)  // LinkedHashSet preserves order while removing duplicates
        );

        if (uniquePositionIds.size() < electionPositionIds.size()) {
            int duplicateCount = electionPositionIds.size() - uniquePositionIds.size();
            throw new IllegalArgumentException(
                    "Request contains " + duplicateCount + " duplicate position ID(s). " +
                    "Each position can only be assigned once per voting period.");
        }

        // Validate all election positions exist and belong to the election
        List<ElectionPosition> electionPositions = electionPositionRepository.findAllById(uniquePositionIds);
        if (electionPositions.size() != uniquePositionIds.size()) {
            Set<Long> foundIds = electionPositions.stream()
                    .map(ElectionPosition::getId)
                    .collect(Collectors.toSet());
            List<Long> missingIds = uniquePositionIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toList());
            throw new IllegalArgumentException(
                    "The following election position IDs are invalid: " + missingIds);
        }

        // Validate all positions belong to the election
        for (ElectionPosition electionPosition : electionPositions) {
            if (!electionPosition.getElection().getId().equals(electionId)) {
                throw new IllegalArgumentException(
                        "Election position " + electionPosition.getId() + 
                        " does not belong to election " + electionId);
            }
        }

        // If period is OPEN, prevent removing positions that already have votes
        if (votingPeriod.getStatus() == VotingPeriodStatus.OPEN) {
            List<Long> currentPositionIds = votingPeriodPositionRepository.findElectionPositionIdsByVotingPeriod(
                    electionId, votingPeriodId);
            Set<Long> requested = new HashSet<>(uniquePositionIds);
            for (Long existingId : currentPositionIds) {
                if (!requested.contains(existingId)) {
                    long votes = voteRecordRepository.countByElectionIdAndVotingPeriodIdAndPositionId(
                            electionId, votingPeriodId, existingId);
                    if (votes > 0) {
                        throw new IllegalArgumentException(
                                "Cannot remove position " + existingId + " because votes have already been cast.");
                    }
                }
            }
        }

        // Delete existing assignments for this period (replace pattern)
        votingPeriodPositionRepository.deleteByVotingPeriodId(votingPeriodId);
        
        // Flush to ensure deletion is executed immediately before insertion
        // This prevents "Duplicate entry" errors when updating assignments
        entityManager.flush();

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

    /**
     * Count positions for multiple voting periods in bulk.
     */
    @Transactional(readOnly = true)
    public Map<Long, Long> countAssignedPositionsForPeriods(List<Long> votingPeriodIds) {
        if (votingPeriodIds == null || votingPeriodIds.isEmpty()) return Collections.emptyMap();
        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : votingPeriodPositionRepository.countByVotingPeriodIds(votingPeriodIds)) {
            Long periodId = (Long) row[0];
            Long cnt = (Long) row[1];
            result.put(periodId, cnt);
        }
        return result;
    }

    /**
     * Get mapping pairs (votingPeriodId -> electionPositionId) for an election.
     */
    @Transactional(readOnly = true)
    public List<long[]> getPeriodPositionPairs(Long electionId) {
        List<Object[]> rows = votingPeriodPositionRepository.findPairsByElectionId(electionId);
        List<long[]> pairs = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Long periodId = (Long) row[0];
            Long positionId = (Long) row[1];
            pairs.add(new long[] { periodId, positionId });
        }
        return pairs;
    }
}
