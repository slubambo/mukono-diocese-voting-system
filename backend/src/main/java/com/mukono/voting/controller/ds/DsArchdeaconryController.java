package com.mukono.voting.controller.ds;

import com.mukono.voting.payload.request.CreateArchdeaconryRequest;
import com.mukono.voting.payload.request.UpdateArchdeaconryRequest;
import com.mukono.voting.payload.response.ArchdeaconryResponse;
import com.mukono.voting.service.org.ArchdeaconryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ds/org/archdeaconries")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsArchdeaconryController {

    private final ArchdeaconryService archdeaconryService;

    public DsArchdeaconryController(ArchdeaconryService archdeaconryService) {
        this.archdeaconryService = archdeaconryService;
    }

    @PostMapping
    public ResponseEntity<ArchdeaconryResponse> create(@Valid @RequestBody CreateArchdeaconryRequest request) {
        var created = archdeaconryService.create(request.getDioceseId(), request.getName(), request.getCode());
        return ResponseEntity.status(201).body(ArchdeaconryResponse.fromEntity(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArchdeaconryResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody UpdateArchdeaconryRequest request) {
        var updated = archdeaconryService.update(id, request.getName(), request.getCode(), request.getStatus());
        return ResponseEntity.ok(ArchdeaconryResponse.fromEntity(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArchdeaconryResponse> getById(@PathVariable Long id) {
        var entity = archdeaconryService.getById(id);
        return ResponseEntity.ok(ArchdeaconryResponse.fromEntity(entity));
    }

    @GetMapping
    public ResponseEntity<Page<ArchdeaconryResponse>> list(@RequestParam(name = "dioceseId") Long dioceseId,
                                                           @RequestParam(name = "q", required = false) String q,
                                                           @RequestParam(name = "page", defaultValue = "0") int page,
                                                           @RequestParam(name = "size", defaultValue = "20") int size,
                                                           @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = archdeaconryService.listWithCounts(dioceseId, q, pageable)
            .map(arc -> ArchdeaconryResponse.fromEntity(arc.getArchdeaconry(), arc.getChurchCount(), arc.getCurrentLeadersCount()));
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        archdeaconryService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    private Pageable toPageable(int page, int size, String sort) {
        String[] parts = sort.split(",", 2);
        String field = parts.length > 0 ? parts[0] : "id";
        String direction = parts.length > 1 ? parts[1] : "desc";
        Sort s = direction.equalsIgnoreCase("asc") ? Sort.by(field).ascending() : Sort.by(field).descending();
        return PageRequest.of(page, size, s);
    }
}
