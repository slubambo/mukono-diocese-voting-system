package com.mukono.voting.controller.ds;

import com.mukono.voting.payload.request.AddElectionPositionRequest;
import com.mukono.voting.payload.response.ElectionPositionResponse;
import com.mukono.voting.service.election.ElectionPositionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for election position management. Provides endpoints to add,
 * remove, and list positions within elections.
 */
@RestController
@RequestMapping("/api/v1/ds/elections/{electionId}/positions")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsElectionPositionController {

	private final ElectionPositionService electionPositionService;

	public DsElectionPositionController(ElectionPositionService electionPositionService) {
		this.electionPositionService = electionPositionService;
	}

	/**
	 * Add a position to an election.
	 * 
	 * @param electionId the election ID
	 * @param request    the add position request
	 * @return 201 Created with election position response
	 */
	@PostMapping
	public ResponseEntity<ElectionPositionResponse> addPosition(@PathVariable Long electionId,
			@Valid @RequestBody AddElectionPositionRequest request) {

		var electionPosition = electionPositionService.addPosition(electionId, request.getFellowshipPositionId(),
				request.getSeats());
		return ResponseEntity.status(201).body(ElectionPositionResponse.fromEntity(electionPosition));
	}

	/**
	 * List all positions for an election with pagination.
	 * 
	 * @param electionId the election ID
	 * @param page       page number (default 0)
	 * @param size       page size (default 20)
	 * @param sort       sort field and direction (default id,desc)
	 * @return 200 OK with page of election positions
	 */
	@GetMapping
	public ResponseEntity<Page<ElectionPositionResponse>> listPositions(@PathVariable Long electionId,
			@RequestParam(name = "page", defaultValue = "0") int page,
			@RequestParam(name = "size", defaultValue = "20") int size,
			@RequestParam(name = "sort", defaultValue = "id,desc") String sort) {

		Pageable pageable = toPageable(page, size, sort);
		var result = electionPositionService.listPositions(electionId, pageable)
				.map(electionPositionService::toEnrichedResponse);
		return ResponseEntity.ok(result);
	}

	/**
	 * Get a specific position within an election.
	 * 
	 * @param electionId           the election ID
	 * @param fellowshipPositionId the fellowship position ID
	 * @return 200 OK with election position response
	 */
	@GetMapping("/{fellowshipPositionId}")
	public ResponseEntity<ElectionPositionResponse> getPosition(@PathVariable Long electionId,
			@PathVariable Long fellowshipPositionId) {

		var electionPosition = electionPositionService.getByElectionAndFellowshipPosition(electionId,
				fellowshipPositionId);
		return ResponseEntity.ok(electionPositionService.toEnrichedResponse(electionPosition));
	}

	/**
	 * Remove a position from an election.
	 * 
	 * @param electionId           the election ID
	 * @param fellowshipPositionId the fellowship position ID
	 * @return 204 No Content
	 */
	@DeleteMapping("/{fellowshipPositionId}")
	public ResponseEntity<Void> removePosition(@PathVariable Long electionId, @PathVariable Long fellowshipPositionId) {

		electionPositionService.removePosition(electionId, fellowshipPositionId);
		return ResponseEntity.noContent().build();
	}

	/**
	 * Helper method to convert page parameters to Pageable.
	 */
	private Pageable toPageable(int page, int size, String sort) {
		String[] parts = sort.split(",", 2);
		String field = parts.length > 0 ? parts[0] : "id";
		String direction = parts.length > 1 ? parts[1] : "desc";
		Sort s = direction.equalsIgnoreCase("asc") ? Sort.by(field).ascending() : Sort.by(field).descending();
		return PageRequest.of(page, size, s);
	}
}
