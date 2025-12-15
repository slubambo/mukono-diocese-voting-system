package com.mukono.voting.controller.ds;

import com.mukono.voting.payload.request.CreatePositionTitleRequest;
import com.mukono.voting.payload.request.UpdatePositionTitleRequest;
import com.mukono.voting.payload.response.PositionTitleResponse;
import com.mukono.voting.service.leadership.PositionTitleService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * DS Controller for Position Title management.
 * Handles CRUD operations for reusable position titles.
 */
@RestController
@RequestMapping("/api/v1/ds/leadership/titles")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsPositionTitleController {

    private final PositionTitleService positionTitleService;

    public DsPositionTitleController(PositionTitleService positionTitleService) {
        this.positionTitleService = positionTitleService;
    }

    /**
     * Create a new position title.
     *
     * @param request the create request with title name
     * @return created PositionTitleResponse with status 201
     */
    @PostMapping
    public ResponseEntity<PositionTitleResponse> create(@Valid @RequestBody CreatePositionTitleRequest request) {
        var created = positionTitleService.create(request.getName());
        return ResponseEntity.status(201).body(PositionTitleResponse.fromEntity(created));
    }

    /**
     * Update an existing position title.
     *
     * @param id the position title ID
     * @param request the update request with optional fields
     * @return updated PositionTitleResponse
     */
    @PutMapping("/{id}")
    public ResponseEntity<PositionTitleResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody UpdatePositionTitleRequest request) {
        var updated = positionTitleService.update(id, request.getName(), request.getStatus());
        return ResponseEntity.ok(PositionTitleResponse.fromEntity(updated));
    }

    /**
     * Get a position title by ID.
     *
     * @param id the position title ID
     * @return PositionTitleResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<PositionTitleResponse> getById(@PathVariable Long id) {
        var entity = positionTitleService.getById(id);
        return ResponseEntity.ok(PositionTitleResponse.fromEntity(entity));
    }

    /**
     * List position titles with optional search and pagination.
     *
     * @param q optional search query
     * @param page page number (default 0)
     * @param size page size (default 20)
     * @param sort sort order (default id,desc)
     * @return page of PositionTitleResponse
     */
    @GetMapping
    public ResponseEntity<Page<PositionTitleResponse>> list(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = positionTitleService.list(q, pageable).map(PositionTitleResponse::fromEntity);
        return ResponseEntity.ok(result);
    }

    /**
     * Deactivate a position title by setting its status to INACTIVE.
     *
     * @param id the position title ID
     * @return no content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        positionTitleService.deactivate(id);
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
