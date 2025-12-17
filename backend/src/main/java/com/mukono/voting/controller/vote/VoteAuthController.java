package com.mukono.voting.controller.vote;

import com.mukono.voting.model.election.VotingCode;
import com.mukono.voting.payload.request.VoteLoginRequest;
import com.mukono.voting.payload.response.VoteLoginResponse;
import com.mukono.voting.security.VoterJwtService;
import com.mukono.voting.service.election.VotingCodeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/vote")
@Validated
public class VoteAuthController {

    private final VotingCodeService votingCodeService;
    private final VoterJwtService voterJwtService;

    public VoteAuthController(VotingCodeService votingCodeService, VoterJwtService voterJwtService) {
        this.votingCodeService = votingCodeService;
        this.voterJwtService = voterJwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<VoteLoginResponse> login(@Valid @RequestBody VoteLoginRequest request) {
        String code = request.getCode() != null ? request.getCode().trim() : null;

        // 2.1 Validate code first (no state change)
        VotingCode vc = votingCodeService.validateCodeSafe(code);

        Long personId = vc.getPerson().getId();
        Long electionId = vc.getElection().getId();
        Long votingPeriodId = vc.getVotingPeriod().getId();

        // 2.2 Issue voter JWT with short TTL (15 minutes)
        String token = voterJwtService.generateVoterToken(personId, electionId, votingPeriodId, Duration.ofMinutes(15), vc.getId());

        // 2.3 Mark code as used (idempotent)
        votingCodeService.markCodeUsedSafe(code);

        VoteLoginResponse response = new VoteLoginResponse(token, 900L, personId, electionId, votingPeriodId);
        return ResponseEntity.ok(response);
    }
}
