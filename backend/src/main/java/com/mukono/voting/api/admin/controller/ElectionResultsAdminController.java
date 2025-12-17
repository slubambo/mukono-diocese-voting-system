package com.mukono.voting.api.admin.controller;

import com.mukono.voting.api.admin.dto.*;
import com.mukono.voting.api.admin.service.ElectionResultsAdminService;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only REST API for election results and reporting (read-only).
 * 
 * Base path: /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results
 * 
 * All endpoints require ADMIN role and return production-grade results
 * aggregated from the authoritative vote store (G1).
 */
@RestController
@RequestMapping("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class ElectionResultsAdminController {

    private final ElectionResultsAdminService resultsService;

    public ElectionResultsAdminController(ElectionResultsAdminService resultsService) {
        this.resultsService = resultsService;
    }

    /**
     * GET /summary
     * 
     * Returns election summary with totals: positions, ballots, selections, turnout, and period info.
     */
    @GetMapping("/summary")
    public ResponseEntity<ElectionResultsSummaryResponse> getSummary(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId) {
        
        ElectionResultsSummaryResponse response = resultsService.getSummary(electionId, votingPeriodId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /positions
     * 
     * Returns results for all positions in the election.
     * Positions sorted by ID ASC; candidates sorted by voteCount DESC, then fullName ASC.
     */
    @GetMapping("/positions")
    public ResponseEntity<List<PositionResultsResponse>> getAllPositions(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId) {
        
        List<PositionResultsResponse> responses = resultsService.getAllPositionResults(electionId, votingPeriodId);
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /positions/{positionId}
     * 
     * Returns results for a single position.
     * Validates position belongs to election.
     */
    @GetMapping("/positions/{positionId}")
    public ResponseEntity<PositionResultsResponse> getPositionResults(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @PathVariable @NotNull(message = "Position ID is required") Long positionId) {
        
        PositionResultsResponse response = resultsService.getPositionResults(electionId, votingPeriodId, positionId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /export
     * 
     * Returns flat list of results suitable for CSV export in UI.
     * Each row contains election, period, position, and candidate details with vote counts.
     */
    @GetMapping("/export")
    public ResponseEntity<List<FlatResultRowResponse>> exportResults(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId) {
        
        List<FlatResultRowResponse> responses = resultsService.exportResults(electionId, votingPeriodId);
        return ResponseEntity.ok(responses);
    }
}
