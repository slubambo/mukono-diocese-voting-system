package com.mukono.voting.controller.ds;

import com.mukono.voting.payload.response.BallotPreviewResponse;
import com.mukono.voting.service.election.ElectionCandidateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ds/elections/{electionId}/ballot-preview")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsBallotPreviewController {

    private final ElectionCandidateService candidateService;

    public DsBallotPreviewController(ElectionCandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @GetMapping
    public ResponseEntity<BallotPreviewResponse> preview(
            @PathVariable Long electionId,
            @RequestParam(required = false) Long votingPeriodId,
            @RequestParam(required = false) Long electionPositionId) {
        var preview = candidateService.ballotPreview(electionId, votingPeriodId, electionPositionId);
        return ResponseEntity.ok(preview);
    }
}
