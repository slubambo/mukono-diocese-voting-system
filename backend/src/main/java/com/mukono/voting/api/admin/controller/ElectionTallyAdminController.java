package com.mukono.voting.api.admin.controller;

import com.mukono.voting.payload.request.tally.RunTallyRequest;
import com.mukono.voting.payload.response.tally.*;
import com.mukono.voting.api.admin.service.ElectionTallyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Admin-only REST API for election tally operations (winner computation and certification).
 * 
 * Base path: /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally
 * 
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class ElectionTallyAdminController {

    private final ElectionTallyService tallyService;

    public ElectionTallyAdminController(ElectionTallyService tallyService) {
        this.tallyService = tallyService;
    }

    /**
     * POST /run
     * 
     * Run tally: compute winners, certify results, apply to winner assignments.
     * Idempotent: if already completed, returns existing results.
     */
    @PostMapping("/run")
    public ResponseEntity<RunTallyResponse> runTally(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @RequestBody @Valid RunTallyRequest request) {
        
        // TODO: Extract adminPersonId from SecurityContext
        // For now, use placeholder (consistent with specification allowing temporary param)
        Long adminPersonId = 1L;
        
        RunTallyResponse response = tallyService.runTally(electionId, votingPeriodId, adminPersonId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /status
     * 
     * Get tally status for an election and voting period.
     */
    @GetMapping("/status")
    public ResponseEntity<TallyStatusResponse> getStatus(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId) {
        
        TallyStatusResponse response = tallyService.getStatus(electionId, votingPeriodId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /rollback
     * 
     * Rollback tally (admin emergency).
     * Removes winner assignments and marks tally as ROLLED_BACK.
     */
    @PostMapping("/rollback")
    public ResponseEntity<RollbackTallyResponse> rollback(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @RequestParam(required = false) String reason) {
        
        // TODO: Extract adminPersonId from SecurityContext
        Long adminPersonId = 1L;
        
        RollbackTallyResponse response = tallyService.rollback(electionId, votingPeriodId, adminPersonId, reason);
        return ResponseEntity.ok(response);
    }
}
