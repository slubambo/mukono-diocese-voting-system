package com.mukono.voting.api.election.controller;


import com.mukono.voting.model.election.ElectionVoterRoll;
import com.mukono.voting.payload.request.election.VoterRollOverrideRequest;
import com.mukono.voting.payload.response.common.CountResponse;
import com.mukono.voting.payload.response.common.PagedResponse;
import com.mukono.voting.payload.response.election.VoterRollEntryResponse;
import com.mukono.voting.service.election.ElectionVoterEligibilityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for voter roll management (admin).
 * 
 * Endpoints:
 * - PUT /api/v1/admin/elections/{electionId}/voter-roll/{personId}
 * - DELETE /api/v1/admin/elections/{electionId}/voter-roll/{personId}
 * - GET /api/v1/admin/elections/{electionId}/voter-roll/?eligible=true&page=0&size=20
 * - GET /api/v1/admin/elections/{electionId}/voter-roll/count?eligible=true
 */
@RestController
@RequestMapping("/api/v1/admin/elections/{electionId}")
@Validated
public class ElectionVoterRollAdminController {

    private final ElectionVoterEligibilityService eligibilityService;

    @Autowired
    public ElectionVoterRollAdminController(ElectionVoterEligibilityService eligibilityService) {
        this.eligibilityService = eligibilityService;
    }

    /**
     * Add or update a voter roll override for a specific voting period (whitelist/blacklist).
     * 
     * PUT /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/voter-roll/{personId}
     * Body: {votingPeriodId, eligible, addedBy, reason}
     */
    @PutMapping("/voting-periods/{votingPeriodId}/voter-roll/{personId}")
    public ResponseEntity<VoterRollEntryResponse> addOrUpdateOverride(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @PathVariable @NotNull(message = "Person ID is required") Long personId,
            @Valid @RequestBody VoterRollOverrideRequest request) {
        
        ElectionVoterRoll entry = eligibilityService.addOrUpdateOverride(
                electionId,
                votingPeriodId,
                personId,
                request.getEligible(),
                request.getAddedBy(),
                request.getReason()
        );
        
        VoterRollEntryResponse response = mapToResponse(entry);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Remove a voter roll override for a specific voting period.
     * 
     * DELETE /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/voter-roll/{personId}
     */
    @DeleteMapping("/voting-periods/{votingPeriodId}/voter-roll/{personId}")
    public ResponseEntity<Void> removeOverride(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @PathVariable @NotNull(message = "Person ID is required") Long personId) {
        
        eligibilityService.removeOverride(electionId, votingPeriodId, personId);
        return ResponseEntity.noContent().build();
    }

    /**
     * List voter roll overrides for a specific voting period (paginated, filterable by eligible).
     * 
     * GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/voter-roll?eligible=true&page=0&size=20&sort=addedAt,desc
     */
    @GetMapping("/voting-periods/{votingPeriodId}/voter-roll")
    public ResponseEntity<PagedResponse<VoterRollEntryResponse>> listOverrides(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @RequestParam(required = false) Boolean eligible,
            @PageableDefault(size = 20, sort = "addedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<ElectionVoterRoll> page = eligibilityService.listOverrides(electionId, votingPeriodId, eligible, pageable);
        
        Page<VoterRollEntryResponse> responsePage = page.map(this::mapToResponse);
        PagedResponse<VoterRollEntryResponse> response = PagedResponse.from(responsePage);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Count voter roll overrides for a specific voting period (filterable by eligible).
     * 
     * GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/voter-roll/count?eligible=true
     */
    @GetMapping("/voting-periods/{votingPeriodId}/voter-roll/count")
    public ResponseEntity<CountResponse> countOverrides(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting Period ID is required") Long votingPeriodId,
            @RequestParam(required = false) Boolean eligible) {
        
        long count = eligibilityService.countOverrides(electionId, votingPeriodId, eligible);
        CountResponse response = new CountResponse(count);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Map ElectionVoterRoll entity to VoterRollEntryResponse DTO (no entity leakage).
     */
    private VoterRollEntryResponse mapToResponse(ElectionVoterRoll entry) {
        return new VoterRollEntryResponse(
                entry.getId(),
                entry.getElection().getId(),
                entry.getVotingPeriod().getId(),
                entry.getPerson().getId(),
                entry.getEligible(),
                entry.getReason(),
                entry.getAddedBy(),
                entry.getAddedAt()
        );
    }
}
