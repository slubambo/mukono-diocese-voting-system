package com.mukono.voting.api.admin.service;

import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.ElectionCandidate;
import com.mukono.voting.model.election.ElectionPosition;
import com.mukono.voting.model.election.VotingPeriod;
import com.mukono.voting.model.election.VotingPeriodStatus;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.model.leadership.LeadershipAssignment;
import com.mukono.voting.payload.response.tally.CertifiedLeadershipAssignmentResponse;
import com.mukono.voting.payload.response.tally.CertifyResultsResponse;
import com.mukono.voting.repository.election.ElectionCandidateRepository;
import com.mukono.voting.repository.election.ElectionPositionRepository;
import com.mukono.voting.repository.election.ElectionRepository;
import com.mukono.voting.repository.election.VoteRecordRepository;
import com.mukono.voting.repository.election.VotingPeriodPositionRepository;
import com.mukono.voting.repository.election.VotingPeriodRepository;
import com.mukono.voting.service.election.VoteTallyService;
import com.mukono.voting.service.leadership.LeadershipAssignmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for certifying winners and creating leadership assignments.
 */
@Service
public class ElectionResultsCertificationService {

    private final ElectionRepository electionRepository;
    private final VotingPeriodRepository votingPeriodRepository;
    private final VotingPeriodPositionRepository votingPeriodPositionRepository;
    private final ElectionPositionRepository positionRepository;
    private final ElectionCandidateRepository candidateRepository;
    private final VoteRecordRepository voteRecordRepository;
    private final VoteTallyService voteTallyService;
    private final LeadershipAssignmentService leadershipAssignmentService;

    public ElectionResultsCertificationService(
            ElectionRepository electionRepository,
            VotingPeriodRepository votingPeriodRepository,
            VotingPeriodPositionRepository votingPeriodPositionRepository,
            ElectionPositionRepository positionRepository,
            ElectionCandidateRepository candidateRepository,
            VoteRecordRepository voteRecordRepository,
            VoteTallyService voteTallyService,
            LeadershipAssignmentService leadershipAssignmentService) {
        this.electionRepository = electionRepository;
        this.votingPeriodRepository = votingPeriodRepository;
        this.votingPeriodPositionRepository = votingPeriodPositionRepository;
        this.positionRepository = positionRepository;
        this.candidateRepository = candidateRepository;
        this.voteRecordRepository = voteRecordRepository;
        this.voteTallyService = voteTallyService;
        this.leadershipAssignmentService = leadershipAssignmentService;
    }

    /**
     * Certify results for a voting period and create leadership assignments for winners.
     */
    @Transactional
    public CertifyResultsResponse certifyResults(Long electionId, Long votingPeriodId, String remarks) {
        Election election = validateElectionAndPeriod(electionId, votingPeriodId);
        VotingPeriod period = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid votingPeriodId"));

        if (period.getStatus() != VotingPeriodStatus.CLOSED) {
            throw new IllegalArgumentException("Voting period must be CLOSED to certify results");
        }

        long totalBallotsCast = voteRecordRepository.countByElectionIdAndVotingPeriodId(electionId, votingPeriodId);
        if (totalBallotsCast == 0) {
            throw new IllegalArgumentException("Cannot certify results with zero ballots cast");
        }

        List<Long> positionIds = votingPeriodPositionRepository
                .findElectionPositionIdsByVotingPeriod(electionId, votingPeriodId);
        List<ElectionPosition> positions = positionIds.isEmpty()
                ? Collections.emptyList()
                : positionRepository.findByIdInOrderByIdAsc(positionIds);

        List<LeadershipAssignment> createdAssignments = new ArrayList<>();
        for (ElectionPosition position : positions) {
            List<ElectionCandidate> candidates = candidateRepository.findByPositionIdOrderByIdAsc(position.getId());
            if (candidates.isEmpty()) {
                continue;
            }

            Map<Long, Long> voteCounts = voteTallyService.countVotesByCandidate(
                    electionId, votingPeriodId, position.getId());

            List<CandidateWithVotes> candidatesWithVotes = new ArrayList<>();
            for (ElectionCandidate candidate : candidates) {
                Long voteCount = voteCounts.getOrDefault(candidate.getId(), 0L);
                candidatesWithVotes.add(new CandidateWithVotes(candidate, voteCount));
            }

            candidatesWithVotes.sort(Comparator
                    .comparing(CandidateWithVotes::getVoteCount).reversed()
                    .thenComparing(c -> c.getCandidate().getId()));

            Integer seats = position.getFellowshipPosition().getSeats();
            if (seats == null || seats < 1) {
                seats = 1;
            }

            TargetIds targets = resolveTargetIds(election, position.getFellowshipPosition().getScope());
            for (int i = 0; i < Math.min(seats, candidatesWithVotes.size()); i++) {
                ElectionCandidate winner = candidatesWithVotes.get(i).getCandidate();
                LeadershipAssignment assignment = leadershipAssignmentService.create(
                        winner.getPerson().getId(),
                        position.getFellowshipPosition().getId(),
                        targets.dioceseId,
                        targets.archdeaconryId,
                        targets.churchId,
                        election.getTermStartDate(),
                        election.getTermEndDate(),
                        remarks);
                createdAssignments.add(assignment);
            }
        }

        CertifyResultsResponse response = new CertifyResultsResponse();
        response.setMessage("Results certified");
        response.setCertifiedAt(Instant.now());
        response.setAssignments(createdAssignments.stream()
                .map(CertifiedLeadershipAssignmentResponse::fromEntity)
                .collect(Collectors.toList()));
        return response;
    }

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

    private TargetIds resolveTargetIds(Election election, PositionScope scope) {
        Long dioceseId = null;
        Long archdeaconryId = null;
        Long churchId = null;
        switch (scope) {
            case DIOCESE:
                if (election.getDiocese() == null) {
                    throw new IllegalArgumentException("Election diocese is required for DIOCESE scope");
                }
                dioceseId = election.getDiocese().getId();
                break;
            case ARCHDEACONRY:
                if (election.getArchdeaconry() == null) {
                    throw new IllegalArgumentException("Election archdeaconry is required for ARCHDEACONRY scope");
                }
                archdeaconryId = election.getArchdeaconry().getId();
                break;
            case CHURCH:
                if (election.getChurch() == null) {
                    throw new IllegalArgumentException("Election church is required for CHURCH scope");
                }
                churchId = election.getChurch().getId();
                break;
            default:
                break;
        }
        return new TargetIds(dioceseId, archdeaconryId, churchId);
    }

    private static class CandidateWithVotes {
        private final ElectionCandidate candidate;
        private final Long voteCount;

        CandidateWithVotes(ElectionCandidate candidate, Long voteCount) {
            this.candidate = candidate;
            this.voteCount = voteCount;
        }

        public ElectionCandidate getCandidate() {
            return candidate;
        }

        public Long getVoteCount() {
            return voteCount;
        }
    }

    private static class TargetIds {
        private final Long dioceseId;
        private final Long archdeaconryId;
        private final Long churchId;

        TargetIds(Long dioceseId, Long archdeaconryId, Long churchId) {
            this.dioceseId = dioceseId;
            this.archdeaconryId = archdeaconryId;
            this.churchId = churchId;
        }
    }
}
