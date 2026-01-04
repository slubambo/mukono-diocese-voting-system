package com.mukono.voting.api.election.controller;

import com.mukono.voting.model.election.ElectionVote;
import com.mukono.voting.payload.request.voting.*;
import com.mukono.voting.payload.response.voting.*;
import com.mukono.voting.service.election.ElectionVotingService;
import com.mukono.voting.service.election.EligibilityDecision;
import com.mukono.voting.service.election.ElectionVoterEligibilityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST Controller for voting operations.
 * 
 * Endpoints:
 * - GET /api/v1/elections/{electionId}/eligibility/me - Check voter eligibility
 * - POST /api/v1/elections/{electionId}/positions/{positionId}/votes - Cast vote
 * - PUT /api/v1/elections/{electionId}/positions/{positionId}/votes - Recast vote
 * - DELETE /api/v1/elections/{electionId}/positions/{positionId}/votes - Revoke vote
 * - GET /api/v1/elections/{electionId}/positions/{positionId}/votes/me - Get my vote
 */
@RestController
@RequestMapping("/api/v1/elections/{electionId}")
@Validated
public class ElectionVotingController {

    private final ElectionVoterEligibilityService eligibilityService;
    private final ElectionVotingService votingService;

    @Autowired
    public ElectionVotingController(ElectionVoterEligibilityService eligibilityService,
                                    ElectionVotingService votingService) {
        this.eligibilityService = eligibilityService;
        this.votingService = votingService;
    }

    /**
     * Check voter eligibility for an election and voting period.
     * 
     * GET /api/v1/elections/{electionId}/voting-periods/{votingPeriodId}/eligibility/me?voterPersonId=123
     */
    @GetMapping("/voting-periods/{votingPeriodId}/eligibility/me")
    public ResponseEntity<EligibilityDecisionResponse> checkEligibility(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @RequestParam @NotNull(message = "Voter Person ID is required") Long voterPersonId) {
        
        EligibilityDecision decision = eligibilityService.checkEligibility(electionId, votingPeriodId, voterPersonId);
        EligibilityDecisionResponse response = new EligibilityDecisionResponse(
                decision.isEligible(),
                decision.getRule(),
                decision.getReason()
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Cast a vote for a position in a voting period.
     * 
     * POST /api/v1/elections/{electionId}/voting-periods/{votingPeriodId}/positions/{positionId}/votes
     * Body: {candidateId, voterId, source}
     */
    @PostMapping("/voting-periods/{votingPeriodId}/positions/{positionId}/votes")
    public ResponseEntity<VoteResponse> castVote(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @PathVariable @NotNull(message = "Position ID is required") Long positionId,
            @Valid @RequestBody CastVoteRequest request) {
        
        ElectionVote vote = votingService.castVote(
                electionId,
                votingPeriodId,
                positionId,
                request.getCandidateId(),
                request.getVoterId(),
                request.getSource()
        );
        
        VoteResponse response = mapVoteToResponse(vote);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Recast a vote (change vote) in a voting period.
     * 
     * PUT /api/v1/elections/{electionId}/voting-periods/{votingPeriodId}/positions/{positionId}/votes
     * Body: {candidateId, voterId, source}
     */
    @PutMapping("/voting-periods/{votingPeriodId}/positions/{positionId}/votes")
    public ResponseEntity<VoteResponse> recastVote(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @PathVariable @NotNull(message = "Position ID is required") Long positionId,
            @Valid @RequestBody RecastVoteRequest request) {
        
        ElectionVote vote = votingService.recastVote(
                electionId,
                votingPeriodId,
                positionId,
                request.getCandidateId(),
                request.getVoterId(),
                request.getSource()
        );
        
        VoteResponse response = mapVoteToResponse(vote);
        return ResponseEntity.ok(response);
    }

    /**
     * Revoke a vote.
     * 
     * DELETE /api/v1/elections/{electionId}/positions/{positionId}/votes?voterId=123
     */
    @DeleteMapping("/positions/{positionId}/votes")
    public ResponseEntity<VoteResponse> revokeVote(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Position ID is required") Long positionId,
            @RequestParam @NotNull(message = "Voter ID is required") Long voterId) {
        
        ElectionVote vote = votingService.revokeVote(
                electionId,
                positionId,
                voterId,
                null,
                "Voter revoke"
        );
        
        VoteResponse response = mapVoteToResponse(vote);
        return ResponseEntity.ok(response);
    }

    /**
     * Get my vote (voter's vote for a position).
     * 
     * GET /api/v1/elections/{electionId}/positions/{positionId}/votes/me?voterId=123
     */
    @GetMapping("/positions/{positionId}/votes/me")
    public ResponseEntity<?> getMyVote(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Position ID is required") Long positionId,
            @RequestParam @NotNull(message = "Voter ID is required") Long voterId) {
        
        Optional<ElectionVote> voteOpt = votingService.getMyVote(electionId, positionId, voterId);
        
        if (voteOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        VoteResponse response = mapVoteToResponse(voteOpt.get());
        return ResponseEntity.ok(response);
    }

    /**
     * Map ElectionVote entity to VoteResponse DTO (no entity leakage).
     */
    private VoteResponse mapVoteToResponse(ElectionVote vote) {
        return new VoteResponse(
                vote.getId(),
                vote.getElection().getId(),
                vote.getElectionPosition().getId(),
                vote.getCandidate().getId(),
                vote.getVoter().getId(),
                vote.getStatus().toString(),
                vote.getCastAt(),
                vote.getSource()
        );
    }
}
