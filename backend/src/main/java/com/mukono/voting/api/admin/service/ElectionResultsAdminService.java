package com.mukono.voting.api.admin.service;

import com.mukono.voting.payload.response.tally.*;
import com.mukono.voting.model.election.*;
import com.mukono.voting.repository.election.*;
import com.mukono.voting.service.election.EligibleVoterService;
import com.mukono.voting.service.election.VoteTallyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for election results and reporting (read-only).
 * Orchestrates validation, data loading, and DTO mapping.
 */
@Service
@Transactional(readOnly = true)
public class ElectionResultsAdminService {

    private final ElectionRepository electionRepository;
    private final VotingPeriodRepository votingPeriodRepository;
    private final ElectionPositionRepository positionRepository;
    private final ElectionCandidateRepository candidateRepository;
    private final VoteRecordRepository voteRecordRepository;
    private final VoteSelectionRepository voteSelectionRepository;
    private final EligibleVoterService eligibleVoterService;
    private final VoteTallyService voteTallyService;

    public ElectionResultsAdminService(
            ElectionRepository electionRepository,
            VotingPeriodRepository votingPeriodRepository,
            ElectionPositionRepository positionRepository,
            ElectionCandidateRepository candidateRepository,
            VoteRecordRepository voteRecordRepository,
            VoteSelectionRepository voteSelectionRepository,
            EligibleVoterService eligibleVoterService,
            VoteTallyService voteTallyService) {
        this.electionRepository = electionRepository;
        this.votingPeriodRepository = votingPeriodRepository;
        this.positionRepository = positionRepository;
        this.candidateRepository = candidateRepository;
        this.voteRecordRepository = voteRecordRepository;
        this.voteSelectionRepository = voteSelectionRepository;
        this.eligibleVoterService = eligibleVoterService;
        this.voteTallyService = voteTallyService;
    }

    /**
     * Get election summary for a voting period.
     */
    public ElectionResultsSummaryResponse getSummary(Long electionId, Long votingPeriodId) {
        Election election = validateElectionAndPeriod(electionId, votingPeriodId);
        VotingPeriod period = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid votingPeriodId"));

        long totalPositions = positionRepository.countByElectionId(electionId);
        long totalBallots = voteRecordRepository.countByElectionIdAndVotingPeriodId(electionId, votingPeriodId);
        long totalSelections = voteSelectionRepository.countByElectionIdAndVotingPeriodId(electionId, votingPeriodId);
        long totalDistinctVoters = voteTallyService.countElectionTurnout(electionId, votingPeriodId);
        long totalEligibleVoters = eligibleVoterService
                .countEligibleVoters(electionId, votingPeriodId, null, null, null)
                .getCount();

        Instant startTime = period.getStartTime().atZone(java.time.ZoneId.systemDefault()).toInstant();
        Instant endTime = period.getEndTime().atZone(java.time.ZoneId.systemDefault()).toInstant();

        ElectionResultsSummaryResponse response = new ElectionResultsSummaryResponse();
        response.setElectionId(electionId);
        response.setVotingPeriodId(votingPeriodId);
        response.setVotingPeriodName(period.getName());
        response.setPeriodStatus(period.getStatus().name());
        response.setPeriodStartTime(startTime);
        response.setPeriodEndTime(endTime);
        response.setTotalPositions(Math.toIntExact(totalPositions));
        response.setTotalBallotsCast(totalBallots);
        response.setTotalSelectionsCast(totalSelections);
        response.setTotalDistinctVoters(totalDistinctVoters);
        response.setTotalEligibleVoters(totalEligibleVoters);
        response.setServerTime(Instant.now());
        return response;
    }

    /**
     * Get results for all positions in an election.
     */
    public List<PositionResultsResponse> getAllPositionResults(Long electionId, Long votingPeriodId) {
        validateElectionAndPeriod(electionId, votingPeriodId);

        long totalBallotsForPeriod = voteRecordRepository.countByElectionIdAndVotingPeriodId(electionId, votingPeriodId);
        List<ElectionPosition> positions = positionRepository.findByElectionIdOrderByIdAsc(electionId);
        List<PositionResultsResponse> results = new ArrayList<>();

        for (ElectionPosition position : positions) {
            results.add(buildPositionResults(electionId, votingPeriodId, position, totalBallotsForPeriod));
        }

        return results;
    }

    /**
     * Get results for a single position.
     */
    public PositionResultsResponse getPositionResults(Long electionId, Long votingPeriodId, Long positionId) {
        validateElectionAndPeriod(electionId, votingPeriodId);

        ElectionPosition position = positionRepository.findById(positionId)
                .filter(p -> p.getElection().getId().equals(electionId))
                .orElseThrow(() -> new IllegalArgumentException("Position not found or does not belong to election"));

        long totalBallotsForPeriod = voteRecordRepository.countByElectionIdAndVotingPeriodId(electionId, votingPeriodId);
        return buildPositionResults(electionId, votingPeriodId, position, totalBallotsForPeriod);
    }

    /**
     * Export flat results suitable for CSV.
     */
    public List<FlatResultRowResponse> exportResults(Long electionId, Long votingPeriodId) {
        validateElectionAndPeriod(electionId, votingPeriodId);

        List<ElectionPosition> positions = positionRepository.findByElectionIdOrderByIdAsc(electionId);
        List<FlatResultRowResponse> rows = new ArrayList<>();

        for (ElectionPosition position : positions) {
            long turnout = voteTallyService.countTurnoutForPosition(electionId, votingPeriodId, position.getId());
            long totalBallots = voteRecordRepository.countByElectionIdAndVotingPeriodIdAndPositionId(
                    electionId, votingPeriodId, position.getId());

            Map<Long, Long> voteCounts = voteTallyService.countVotesByCandidate(
                    electionId, votingPeriodId, position.getId());

            List<ElectionCandidate> candidates = candidateRepository.findByPositionIdOrderByIdAsc(position.getId());
            for (ElectionCandidate candidate : candidates) {
                Long voteCount = voteCounts.getOrDefault(candidate.getId(), 0L);

                FlatResultRowResponse row = new FlatResultRowResponse();
                row.setElectionId(electionId);
                row.setVotingPeriodId(votingPeriodId);
                row.setPositionId(position.getId());
                row.setPositionName(position.getFellowshipPosition().getTitle().getName());
                row.setCandidateId(candidate.getId());
                row.setPersonId(candidate.getPerson().getId());
                row.setFullName(candidate.getPerson().getFullName());
                row.setVoteCount(voteCount);
                row.setTurnoutForPosition(turnout);
                row.setTotalBallotsForPosition(totalBallots);

                rows.add(row);
            }
        }

        return rows;
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

    private PositionResultsResponse buildPositionResults(Long electionId, Long votingPeriodId, ElectionPosition position, long totalBallotsForPeriod) {
        long turnout = voteTallyService.countTurnoutForPosition(electionId, votingPeriodId, position.getId());
        long totalBallots = voteRecordRepository.countByElectionIdAndVotingPeriodIdAndPositionId(
                electionId, votingPeriodId, position.getId());

        Map<Long, Long> voteCounts = voteTallyService.countVotesByCandidate(
                electionId, votingPeriodId, position.getId());

        long totalVotes = voteCounts.values().stream().mapToLong(Long::longValue).sum();

        List<ElectionCandidate> candidates = candidateRepository.findByPositionIdOrderByIdAsc(position.getId());
        List<CandidateResultsResponse> candidateResponses = new ArrayList<>();
        
        for (ElectionCandidate cand : candidates) {
            Long voteCount = voteCounts.getOrDefault(cand.getId(), 0L);
            Double voteSharePercent = totalVotes > 0 ? (voteCount * 100.0) / totalVotes : null;
            
            CandidateResultsResponse resp = new CandidateResultsResponse();
            resp.setCandidateId(cand.getId());
            resp.setPersonId(cand.getPerson().getId());
            resp.setFullName(cand.getPerson().getFullName());
            resp.setVoteCount(voteCount);
            resp.setVoteSharePercent(voteSharePercent);
            candidateResponses.add(resp);
        }
        
        // Sort by voteCount DESC, then fullName ASC
        candidateResponses.sort(Comparator.comparing(CandidateResultsResponse::getVoteCount).reversed()
                .thenComparing(CandidateResultsResponse::getFullName));

        PositionResultsResponse posResponse = new PositionResultsResponse();
        posResponse.setPositionId(position.getId());
        posResponse.setPositionName(position.getFellowshipPosition().getTitle().getName());
        posResponse.setScope(position.getFellowshipPosition().getScope().name());
        posResponse.setSeats(position.getFellowshipPosition().getSeats() != null ? position.getFellowshipPosition().getSeats() : 1);
        posResponse.setMaxVotesPerVoter(1);
        posResponse.setTurnoutForPosition(turnout);
        posResponse.setTotalBallotsForPosition(totalBallots);
        posResponse.setPositionVoteShareOfTotal(totalBallotsForPeriod > 0 ? (totalBallots * 100.0) / totalBallotsForPeriod : null);
        posResponse.setCandidates(candidateResponses);

        return posResponse;
    }
}
