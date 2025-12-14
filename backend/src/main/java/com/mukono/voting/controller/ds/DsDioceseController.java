package com.mukono.voting.controller.ds;

import com.mukono.voting.payload.request.CreateDioceseRequest;
import com.mukono.voting.payload.request.UpdateDioceseRequest;
import com.mukono.voting.payload.response.DioceseResponse;
import com.mukono.voting.service.org.DioceseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ds/org/dioceses")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsDioceseController {

    private final DioceseService dioceseService;

    public DsDioceseController(DioceseService dioceseService) {
        this.dioceseService = dioceseService;
    }

    @PostMapping
    public ResponseEntity<DioceseResponse> create(@Valid @RequestBody CreateDioceseRequest request) {
        var created = dioceseService.create(request.getName(), request.getCode());
        return ResponseEntity.status(201).body(DioceseResponse.fromEntity(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DioceseResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody UpdateDioceseRequest request) {
        var updated = dioceseService.update(id, request.getName(), request.getCode(), request.getStatus());
        return ResponseEntity.ok(DioceseResponse.fromEntity(updated));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DioceseResponse> getById(@PathVariable Long id) {
        var entity = dioceseService.getById(id);
        return ResponseEntity.ok(DioceseResponse.fromEntity(entity));
    }

    @GetMapping
    public ResponseEntity<Page<DioceseResponse>> list(@RequestParam(name = "q", required = false) String q,
                                                      @RequestParam(name = "page", defaultValue = "0") int page,
                                                      @RequestParam(name = "size", defaultValue = "20") int size,
                                                      @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = dioceseService.list(q, pageable).map(DioceseResponse::fromEntity);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        dioceseService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    private Pageable toPageable(int page, int size, String sort) {
        // sort format: field,direction
        String[] parts = sort.split(",", 2);
        String field = parts.length > 0 ? parts[0] : "id";
        String direction = parts.length > 1 ? parts[1] : "desc";
        Sort s = direction.equalsIgnoreCase("asc") ? Sort.by(field).ascending() : Sort.by(field).descending();
        return PageRequest.of(page, size, s);
    }
}
