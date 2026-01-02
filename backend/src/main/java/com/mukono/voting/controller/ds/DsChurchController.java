package com.mukono.voting.controller.ds;


import com.mukono.voting.payload.request.CreateChurchRequest;
import com.mukono.voting.payload.request.UpdateChurchRequest;
import com.mukono.voting.payload.response.ChurchResponse;
import com.mukono.voting.service.org.ChurchService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ds/org/churches")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsChurchController {

    private final ChurchService churchService;

    public DsChurchController(ChurchService churchService) {
        this.churchService = churchService;
    }

    @PostMapping
    public ResponseEntity<ChurchResponse> create(@Valid @RequestBody CreateChurchRequest request) {
        var created = churchService.create(request.getArchdeaconryId(), request.getName(), request.getCode());
        return ResponseEntity.status(201).body(ChurchResponse.fromEntity(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChurchResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody UpdateChurchRequest request) {
        var updated = churchService.update(id, request.getName(), request.getCode(), request.getStatus());
        return ResponseEntity.ok(ChurchResponse.fromEntity(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChurchResponse> getById(@PathVariable Long id) {
        var entity = churchService.getById(id);
        return ResponseEntity.ok(ChurchResponse.fromEntity(entity));
    }

    @GetMapping
    public ResponseEntity<Page<ChurchResponse>> list(@RequestParam(name = "archdeaconryId") Long archdeaconryId,
                                                     @RequestParam(name = "q", required = false) String q,
                                                     @RequestParam(name = "page", defaultValue = "0") int page,
                                                     @RequestParam(name = "size", defaultValue = "20") int size,
                                                     @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = churchService.listWithCounts(archdeaconryId, q, pageable)
            .map(cwc -> ChurchResponse.fromEntity(cwc.getChurch(), cwc.getCurrentLeadersCount()));
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        churchService.deactivate(id);
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
