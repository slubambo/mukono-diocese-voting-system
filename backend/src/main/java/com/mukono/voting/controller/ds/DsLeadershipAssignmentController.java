package com.mukono.voting.controller.ds;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.payload.request.CreateLeadershipAssignmentRequest;
import com.mukono.voting.payload.request.UpdateLeadershipAssignmentRequest;
import com.mukono.voting.payload.response.LeadershipAssignmentResponse;
import com.mukono.voting.service.leadership.LeadershipAssignmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * DS Controller for Leadership Assignment management.
 * Handles CRUD operations for assigning people to leadership positions with term tracking.
 */
@RestController
@RequestMapping("/api/v1/ds/leadership/assignments")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsLeadershipAssignmentController {

    private final LeadershipAssignmentService leadershipAssignmentService;

    public DsLeadershipAssignmentController(LeadershipAssignmentService leadershipAssignmentService) {
        this.leadershipAssignmentService = leadershipAssignmentService;
    }

    /**
     * Create a new leadership assignment.
     *
     * @param request the create request with person, position, target, and term dates
     * @return created LeadershipAssignmentResponse with status 201
     */
    @PostMapping
    public ResponseEntity<LeadershipAssignmentResponse> create(@Valid @RequestBody CreateLeadershipAssignmentRequest request) {
        var created = leadershipAssignmentService.create(
                request.getPersonId(),
                request.getFellowshipPositionId(),
                request.getDioceseId(),
                request.getArchdeaconryId(),
                request.getChurchId(),
                request.getTermStartDate(),
                request.getTermEndDate(),
                request.getNotes());
        return ResponseEntity.status(201).body(LeadershipAssignmentResponse.fromEntity(created));
    }

    /**
     * Update an existing leadership assignment.
     *
     * @param id the assignment ID
     * @param request the update request with optional fields
     * @return updated LeadershipAssignmentResponse
     */
    @PutMapping("/{id}")
    public ResponseEntity<LeadershipAssignmentResponse> update(@PathVariable Long id,
                                                               @Valid @RequestBody UpdateLeadershipAssignmentRequest request) {
        var updated = leadershipAssignmentService.update(
                id,
                request.getPersonId(),
                request.getFellowshipPositionId(),
                request.getDioceseId(),
                request.getArchdeaconryId(),
                request.getChurchId(),
                request.getTermStartDate(),
                request.getTermEndDate(),
                request.getStatus(),
                request.getNotes());
        return ResponseEntity.ok(LeadershipAssignmentResponse.fromEntity(updated));
    }

    /**
     * Get a leadership assignment by ID.
     *
     * @param id the assignment ID
     * @return LeadershipAssignmentResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<LeadershipAssignmentResponse> getById(@PathVariable Long id) {
        var entity = leadershipAssignmentService.getById(id);
        return ResponseEntity.ok(LeadershipAssignmentResponse.fromEntity(entity));
    }

    /**
     * List leadership assignments with optional filters and pagination.
     *
     * @param status optional filter by RecordStatus (ACTIVE/INACTIVE)
     * @param fellowshipId optional filter by fellowship ID
     * @param personId optional filter by person ID
     * @param archdeaconryId optional filter by archdeaconry ID
     * @param page page number (default 0)
     * @param size page size (default 20)
     * @param sort sort order (default id,desc)
     * @return page of LeadershipAssignmentResponse
     */
    @GetMapping
    public ResponseEntity<Page<LeadershipAssignmentResponse>> list(
            @RequestParam(name = "status", required = false) RecordStatus status,
            @RequestParam(name = "fellowshipId", required = false) Long fellowshipId,
            @RequestParam(name = "personId", required = false) Long personId,
            @RequestParam(name = "archdeaconryId", required = false) Long archdeaconryId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = leadershipAssignmentService.list(status, fellowshipId, personId, archdeaconryId, pageable)
                .map(LeadershipAssignmentResponse::fromEntity);
        return ResponseEntity.ok(result);
    }

    /**
     * Deactivate a leadership assignment by setting its status to INACTIVE.
     * Optionally sets the term end date.
     *
     * @param id the assignment ID
     * @param termEndDate optional term end date to set
     * @return no content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id,
                                           @RequestParam(name = "termEndDate", required = false) LocalDate termEndDate) {
        leadershipAssignmentService.deactivate(id, termEndDate);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get eligible voters (active leaders) for a specific fellowship and scope.
     * Used for voting system eligibility determination.
     *
     * @param fellowshipId required fellowship ID
     * @param scope required position scope
     * @param page page number (default 0)
     * @param size page size (default 20)
     * @param sort sort order (default id,desc)
     * @return page of active LeadershipAssignmentResponse
     */
    @GetMapping("/eligible-voters")
    public ResponseEntity<Page<LeadershipAssignmentResponse>> listEligibleVoters(
            @RequestParam(name = "fellowshipId") Long fellowshipId,
            @RequestParam(name = "scope") PositionScope scope,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = leadershipAssignmentService.list(RecordStatus.ACTIVE, fellowshipId, null, null, pageable)
                .map(LeadershipAssignmentResponse::fromEntity);
        return ResponseEntity.ok(result);
    }

    /**
     * Convert page/size/sort parameters to Pageable.
     */
    private Pageable toPageable(int page, int size, String sort) {
        String[] parts = sort.split(",", 2);
        String field = parts.length > 0 ? parts[0] : "id";
        String direction = parts.length > 1 ? parts[1] : "desc";
        Sort s = direction.equalsIgnoreCase("asc") ? Sort.by(field).ascending() : Sort.by(field).descending();
        return PageRequest.of(page, size, s);
    }
}
