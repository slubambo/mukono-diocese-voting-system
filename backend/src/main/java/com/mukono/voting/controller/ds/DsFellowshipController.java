package com.mukono.voting.controller.ds;

import com.mukono.voting.payload.request.CreateFellowshipRequest;
import com.mukono.voting.payload.request.UpdateFellowshipRequest;
import com.mukono.voting.payload.response.FellowshipResponse;
import com.mukono.voting.service.org.FellowshipService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ds/org/fellowships")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsFellowshipController {

    private final FellowshipService fellowshipService;

    public DsFellowshipController(FellowshipService fellowshipService) {
        this.fellowshipService = fellowshipService;
    }

    @PostMapping
    public ResponseEntity<FellowshipResponse> create(@Valid @RequestBody CreateFellowshipRequest request) {
        var created = fellowshipService.create(request.getName(), request.getCode());
        return ResponseEntity.status(201).body(FellowshipResponse.fromEntity(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FellowshipResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody UpdateFellowshipRequest request) {
        var updated = fellowshipService.update(id, request.getName(), request.getCode(), request.getStatus());
        return ResponseEntity.ok(FellowshipResponse.fromEntity(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FellowshipResponse> getById(@PathVariable Long id) {
        var entity = fellowshipService.getById(id);
        return ResponseEntity.ok(FellowshipResponse.fromEntity(entity));
    }

    @GetMapping
    public ResponseEntity<Page<FellowshipResponse>> list(@RequestParam(name = "q", required = false) String q,
                                                         @RequestParam(name = "page", defaultValue = "0") int page,
                                                         @RequestParam(name = "size", defaultValue = "20") int size,
                                                         @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = fellowshipService.list(q, pageable).map(FellowshipResponse::fromEntity);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        fellowshipService.deactivate(id);
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
