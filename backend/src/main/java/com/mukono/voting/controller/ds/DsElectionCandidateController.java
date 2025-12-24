package com.mukono.voting.controller.ds;

import com.mukono.voting.payload.request.AddCandidateDirectRequest;
import com.mukono.voting.payload.request.CreateCandidateFromApplicantRequest;
import com.mukono.voting.payload.request.RemoveCandidateRequest;
import com.mukono.voting.payload.response.ElectionCandidateResponse;
import com.mukono.voting.payload.response.BallotGroupedByPositionResponse;
import com.mukono.voting.service.election.ElectionCandidateService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ds/elections/{electionId}/candidates")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsElectionCandidateController {

    private final ElectionCandidateService candidateService;

    public DsElectionCandidateController(ElectionCandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @PostMapping("/direct")
    public ResponseEntity<ElectionCandidateResponse> addDirect(
            @PathVariable Long electionId,
            @Valid @RequestBody AddCandidateDirectRequest request) {
        var c = candidateService.addCandidateDirect(
                electionId,
                request.getElectionPositionId(),
                request.getPersonId(),
                request.getDecisionBy(),
                request.getNotes()
        );
        return ResponseEntity.status(201).body(ElectionCandidateResponse.fromEntity(c));
    }

    @PostMapping("/from-applicant")
    public ResponseEntity<ElectionCandidateResponse> fromApplicant(
            @PathVariable Long electionId,
            @Valid @RequestBody CreateCandidateFromApplicantRequest request) {
        var c = candidateService.createCandidateFromApplicant(request.getApplicantId(), request.getCreatedBy());
        return ResponseEntity.status(201).body(ElectionCandidateResponse.fromEntity(c));
    }

    @PostMapping("/generate")
    public ResponseEntity<java.util.Map<String, Integer>> generate(
            @PathVariable Long electionId,
            @RequestParam Long electionPositionId,
            @RequestParam String createdBy) {
        int created = candidateService.generateCandidatesForPosition(electionId, electionPositionId, createdBy);
        return ResponseEntity.ok(java.util.Map.of("created", created));
    }

    @GetMapping
    public ResponseEntity<Page<ElectionCandidateResponse>> list(
            @PathVariable Long electionId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "id,desc") String sort) {
        Pageable pageable = toPageable(page, size, sort);
        var result = candidateService.listCandidates(electionId, pageable).map(ElectionCandidateResponse::fromEntity);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/ballot")
    public ResponseEntity<?> ballot(
            @PathVariable Long electionId,
            @RequestParam(required = false) Long electionPositionId,
            @RequestParam(required = false) Long votingPeriodId) {
        
        // If electionPositionId is provided, return flat list for that position
        if (electionPositionId != null) {
            var list = candidateService.listCandidatesForBallot(electionId, electionPositionId)
                    .stream().map(ElectionCandidateResponse::fromEntity).toList();
            return ResponseEntity.ok(list);
        }
        
        // Otherwise, return grouped by position (optionally filtered by voting period)
        var grouped = candidateService.listBallotGroupedByPosition(electionId, votingPeriodId);
        return ResponseEntity.ok(grouped);
    }

    @DeleteMapping
    public ResponseEntity<Void> remove(
            @PathVariable Long electionId,
            @RequestParam Long electionPositionId,
            @RequestParam Long personId,
            @Valid @RequestBody(required = false) RemoveCandidateRequest request) {
        String removedBy = request != null ? request.getRemovedBy() : null;
        String notes = request != null ? request.getNotes() : null;
        candidateService.removeCandidate(electionId, electionPositionId, personId, removedBy, notes);
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
