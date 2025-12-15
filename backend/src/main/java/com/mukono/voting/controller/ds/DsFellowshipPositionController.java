package com.mukono.voting.controller.ds;

import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.payload.request.CreateFellowshipPositionRequest;
import com.mukono.voting.payload.request.UpdateFellowshipPositionRequest;
import com.mukono.voting.payload.response.FellowshipPositionResponse;
import com.mukono.voting.service.leadership.FellowshipPositionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * DS Controller for Fellowship Position management.
 * Handles CRUD operations for fellowship positions with specific scopes and seats.
 */
@RestController
@RequestMapping("/api/v1/ds/leadership/positions")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsFellowshipPositionController {

    private final FellowshipPositionService fellowshipPositionService;

    public DsFellowshipPositionController(FellowshipPositionService fellowshipPositionService) {
        this.fellowshipPositionService = fellowshipPositionService;
    }

    /**
     * Create a new fellowship position.
     *
     * @param request the create request with fellowship, title, scope, and seats
     * @return created FellowshipPositionResponse with status 201
     */
    @PostMapping
    public ResponseEntity<FellowshipPositionResponse> create(@Valid @RequestBody CreateFellowshipPositionRequest request) {
        var created = fellowshipPositionService.create(
                request.getFellowshipId(),
                request.getTitleId(),
                request.getScope(),
                request.getSeats());
        return ResponseEntity.status(201).body(FellowshipPositionResponse.fromEntity(created));
    }

    /**
     * Update an existing fellowship position.
     *
     * @param id the fellowship position ID
     * @param request the update request with optional fields
     * @return updated FellowshipPositionResponse
     */
    @PutMapping("/{id}")
    public ResponseEntity<FellowshipPositionResponse> update(@PathVariable Long id,
                                                             @Valid @RequestBody UpdateFellowshipPositionRequest request) {
        var updated = fellowshipPositionService.update(
                id,
                request.getTitleId(),
                request.getScope(),
                request.getSeats(),
                request.getStatus());
        return ResponseEntity.ok(FellowshipPositionResponse.fromEntity(updated));
    }

    /**
     * Get a fellowship position by ID.
     *
     * @param id the fellowship position ID
     * @return FellowshipPositionResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<FellowshipPositionResponse> getById(@PathVariable Long id) {
        var entity = fellowshipPositionService.getById(id);
        return ResponseEntity.ok(FellowshipPositionResponse.fromEntity(entity));
    }

    /**
     * List fellowship positions with required fellowship filter and optional scope filter.
     *
     * @param fellowshipId required fellowship ID to filter by
     * @param scope optional position scope to filter by
     * @param page page number (default 0)
     * @param size page size (default 20)
     * @param sort sort order (default id,desc)
     * @return page of FellowshipPositionResponse
     */
    @GetMapping
    public ResponseEntity<Page<FellowshipPositionResponse>> list(
            @RequestParam(name = "fellowshipId") Long fellowshipId,
            @RequestParam(name = "scope", required = false) PositionScope scope,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = fellowshipPositionService.list(fellowshipId, scope, pageable)
                .map(FellowshipPositionResponse::fromEntity);
        return ResponseEntity.ok(result);
    }

    /**
     * Deactivate a fellowship position by setting its status to INACTIVE.
     *
     * @param id the fellowship position ID
     * @return no content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        fellowshipPositionService.deactivate(id);
        return ResponseEntity.noContent().build();
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
