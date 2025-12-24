package com.mukono.voting.controller.vote;

import com.mukono.voting.payload.request.VoteSubmitRequest;
import com.mukono.voting.payload.response.VoteSubmitResponse;
import com.mukono.voting.security.VoterPrincipal;
import com.mukono.voting.service.vote.VoteSubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vote")
@PreAuthorize("hasRole('VOTER')")
public class VoteSubmissionController {

	private final VoteSubmissionService voteSubmissionService;

	public VoteSubmissionController(VoteSubmissionService voteSubmissionService) {
		this.voteSubmissionService = voteSubmissionService;
	}

	@PostMapping("/submit")
	public ResponseEntity<VoteSubmitResponse> submit(@Valid @RequestBody VoteSubmitRequest request,
			Authentication authentication) {
		VoterPrincipal voter = (VoterPrincipal) authentication.getPrincipal();
		VoteSubmitResponse resp = voteSubmissionService.submitVotes(voter.getPersonId(), voter.getElectionId(),
				voter.getVotingPeriodId(), request);
		return ResponseEntity.status(201).body(resp);
	}
}
