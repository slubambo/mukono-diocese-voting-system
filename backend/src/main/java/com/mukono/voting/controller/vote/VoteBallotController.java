package com.mukono.voting.controller.vote;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mukono.voting.payload.response.BallotResponse;
import com.mukono.voting.security.VoterPrincipal;
import com.mukono.voting.service.vote.BallotService;

/**
 * Controller for voter-facing ballot operations. Requires ROLE_VOTER
 * authentication.
 */
@RestController
@RequestMapping("/api/v1/vote")
@PreAuthorize("hasRole('VOTER')")
public class VoteBallotController {

	private final BallotService ballotService;

	public VoteBallotController(BallotService ballotService) {
		this.ballotService = ballotService;
	}

	/**
	 * Get the ballot for the authenticated voter. Returns positions and candidates
	 * filtered by voter eligibility.
	 * 
	 * @param authentication the authenticated voter principal
	 * @return ballot response with positions and candidates
	 */
	@GetMapping("/ballot")
	public ResponseEntity<BallotResponse> getBallot(Authentication authentication) {
		// Extract voter claims from authenticated principal
		VoterPrincipal voter = (VoterPrincipal) authentication.getPrincipal();

		Long personId = voter.getPersonId();
		Long electionId = voter.getElectionId();
		Long votingPeriodId = voter.getVotingPeriodId();

		// Get ballot from service
		BallotResponse ballot = ballotService.getBallot(personId, electionId, votingPeriodId);

		return ResponseEntity.ok(ballot);
	}
}
