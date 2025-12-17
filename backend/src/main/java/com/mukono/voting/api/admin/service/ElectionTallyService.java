package com.mukono.voting.api.admin.service;

import com.mukono.voting.api.admin.dto.*;
import com.mukono.voting.model.election.*;
import com.mukono.voting.repository.election.*;
import com.mukono.voting.service.election.VoteTallyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for election tally operations (winner computation and certification).
 * 
 * Handles:
 * - Computing winners using deterministic tie-breaking
 * - Persisting certified results
 * - Applying winners to ElectionWinnerAssignment
 * - Idempotency via ElectionTallyRun unique constraint
 * - Rollback capability
 */
@Service
public class ElectionTallyService {

    private final ElectionRepository electionRepository;
    private final VotingPeriodRepository votingPeriodRepository;
    private final ElectionPositionRepository positionRepository;
    private final ElectionCandidateRepository candidateRepository;
    private final VoteTallyService voteTallyService;
    private final ElectionTallyRunRepository tallyRunRepository;
    private final CertifiedPositionResultRepository certifiedPositionResultRepository;
    private final CertifiedCandidateResultRepository certifiedCandidateResultRepository;
    private final ElectionWinnerAssignmentRepository winnerAssignmentRepository;

    public ElectionTallyService(
            ElectionRepository electionRepository,
            VotingPeriodRepository votingPeriodRepository,
            ElectionPositionRepository positionRepository,
            ElectionCandidateRepository candidateRepository,
            VoteTallyService voteTallyService,
            ElectionTallyRunRepository tallyRunRepository,
            CertifiedPositionResultRepository certifiedPositionResultRepository,
            CertifiedCandidateResultRepository certifiedCandidateResultRepository,
            ElectionWinnerAssignmentRepository winnerAssignmentRepository) {
        this.electionRepository = electionRepository;
        this.votingPeriodRepository = votingPeriodRepository;
        this.positionRepository = positionRepository;
        this.candidateRepository = candidateRepository;
        this.voteTallyService = voteTallyService;
        this.tallyRunRepository = tallyRunRepository;
        this.certifiedPositionResultRepository = certifiedPositionResultRepository;
        this.certifiedCandidateResultRepository = certifiedCandidateResultRepository;
        this.winnerAssignmentRepository = winnerAssignmentRepository;
    }

    /**
     * Run tally: compute winners, certify results, apply to winner assignments.
     * Idempotent: if already completed, returns existing results.
     */
    @Transactional
    public RunTallyResponse runTally(Long electionId, Long votingPeriodId, Long adminPersonId, RunTallyRequest request) {
        // Validate election and period
        Election election = validateElectionAndPeriod(electionId, votingPeriodId);
        VotingPeriod period = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid votingPeriodId"));

        // Check if period is CLOSED (unless force=true)
        boolean force = request.getForce() != null && request.getForce();
        if (period.getStatus() != VotingPeriodStatus.CLOSED && !force) {
            throw new IllegalArgumentException("Voting period must be CLOSED to tally results");
        }

        // Check for existing tally (with lock to prevent concurrent runs)
        Optional<ElectionTallyRun> existingTallyOpt = tallyRunRepository
                .findByElectionIdAndVotingPeriodIdWithLock(electionId, votingPeriodId);

        if (existingTallyOpt.isPresent()) {
            ElectionTallyRun existingTally = existingTallyOpt.get();
            if (existingTally.getStatus() == TallyStatus.COMPLETED) {
                // Idempotent: return existing results
                return buildRunTallyResponse(existingTally, "Tally already completed (idempotent)");
            } else if (existingTally.getStatus() == TallyStatus.PENDING) {
                throw new IllegalArgumentException("Tally is already in progress");
            } else if (existingTally.getStatus() == TallyStatus.ROLLED_BACK) {
                // Allow re-run after rollback
                tallyRunRepository.delete(existingTally);
            }
        }

        // Create new tally run
        ElectionTallyRun tallyRun = new ElectionTallyRun();
        tallyRun.setElection(election);
        tallyRun.setVotingPeriod(period);
        tallyRun.setStatus(TallyStatus.PENDING);
        tallyRun.setStartedAt(Instant.now());
        tallyRun.setStartedByPersonId(adminPersonId);
        tallyRun.setRemarks(request.getRemarks());
        tallyRun = tallyRunRepository.save(tallyRun);

        try {
            // Load all positions
            List<ElectionPosition> positions = positionRepository.findByElectionIdOrderByIdAsc(electionId);

            int totalPositionsTallied = 0;
            int totalWinnersApplied = 0;
            int tiesDetectedCount = 0;

            // Process each position
            for (ElectionPosition position : positions) {
                // Get vote counts
                Map<Long, Long> voteCounts = voteTallyService.countVotesByCandidate(
                        electionId, votingPeriodId, position.getId());

                // Get turnout stats
                long turnout = voteTallyService.countTurnoutForPosition(electionId, votingPeriodId, position.getId());
                long totalBallots = voteCounts.values().stream().mapToLong(Long::longValue).sum();

                // Create certified position result
                CertifiedPositionResult certifiedPositionResult = new CertifiedPositionResult();
                certifiedPositionResult.setElection(election);
                certifiedPositionResult.setVotingPeriod(period);
                certifiedPositionResult.setPosition(position);
                certifiedPositionResult.setTotalBallotsForPosition(totalBallots);
                certifiedPositionResult.setTurnoutForPosition(turnout);
                certifiedPositionResult.setComputedAt(Instant.now());
                certifiedPositionResult.setComputedByPersonId(adminPersonId);
                certifiedPositionResult.setStatus("CERTIFIED");
                certifiedPositionResult = certifiedPositionResultRepository.save(certifiedPositionResult);

                // Load candidates and compute winners
                List<ElectionCandidate> candidates = candidateRepository.findByPositionIdOrderByIdAsc(position.getId());
                
                // Build candidate results with vote counts
                List<CandidateWithVotes> candidatesWithVotes = new ArrayList<>();
                for (ElectionCandidate candidate : candidates) {
                    Long voteCount = voteCounts.getOrDefault(candidate.getId(), 0L);
                    candidatesWithVotes.add(new CandidateWithVotes(candidate, voteCount));
                }

                // Sort by voteCount DESC, then candidateId ASC (deterministic tie-breaking)
                candidatesWithVotes.sort(Comparator
                        .comparing(CandidateWithVotes::getVoteCount).reversed()
                        .thenComparing(c -> c.getCandidate().getId()));

                // Determine winners (top N by seats)
                Integer seats = position.getFellowshipPosition().getSeats();
                if (seats == null || seats < 1) {
                    seats = 1;
                }

                Set<Long> winnerIds = new HashSet<>();
                for (int i = 0; i < Math.min(seats, candidatesWithVotes.size()); i++) {
                    winnerIds.add(candidatesWithVotes.get(i).getCandidate().getId());
                }

                // Detect ties (candidates at position `seats` have same voteCount as position `seats-1`)
                boolean tieDetected = false;
                if (candidatesWithVotes.size() > seats) {
                    long winnerCutoffVotes = candidatesWithVotes.get(seats - 1).getVoteCount();
                    long nextCandidateVotes = candidatesWithVotes.get(seats).getVoteCount();
                    if (winnerCutoffVotes == nextCandidateVotes && winnerCutoffVotes > 0) {
                        tieDetected = true;
                        tiesDetectedCount++;
                    }
                }

                if (tieDetected) {
                    certifiedPositionResult.setNotes("Tie detected at cutoff; resolved by candidateId ASC");
                    certifiedPositionResultRepository.save(certifiedPositionResult);
                }

                // Persist certified candidate results
                int rank = 1;
                for (CandidateWithVotes cwv : candidatesWithVotes) {
                    CertifiedCandidateResult ccr = new CertifiedCandidateResult();
                    ccr.setCertifiedPositionResult(certifiedPositionResult);
                    ccr.setCandidate(cwv.getCandidate());
                    ccr.setVoteCount(cwv.getVoteCount());
                    if (totalBallots > 0) {
                        ccr.setVoteSharePercent((cwv.getVoteCount() * 100.0) / totalBallots);
                    }
                    ccr.setRank(rank++);
                    ccr.setIsWinner(winnerIds.contains(cwv.getCandidate().getId()));
                    certifiedCandidateResultRepository.save(ccr);
                }

                // Apply winners to ElectionWinnerAssignment
                for (CandidateWithVotes cwv : candidatesWithVotes) {
                    if (winnerIds.contains(cwv.getCandidate().getId())) {
                        ElectionWinnerAssignment assignment = new ElectionWinnerAssignment();
                        assignment.setElection(election);
                        assignment.setVotingPeriod(period);
                        assignment.setPosition(position);
                        assignment.setCandidate(cwv.getCandidate());
                        assignment.setPersonId(cwv.getCandidate().getPerson().getId());
                        assignment.setVoteCount(cwv.getVoteCount());
                        assignment.setRank(candidatesWithVotes.indexOf(cwv) + 1);
                        assignment.setTallyRun(tallyRun);
                        assignment.setCreatedByPersonId(adminPersonId);
                        winnerAssignmentRepository.save(assignment);
                        totalWinnersApplied++;
                    }
                }

                totalPositionsTallied++;
            }

            // Mark tally as completed
            tallyRun.setStatus(TallyStatus.COMPLETED);
            tallyRun.setCompletedAt(Instant.now());
            tallyRun.setCompletedByPersonId(adminPersonId);
            tallyRunRepository.save(tallyRun);

            RunTallyResponse response = new RunTallyResponse();
            response.setTallyRunId(tallyRun.getId());
            response.setStatus("COMPLETED");
            response.setElectionId(electionId);
            response.setVotingPeriodId(votingPeriodId);
            response.setTotalPositionsTallied(totalPositionsTallied);
            response.setTotalWinnersApplied(totalWinnersApplied);
            response.setTiesDetectedCount(tiesDetectedCount);
            response.setServerTime(Instant.now());
            response.setMessage("Tally completed successfully");
            return response;

        } catch (Exception e) {
            // Mark tally as failed
            tallyRun.setStatus(TallyStatus.FAILED);
            tallyRun.setCompletedAt(Instant.now());
            tallyRun.setRemarks("Failed: " + e.getMessage());
            tallyRunRepository.save(tallyRun);
            throw new RuntimeException("Tally failed: " + e.getMessage(), e);
        }
    }

    /**
     * Get tally status.
     */
    @Transactional(readOnly = true)
    public TallyStatusResponse getStatus(Long electionId, Long votingPeriodId) {
        validateElectionAndPeriod(electionId, votingPeriodId);

        Optional<ElectionTallyRun> tallyOpt = tallyRunRepository.findByElectionIdAndVotingPeriodId(electionId, votingPeriodId);

        TallyStatusResponse response = new TallyStatusResponse();
        if (tallyOpt.isEmpty()) {
            response.setTallyExists(false);
            return response;
        }

        ElectionTallyRun tally = tallyOpt.get();
        response.setTallyExists(true);
        response.setTallyRunId(tally.getId());
        response.setStatus(tally.getStatus().name());
        response.setElectionId(electionId);
        response.setVotingPeriodId(votingPeriodId);
        response.setStartedAt(tally.getStartedAt());
        response.setCompletedAt(tally.getCompletedAt());
        response.setStartedByPersonId(tally.getStartedByPersonId());
        response.setCompletedByPersonId(tally.getCompletedByPersonId());
        response.setRemarks(tally.getRemarks());

        if (tally.getStatus() == TallyStatus.COMPLETED) {
            long certifiedCount = certifiedPositionResultRepository.countByElectionIdAndVotingPeriodId(electionId, votingPeriodId);
            long winnersCount = winnerAssignmentRepository.countByElectionIdAndVotingPeriodId(electionId, votingPeriodId);
            response.setTotalPositionsCertified((int) certifiedCount);
            response.setTotalWinnersApplied((int) winnersCount);
        }

        return response;
    }

    /**
     * Rollback tally (admin emergency).
     */
    @Transactional
    public RollbackTallyResponse rollback(Long electionId, Long votingPeriodId, Long adminPersonId, String reason) {
        validateElectionAndPeriod(electionId, votingPeriodId);

        ElectionTallyRun tally = tallyRunRepository.findByElectionIdAndVotingPeriodIdWithLock(electionId, votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("No tally found for this election and voting period"));

        if (tally.getStatus() != TallyStatus.COMPLETED) {
            throw new IllegalArgumentException("Can only rollback COMPLETED tallies");
        }

        // Delete winner assignments
        List<ElectionWinnerAssignment> assignments = winnerAssignmentRepository.findByTallyRunId(tally.getId());
        int winnersRemoved = assignments.size();
        winnerAssignmentRepository.deleteByTallyRunId(tally.getId());

        // Mark tally as rolled back
        tally.setStatus(TallyStatus.ROLLED_BACK);
        tally.setRemarks("Rolled back by admin: " + reason);
        tally.setCompletedAt(Instant.now());
        tally.setCompletedByPersonId(adminPersonId);
        tallyRunRepository.save(tally);

        RollbackTallyResponse response = new RollbackTallyResponse();
        response.setTallyRunId(tally.getId());
        response.setStatus("ROLLED_BACK");
        response.setWinnersRemoved(winnersRemoved);
        response.setRolledBackAt(Instant.now());
        response.setMessage("Tally rolled back successfully");
        return response;
    }

    // Helper methods

    private Election validateElectionAndPeriod(Long electionId, Long votingPeriodId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid electionId"));
        VotingPeriod period = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid votingPeriodId"));
        if (!period.getElection().getId().equals(election.getId())) {
            throw new IllegalArgumentException("VotingPeriod does not belong to election");
        }
        return election;
    }

    private RunTallyResponse buildRunTallyResponse(ElectionTallyRun tally, String message) {
        long certifiedCount = certifiedPositionResultRepository.countByElectionIdAndVotingPeriodId(
                tally.getElection().getId(), tally.getVotingPeriod().getId());
        long winnersCount = winnerAssignmentRepository.countByElectionIdAndVotingPeriodId(
                tally.getElection().getId(), tally.getVotingPeriod().getId());

        // Count ties from notes
        List<CertifiedPositionResult> certifiedResults = certifiedPositionResultRepository
                .findByElectionIdAndVotingPeriodId(tally.getElection().getId(), tally.getVotingPeriod().getId());
        int tiesCount = (int) certifiedResults.stream()
                .filter(r -> r.getNotes() != null && r.getNotes().contains("Tie detected"))
                .count();

        RunTallyResponse response = new RunTallyResponse();
        response.setTallyRunId(tally.getId());
        response.setStatus(tally.getStatus().name());
        response.setElectionId(tally.getElection().getId());
        response.setVotingPeriodId(tally.getVotingPeriod().getId());
        response.setTotalPositionsTallied((int) certifiedCount);
        response.setTotalWinnersApplied((int) winnersCount);
        response.setTiesDetectedCount(tiesCount);
        response.setServerTime(Instant.now());
        response.setMessage(message);
        return response;
    }

    /**
     * Helper class to hold candidate with vote count during winner computation.
     */
    private static class CandidateWithVotes {
        private final ElectionCandidate candidate;
        private final Long voteCount;

        public CandidateWithVotes(ElectionCandidate candidate, Long voteCount) {
            this.candidate = candidate;
            this.voteCount = voteCount;
        }

        public ElectionCandidate getCandidate() { return candidate; }
        public Long getVoteCount() { return voteCount; }
    }
}
