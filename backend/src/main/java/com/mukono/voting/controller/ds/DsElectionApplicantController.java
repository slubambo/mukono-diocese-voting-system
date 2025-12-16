package com.mukono.voting.controller.ds;

import com.mukono.voting.model.election.ApplicantSource;
import com.mukono.voting.model.election.ApplicantStatus;
import com.mukono.voting.payload.request.CreateManualApplicantRequest;
import com.mukono.voting.payload.request.DecideApplicantRequest;
import com.mukono.voting.payload.request.NominateApplicantRequest;
import com.mukono.voting.payload.response.ElectionApplicantResponse;
import com.mukono.voting.service.election.ElectionApplicantService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ds/elections/{electionId}/applicants")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsElectionApplicantController {

    private final ElectionApplicantService applicantService;

    public DsElectionApplicantController(ElectionApplicantService applicantService) {
        this.applicantService = applicantService;
    }

    @PostMapping("/manual")
    public ResponseEntity<ElectionApplicantResponse> createManual(
            @PathVariable Long electionId,
            @Valid @RequestBody CreateManualApplicantRequest request) {
        var a = applicantService.createManualApplicant(
                electionId,
                request.getElectionPositionId(),
                request.getPersonId(),
                request.getSubmittedByPersonId(),
                request.getNotes()
        );
        return ResponseEntity.status(201).body(ElectionApplicantResponse.fromEntity(a));
    }

    @PostMapping("/nominate")
    public ResponseEntity<ElectionApplicantResponse> nominate(
            @PathVariable Long electionId,
            @Valid @RequestBody NominateApplicantRequest request) {
        var a = applicantService.nominateApplicant(
                electionId,
                request.getElectionPositionId(),
                request.getPersonId(),
                request.getNominatorPersonId(),
                request.getNotes()
        );
        return ResponseEntity.status(201).body(ElectionApplicantResponse.fromEntity(a));
    }

    @PostMapping("/{applicantId}/approve")
    public ResponseEntity<ElectionApplicantResponse> approve(@PathVariable Long electionId,
                                                             @PathVariable Long applicantId,
                                                             @Valid @RequestBody DecideApplicantRequest request) {
        var a = applicantService.approveApplicant(applicantId, request.getDecisionBy(), request.getNotes());
        return ResponseEntity.ok(ElectionApplicantResponse.fromEntity(a));
    }

    @PostMapping("/{applicantId}/reject")
    public ResponseEntity<ElectionApplicantResponse> reject(@PathVariable Long electionId,
                                                            @PathVariable Long applicantId,
                                                            @Valid @RequestBody DecideApplicantRequest request) {
        var a = applicantService.rejectApplicant(applicantId, request.getDecisionBy(), request.getNotes());
        return ResponseEntity.ok(ElectionApplicantResponse.fromEntity(a));
    }

    @PostMapping("/{applicantId}/withdraw")
    public ResponseEntity<ElectionApplicantResponse> withdraw(@PathVariable Long electionId,
                                                              @PathVariable Long applicantId,
                                                              @Valid @RequestBody DecideApplicantRequest request) {
        var a = applicantService.withdrawApplicant(applicantId, request.getDecisionBy(), request.getNotes());
        return ResponseEntity.ok(ElectionApplicantResponse.fromEntity(a));
    }

    @PostMapping("/{applicantId}/revert")
    public ResponseEntity<ElectionApplicantResponse> revert(@PathVariable Long electionId,
                                                            @PathVariable Long applicantId,
                                                            @Valid @RequestBody DecideApplicantRequest request) {
        var a = applicantService.revertToPending(applicantId, request.getDecisionBy(), request.getNotes());
        return ResponseEntity.ok(ElectionApplicantResponse.fromEntity(a));
    }

    @GetMapping("/{applicantId}")
    public ResponseEntity<ElectionApplicantResponse> getById(@PathVariable Long electionId,
                                                             @PathVariable Long applicantId) {
        var a = applicantService.getById(applicantId);
        return ResponseEntity.ok(ElectionApplicantResponse.fromEntity(a));
    }

    @GetMapping
    public ResponseEntity<Page<ElectionApplicantResponse>> list(
            @PathVariable Long electionId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "source", required = false) String source,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "submittedAt,desc") String sort) {

        Pageable pageable = toPageable(page, size, sort);

        ApplicantStatus statusEnum = null;
        if (status != null) {
            try { statusEnum = ApplicantStatus.valueOf(status); }
            catch (IllegalArgumentException ex) { throw new IllegalArgumentException("Invalid status: " + status); }
        }

        ApplicantSource sourceEnum = null;
        if (source != null) {
            try { sourceEnum = ApplicantSource.valueOf(source); }
            catch (IllegalArgumentException ex) { throw new IllegalArgumentException("Invalid source: " + source); }
        }

        var result = applicantService.listApplicants(electionId, statusEnum, sourceEnum, pageable)
                .map(ElectionApplicantResponse::fromEntity);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/pending")
    public ResponseEntity<Page<ElectionApplicantResponse>> listPending(
            @PathVariable Long electionId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "submittedAt,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = applicantService.listPendingApplicants(electionId, pageable)
                .map(ElectionApplicantResponse::fromEntity);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/count")
    public ResponseEntity<java.util.Map<String, Long>> count(
            @PathVariable Long electionId,
            @RequestParam(name = "status") String status) {
        ApplicantStatus st;
        try { st = ApplicantStatus.valueOf(status); }
        catch (IllegalArgumentException ex) { throw new IllegalArgumentException("Invalid status: " + status); }
        long count = applicantService.countApplicantsByStatus(electionId, st);
        return ResponseEntity.ok(java.util.Map.of("count", count));
    }

    private Pageable toPageable(int page, int size, String sort) {
        String[] parts = sort.split(",", 2);
        String field = parts.length > 0 ? parts[0] : "submittedAt";
        String direction = parts.length > 1 ? parts[1] : "desc";
        Sort s = direction.equalsIgnoreCase("asc") ? Sort.by(field).ascending() : Sort.by(field).descending();
        return PageRequest.of(page, size, s);
    }
}
