package com.mukono.voting.controller.ds;

import com.mukono.voting.model.election.ElectionStatus;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.payload.request.CancelElectionRequest;
import com.mukono.voting.payload.request.CreateElectionRequest;
import com.mukono.voting.payload.request.UpdateElectionRequest;
import com.mukono.voting.payload.response.ElectionResponse;
import com.mukono.voting.payload.response.ElectionSummary;
import com.mukono.voting.service.election.ElectionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * REST controller for election management.
 * Provides endpoints to create, update, list, and cancel elections.
 */
@RestController
@RequestMapping("/api/v1/ds/elections")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsElectionController {

    private final ElectionService electionService;

    public DsElectionController(ElectionService electionService) {
        this.electionService = electionService;
    }

    /**
     * Create a new election.
     * 
     * @param request the create election request
     * @return 201 Created with election response
     */
    @PostMapping
    public ResponseEntity<ElectionResponse> create(@Valid @RequestBody CreateElectionRequest request) {
        var election = electionService.create(
                request.getName(),
                request.getDescription(),
                request.getFellowshipId(),
                PositionScope.valueOf(request.getScope()),
                request.getDioceseId(),
                request.getArchdeaconryId(),
                request.getChurchId(),
                request.getTermStartDate(),
                request.getTermEndDate(),
                request.getNominationStartAt(),
                request.getNominationEndAt(),
                request.getVotingStartAt(),
                request.getVotingEndAt()
        );
        return ResponseEntity.status(201).body(ElectionResponse.fromEntity(election));
    }

    /**
     * Update an existing election.
     * 
     * @param id the election ID
     * @param request the update election request
     * @return 200 OK with updated election response
     */
    @PutMapping("/{id}")
    public ResponseEntity<ElectionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateElectionRequest request) {
        
        ElectionStatus status = null;
        if (request.getStatus() != null) {
            status = ElectionStatus.valueOf(request.getStatus());
        }
        
        var election = electionService.update(
                id,
                request.getName(),
                request.getDescription(),
                status,
                request.getTermStartDate(),
                request.getTermEndDate(),
                request.getNominationStartAt(),
                request.getNominationEndAt(),
                request.getVotingStartAt(),
                request.getVotingEndAt()
        );
        return ResponseEntity.ok(ElectionResponse.fromEntity(election));
    }

    /**
     * Get election by ID.
     * 
     * @param id the election ID
     * @return 200 OK with election response
     */
    @GetMapping("/{id}")
    public ResponseEntity<ElectionResponse> getById(@PathVariable Long id) {
        var election = electionService.getById(id);
        return ResponseEntity.ok(ElectionResponse.fromEntity(election));
    }

    /**
     * List elections with optional filters and pagination.
     * 
     * @param fellowshipId filter by fellowship (optional)
     * @param scope filter by scope (optional)
     * @param status filter by status (optional)
     * @param dioceseId filter by diocese (optional)
     * @param archdeaconryId filter by archdeaconry (optional)
     * @param churchId filter by church (optional)
     * @param page page number (default 0)
     * @param size page size (default 20)
     * @param sort sort field and direction (default id,desc)
     * @return 200 OK with page of election summaries
     */
    @GetMapping
    public ResponseEntity<Page<ElectionSummary>> list(
            @RequestParam(required = false) Long fellowshipId,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long dioceseId,
            @RequestParam(required = false) Long archdeaconryId,
            @RequestParam(required = false) Long churchId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {

        Pageable pageable = toPageable(page, size, sort);

        PositionScope scopeEnum = scope != null ? PositionScope.valueOf(scope) : null;
        ElectionStatus statusEnum = status != null ? ElectionStatus.valueOf(status) : null;

        var result = electionService.list(
                fellowshipId,
                scopeEnum,
                statusEnum,
                dioceseId,
                archdeaconryId,
                churchId,
                pageable
        ).map(ElectionSummary::fromEntity);

        return ResponseEntity.ok(result);
    }

    /**
     * Cancel an election.
     * 
     * @param id the election ID
     * @param request the cancel request with reason
     * @return 200 OK with cancelled election response
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ElectionResponse> cancel(
            @PathVariable Long id,
            @Valid @RequestBody CancelElectionRequest request) {
        var election = electionService.cancel(id, request.getReason());
        return ResponseEntity.ok(ElectionResponse.fromEntity(election));
    }

    /**
     * Helper method to convert page parameters to Pageable.
     */
    private Pageable toPageable(int page, int size, String sort) {
        String[] parts = sort.split(",", 2);
        String field = parts.length > 0 ? parts[0] : "id";
        String direction = parts.length > 1 ? parts[1] : "desc";
        Sort s = direction.equalsIgnoreCase("asc") ? Sort.by(field).ascending() : Sort.by(field).descending();
        return PageRequest.of(page, size, s);
    }
}
