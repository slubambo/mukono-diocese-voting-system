package com.mukono.voting.api.election.controller;

import com.mukono.voting.api.election.dto.*;
import com.mukono.voting.repository.election.CandidateVoteCount;
import com.mukono.voting.repository.election.PositionVoteCount;
import com.mukono.voting.service.election.ElectionResultsService;
import com.mukono.voting.service.election.WinnerResult;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for election results (read-only).
 * 
 * Endpoints:
 * - GET /api/v1/elections/{electionId}/results/positions/{positionId}/tally
 * - GET /api/v1/elections/{electionId}/results/positions/{positionId}/winner
 * - GET /api/v1/elections/{electionId}/results/turnout
 * - GET /api/v1/elections/{electionId}/results/positions/{positionId}/turnout-percentage
 * - GET /api/v1/elections/{electionId}/results/unique-voters
 */
@RestController
@RequestMapping("/api/v1/elections/{electionId}/results")
@Validated
public class ElectionResultsController {

    private final ElectionResultsService resultsService;

    @Autowired
    public ElectionResultsController(ElectionResultsService resultsService) {
        this.resultsService = resultsService;
    }

    /**
     * Get tally for a position (vote counts by candidate).
     * 
     * GET /api/v1/elections/{electionId}/results/positions/{positionId}/tally
     */
    @GetMapping("/positions/{positionId}/tally")
    public ResponseEntity<PositionTallyResponse> tallyPosition(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Position ID is required") Long positionId) {
        
        List<CandidateVoteCount> tally = resultsService.tallyPosition(electionId, positionId);
        
        List<CandidateTallyItem> items = tally.stream()
                .map(cvs -> new CandidateTallyItem(cvs.getCandidateId(), cvs.getVotes()))
                .collect(Collectors.toList());
        
        long totalVotes = tally.stream()
                .mapToLong(CandidateVoteCount::getVotes)
                .sum();
        
        PositionTallyResponse response = new PositionTallyResponse(electionId, positionId, items, totalVotes);
        return ResponseEntity.ok(response);
    }

    /**
     * Get winner for a position (handles ties).
     * 
     * GET /api/v1/elections/{electionId}/results/positions/{positionId}/winner
     */
    @GetMapping("/positions/{positionId}/winner")
    public ResponseEntity<WinnerResponse> getWinner(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Position ID is required") Long positionId) {
        
        WinnerResult result = resultsService.getWinner(electionId, positionId);
        
        WinnerResponse response = new WinnerResponse(
                result.isTie(),
                result.getWinnerCandidateId(),
                result.getTopCandidateIds(),
                result.getTopVotes()
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get turnout by position (votes per position).
     * 
     * GET /api/v1/elections/{electionId}/results/turnout
     */
    @GetMapping("/turnout")
    public ResponseEntity<ElectionTurnoutResponse> turnoutByPosition(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId) {
        
        List<PositionVoteCount> turnout = resultsService.turnoutByPosition(electionId);
        
        List<TurnoutByPositionItem> items = turnout.stream()
                .map(pvc -> new TurnoutByPositionItem(pvc.getElectionPositionId(), pvc.getVotes()))
                .collect(Collectors.toList());
        
        ElectionTurnoutResponse response = new ElectionTurnoutResponse(electionId, items);
        return ResponseEntity.ok(response);
    }

    /**
     * Get turnout percentage for a position.
     * 
     * GET /api/v1/elections/{electionId}/results/positions/{positionId}/turnout-percentage
     */
    @GetMapping("/positions/{positionId}/turnout-percentage")
    public ResponseEntity<TurnoutPercentageResponse> getTurnoutPercentage(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Position ID is required") Long positionId) {
        
        double percentage = resultsService.getTurnoutPercentage(electionId, positionId);
        
        TurnoutPercentageResponse response = new TurnoutPercentageResponse(electionId, positionId, percentage);
        return ResponseEntity.ok(response);
    }

    /**
     * Get unique voter count for an election.
     * 
     * GET /api/v1/elections/{electionId}/results/unique-voters
     */
    @GetMapping("/unique-voters")
    public ResponseEntity<UniqueVotersResponse> uniqueVoters(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId) {
        
        long uniqueVoterCount = resultsService.uniqueVoters(electionId);
        
        UniqueVotersResponse response = new UniqueVotersResponse(electionId, uniqueVoterCount);
        return ResponseEntity.ok(response);
    }
}
