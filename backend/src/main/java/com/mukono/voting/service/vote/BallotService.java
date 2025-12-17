package com.mukono.voting.service.vote;

import com.mukono.voting.model.election.*;
import com.mukono.voting.model.leadership.LeadershipAssignment;
import com.mukono.voting.model.people.Person;
import com.mukono.voting.payload.response.BallotCandidateResponse;
import com.mukono.voting.payload.response.BallotPositionResponse;
import com.mukono.voting.payload.response.BallotResponse;
import com.mukono.voting.repository.election.ElectionCandidateRepository;
import com.mukono.voting.repository.election.ElectionPositionRepository;
import com.mukono.voting.repository.election.VotingPeriodRepository;
import com.mukono.voting.repository.leadership.LeadershipAssignmentRepository;
import com.mukono.voting.service.election.ElectionVoterEligibilityService;
import com.mukono.voting.service.election.EligibilityDecision;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for ballot generation and retrieval.
 * Provides voters with their personalized ballot based on eligibility rules.
 */
@Service
@Transactional(readOnly = true)
public class BallotService {

    private final VotingPeriodRepository votingPeriodRepository;
    private final ElectionPositionRepository electionPositionRepository;
    private final ElectionCandidateRepository electionCandidateRepository;
    private final ElectionVoterEligibilityService eligibilityService;
    private final LeadershipAssignmentRepository leadershipAssignmentRepository;

    public BallotService(VotingPeriodRepository votingPeriodRepository,
                        ElectionPositionRepository electionPositionRepository,
                        ElectionCandidateRepository electionCandidateRepository,
                        ElectionVoterEligibilityService eligibilityService,
                        LeadershipAssignmentRepository leadershipAssignmentRepository) {
        this.votingPeriodRepository = votingPeriodRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.electionCandidateRepository = electionCandidateRepository;
        this.eligibilityService = eligibilityService;
        this.leadershipAssignmentRepository = leadershipAssignmentRepository;
    }

    /**
     * Get the ballot for a voter.
     * 
     * @param personId the voter's person ID
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return ballot response with positions and candidates
     */
    public BallotResponse getBallot(Long personId, Long electionId, Long votingPeriodId) {
        // 1. Load and validate voting period
        VotingPeriod votingPeriod = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Voting period not found"));

        if (!votingPeriod.getElection().getId().equals(electionId)) {
            throw new IllegalArgumentException("Voting period does not belong to the specified election");
        }

        // 2. Validate period is OPEN
        if (votingPeriod.getStatus() != VotingPeriodStatus.OPEN) {
            throw new IllegalArgumentException("Voting is not OPEN for this period. Status: " + votingPeriod.getStatus());
        }

        // 3. Validate within time window
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(votingPeriod.getStartTime()) || !now.isBefore(votingPeriod.getEndTime())) {
            throw new IllegalArgumentException("Voting is not within the period time window");
        }

        // 4. Validate voter eligibility
        EligibilityDecision eligibility = eligibilityService.checkEligibility(electionId, personId);
        if (!eligibility.isEligible()) {
            throw new IllegalArgumentException("Voter not eligible for this election: " + eligibility.getReason());
        }

        Election election = votingPeriod.getElection();

        // 5. Load positions for election (sorted by ID for determinism)
        List<ElectionPosition> positions = electionPositionRepository.findByElectionId(electionId);
        positions.sort((p1, p2) -> p1.getId().compareTo(p2.getId()));

        // 6. Load all candidates for election efficiently (already sorted by fullName)
        List<ElectionCandidate> allCandidates = electionCandidateRepository.findAllCandidatesForElectionWithDetails(electionId);

        // 7. Group candidates by position
        Map<Long, List<ElectionCandidate>> candidatesByPosition = allCandidates.stream()
                .collect(Collectors.groupingBy(c -> c.getElectionPosition().getId()));

        // 8. Get candidate origin info (archdeaconry/church from leadership assignments)
        Map<Long, LeadershipAssignment> candidateOrigins = getCandidateOrigins(allCandidates);

        // 9. Build ballot response
        BallotResponse ballot = new BallotResponse(electionId, votingPeriodId, personId, election.getName());

        List<BallotPositionResponse> positionResponses = new ArrayList<>();
        for (ElectionPosition position : positions) {
            BallotPositionResponse positionResponse = new BallotPositionResponse(
                    position.getId(),
                    position.getFellowshipPosition().getTitle().getName(),
                    position.getFellowshipPosition().getScope().name(),
                    position.getSeats(),
                    position.getSeats() // maxVotesPerVoter = seats (can vote for up to seats count)
            );

            // Add candidates for this position
            List<ElectionCandidate> positionCandidates = candidatesByPosition.getOrDefault(position.getId(), new ArrayList<>());
            for (ElectionCandidate candidate : positionCandidates) {
                LeadershipAssignment origin = candidateOrigins.get(candidate.getPerson().getId());
                
                BallotCandidateResponse candidateResponse = new BallotCandidateResponse(
                        candidate.getId(),
                        candidate.getPerson().getId(),
                        candidate.getPerson().getFullName(),
                        candidate.getPerson().getGender() != null ? candidate.getPerson().getGender().name() : null,
                        origin != null && origin.getArchdeaconry() != null ? origin.getArchdeaconry().getId() : null,
                        origin != null && origin.getArchdeaconry() != null ? origin.getArchdeaconry().getName() : null,
                        origin != null && origin.getChurch() != null ? origin.getChurch().getId() : null,
                        origin != null && origin.getChurch() != null ? origin.getChurch().getName() : null
                );
                
                positionResponse.getCandidates().add(candidateResponse);
            }

            positionResponses.add(positionResponse);
        }

        ballot.setPositions(positionResponses);
        return ballot;
    }

    /**
     * Get origin information (archdeaconry/church) for candidates from their leadership assignments.
     * Uses the most recent active assignment for each candidate.
     * 
     * @param candidates list of candidates
     * @return map of person ID to their leadership assignment
     */
    private Map<Long, LeadershipAssignment> getCandidateOrigins(List<ElectionCandidate> candidates) {
        if (candidates.isEmpty()) {
            return new HashMap<>();
        }

        // Extract unique person IDs
        List<Long> personIds = candidates.stream()
                .map(c -> c.getPerson().getId())
                .distinct()
                .collect(Collectors.toList());

        // Fetch active leadership assignments for these people
        // Note: This gets ALL active assignments; we'll pick the first one per person for simplicity
        Map<Long, LeadershipAssignment> origins = new HashMap<>();
        
        for (Long personId : personIds) {
            List<LeadershipAssignment> assignments = leadershipAssignmentRepository
                    .findByPersonIdAndStatus(personId, com.mukono.voting.model.common.RecordStatus.ACTIVE);
            
            if (!assignments.isEmpty()) {
                // Use the first active assignment (could be refined to pick most relevant)
                origins.put(personId, assignments.get(0));
            }
        }

        return origins;
    }
}
