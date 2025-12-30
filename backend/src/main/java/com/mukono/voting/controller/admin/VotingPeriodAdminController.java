package com.mukono.voting.controller.admin;

import com.mukono.voting.model.election.VotingPeriod;
import com.mukono.voting.model.election.VotingPeriodStatus;
import com.mukono.voting.model.election.VotingPeriodPosition;
import com.mukono.voting.model.election.ElectionPosition;
import com.mukono.voting.payload.request.CreateVotingPeriodRequest;
import com.mukono.voting.payload.request.UpdateVotingPeriodRequest;
import com.mukono.voting.payload.request.AssignVotingPeriodPositionsRequest;
import com.mukono.voting.payload.response.VotingPeriodResponse;
import com.mukono.voting.payload.response.VotingPeriodPositionsResponse;
import com.mukono.voting.payload.response.VotingPeriodPositionsMapResponse;
import com.mukono.voting.service.election.VotingPeriodService;
import com.mukono.voting.service.election.VotingPeriodPositionService;
import com.mukono.voting.repository.election.ElectionPositionRepository;
import com.mukono.voting.payload.response.common.CountResponse;
import com.mukono.voting.payload.response.election.EligibleVoterResponse;
import com.mukono.voting.service.election.EligibleVoterService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Admin controller for managing voting periods within elections.
 * Provides endpoints to create, read, update, list, and transition voting periods.
 * 
 * Base path: /api/v1/admin/elections/{electionId}/voting-periods
 */
@RestController
@RequestMapping("/api/v1/admin/elections/{electionId}/voting-periods")
@PreAuthorize("hasRole('ADMIN')")
@Validated
public class VotingPeriodAdminController {

    private final VotingPeriodService votingPeriodService;
    private final EligibleVoterService eligibleVoterService;

    public VotingPeriodAdminController(VotingPeriodService votingPeriodService,
                                       EligibleVoterService eligibleVoterService) {
        this.votingPeriodService = votingPeriodService;
        this.eligibleVoterService = eligibleVoterService;
    }

    /**
     * Create a new voting period for an election.
     *
     * POST /api/v1/admin/elections/{electionId}/voting-periods
     *
     * @param electionId the election ID
     * @param request create request with name, description, startTime, endTime
     * @return created voting period response (201 Created)
     */
    @PostMapping
    public ResponseEntity<VotingPeriodResponse> createVotingPeriod(
            @PathVariable @NotNull Long electionId,
            @Valid @RequestBody CreateVotingPeriodRequest request) {
        VotingPeriod created = votingPeriodService.createVotingPeriod(electionId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(votingPeriodService.toResponse(created));
    }

    /**
     * Get a single voting period by ID.
     *
     * GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return voting period response (200 OK)
     */
    @GetMapping("/{votingPeriodId}")
    public ResponseEntity<VotingPeriodResponse> getVotingPeriod(
            @PathVariable @NotNull Long electionId,
            @PathVariable @NotNull Long votingPeriodId) {
        VotingPeriod votingPeriod = votingPeriodService.getVotingPeriod(electionId, votingPeriodId);
        return ResponseEntity.ok(votingPeriodService.toResponse(votingPeriod));
    }

    /**
     * List voting periods for an election (paginated, optionally filtered by status).
     *
     * GET /api/v1/admin/elections/{electionId}/voting-periods?page=0&size=10&sort=name,asc&status=OPEN
     *
     * @param electionId the election ID
     * @param page page number (0-indexed, default 0)
     * @param size page size (default 10)
     * @param sort sort order (default: "id,desc")
     * @param status optional status filter (SCHEDULED, OPEN, CLOSED, CANCELLED)
     * @return paginated voting period responses (200 OK)
     */
    @GetMapping
    public ResponseEntity<Page<VotingPeriodResponse>> listVotingPeriods(
            @PathVariable @NotNull Long electionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort,
            @RequestParam(required = false) VotingPeriodStatus status) {
        Pageable pageable = toPageable(page, size, sort);
        // Use optimized list with counts
        Page<VotingPeriodResponse> responses = votingPeriodService.listVotingPeriodsWithCounts(electionId, status, pageable);
        return ResponseEntity.ok(responses);
    }

    /**
     * Transition a voting period to OPEN status.
     * Only allowed from SCHEDULED status.
     * Enforces: only one OPEN period per election at a time.
     *
     * POST /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/open
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return updated voting period response (200 OK)
     */
    @PostMapping("/{votingPeriodId}/open")
    public ResponseEntity<VotingPeriodResponse> openVotingPeriod(
            @PathVariable @NotNull Long electionId,
            @PathVariable @NotNull Long votingPeriodId) {
        VotingPeriod opened = votingPeriodService.openVotingPeriod(electionId, votingPeriodId);
        return ResponseEntity.ok(votingPeriodService.toResponse(opened));
    }

    /**
     * Transition a voting period to CLOSED status.
     * Allowed from SCHEDULED or OPEN status.
     *
     * POST /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/close
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return updated voting period response (200 OK)
     */
    @PostMapping("/{votingPeriodId}/close")
    public ResponseEntity<VotingPeriodResponse> closeVotingPeriod(
            @PathVariable @NotNull Long electionId,
            @PathVariable @NotNull Long votingPeriodId) {
        VotingPeriod closed = votingPeriodService.closeVotingPeriod(electionId, votingPeriodId);
        return ResponseEntity.ok(votingPeriodService.toResponse(closed));
    }

    /**
     * Transition a voting period to CANCELLED status.
     * Only allowed from SCHEDULED status.
     *
     * POST /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/cancel
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return updated voting period response (200 OK)
     */
    @PostMapping("/{votingPeriodId}/cancel")
    public ResponseEntity<VotingPeriodResponse> cancelVotingPeriod(
            @PathVariable @NotNull Long electionId,
            @PathVariable @NotNull Long votingPeriodId) {
        VotingPeriod cancelled = votingPeriodService.cancelVotingPeriod(electionId, votingPeriodId);
        return ResponseEntity.ok(votingPeriodService.toResponse(cancelled));
    }

    /**
     * Assign positions to a voting period.
     * Requires ADMIN role.
     *
     * POST /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/positions
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param request positions assignment request
     * @return voting period with assigned positions (200 OK)
     */
    @PostMapping("/{votingPeriodId}/positions")
    public ResponseEntity<VotingPeriodResponse> assignVotingPeriodPositions(
            @PathVariable @NotNull Long electionId,
            @PathVariable @NotNull Long votingPeriodId,
            @Valid @RequestBody AssignVotingPeriodPositionsRequest request) {
        VotingPeriod updated = votingPeriodService.assignVotingPeriodPositions(electionId, votingPeriodId, request);
        return ResponseEntity.ok(votingPeriodService.toResponse(updated));
    }

    /**
     * Get assigned positions for a voting period.
     *
     * GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/positions
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return assigned positions response (200 OK)
     */
    @GetMapping("/{votingPeriodId}/positions")
    public ResponseEntity<VotingPeriodPositionsResponse> getVotingPeriodPositions(
            @PathVariable @NotNull Long electionId,
            @PathVariable @NotNull Long votingPeriodId) {
        VotingPeriodPositionsResponse positions = votingPeriodService.getVotingPeriodPositions(electionId, votingPeriodId);
        return ResponseEntity.ok(positions);
    }

    /**
     * Bulk mapping of positions assigned to voting periods for an election.
     * GET /api/v1/admin/elections/{electionId}/voting-periods/positions-map
     */
    @GetMapping("/positions-map")
    public ResponseEntity<VotingPeriodPositionsMapResponse> getPositionsMap(
            @PathVariable @NotNull Long electionId) {
        return ResponseEntity.ok(votingPeriodService.getPositionsMap(electionId));
    }

    /**
     * Get eligible voters for a voting period.
     *
     * GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/eligible-voters?page=0&size=20&sort=fullName,asc
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param page page number (0-indexed, default 0)
     * @param size page size (default 20)
     * @param sort sort order (default: "fullName,asc")
     * @param status optional status filter (ALL, REGISTERED, NOT_REGISTERED)
     * @param q optional search query (by name or ID number)
     * @param fellowshipId optional filter by fellowship ID
     * @param electionPositionId optional filter by election position ID
     * @return paginated eligible voter responses (200 OK)
     */
    @GetMapping("/{votingPeriodId}/eligible-voters")
    public ResponseEntity<Page<EligibleVoterResponse>> listEligibleVoters(
            @PathVariable @NotNull Long electionId,
            @PathVariable @NotNull Long votingPeriodId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fullName,asc") String sort,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long fellowshipId,
            @RequestParam(required = false) Long electionPositionId) {
        Pageable pageable = toPageable(page, size, sort);
        var result = eligibleVoterService.listEligibleVoters(electionId, votingPeriodId, status, q, fellowshipId, electionPositionId, pageable);
        return ResponseEntity.ok(result);
    }

    /**
     * Count eligible voters for a voting period.
     *
     * GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/eligible-voters/count
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param status optional status filter (ALL, REGISTERED, NOT_REGISTERED)
     * @param fellowshipId optional filter by fellowship ID
     * @param electionPositionId optional filter by election position ID
     * @return count response (200 OK)
     */
    @GetMapping("/{votingPeriodId}/eligible-voters/count")
    public ResponseEntity<CountResponse> countEligibleVoters(
            @PathVariable @NotNull Long electionId,
            @PathVariable @NotNull Long votingPeriodId,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false) Long fellowshipId,
            @RequestParam(required = false) Long electionPositionId) {
        var count = eligibleVoterService.countEligibleVoters(electionId, votingPeriodId, status, fellowshipId, electionPositionId);
        return ResponseEntity.ok(count);
    }

    /**
     * Convert page/size/sort query parameters to Pageable.
     * Default sort is "id,desc".
     *
     * @param page page number (0-indexed)
     * @param size page size
     * @param sort sort specification ("field,asc|desc" or "field1,asc;field2,desc")
     * @return Pageable object
     */
    private Pageable toPageable(int page, int size, String sort) {
        Sort sortSpec = Sort.by(Sort.Direction.DESC, "id");
        
        if (sort != null && !sort.isEmpty()) {
            String[] sortParts = sort.split(";");
            Sort.Order[] orders = new Sort.Order[sortParts.length];
            
            for (int i = 0; i < sortParts.length; i++) {
                String[] parts = sortParts[i].trim().split(",");
                String field = parts[0].trim();
                Sort.Direction direction = Sort.Direction.DESC;
                
                if (parts.length > 1) {
                    String dir = parts[1].trim().toUpperCase();
                    direction = "ASC".equals(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
                }
                
                orders[i] = new Sort.Order(direction, field);
            }
            
            sortSpec = Sort.by(orders);
        }
        
        return PageRequest.of(page, size, sortSpec);
    }
}
