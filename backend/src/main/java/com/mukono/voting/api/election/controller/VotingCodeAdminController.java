package com.mukono.voting.api.election.controller;

import com.mukono.voting.api.common.dto.CountResponse;
import com.mukono.voting.api.common.dto.PagedResponse;
import com.mukono.voting.api.election.dto.IssueVotingCodeRequest;
import com.mukono.voting.api.election.dto.RegenerateVotingCodeRequest;
import com.mukono.voting.api.election.dto.VotingCodeResponse;
import com.mukono.voting.model.election.VotingCode;
import com.mukono.voting.model.election.VotingCodeStatus;
import com.mukono.voting.service.election.VotingCodeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for voting code administration.
 * 
 * Endpoints for DS/Polling Officers to manage voting codes:
 * - Issue voting codes to eligible voters
 * - Regenerate voting codes (lost/expired)
 * - Revoke voting codes
 * - List voting codes (paginated)
 * - Count voting codes
 * 
 * Security: Requires ROLE_DS or ROLE_POLLING_OFFICER (enforced elsewhere)
 * 
 * Base Path: /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/codes
 */
@RestController
@RequestMapping("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/codes")
@Validated
public class VotingCodeAdminController {

    private final VotingCodeService votingCodeService;

    @Autowired
    public VotingCodeAdminController(VotingCodeService votingCodeService) {
        this.votingCodeService = votingCodeService;
    }

    /**
     * Issue a new voting code to an eligible voter.
     * 
     * POST /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/codes
     * 
     * Request Body:
     * {
     *   "personId": 123,
     *   "remarks": "Issued at polling station A"
     * }
     * 
     * Response: 201 Created
     * {
     *   "id": 1,
     *   "code": "A3K7P2QW9R",
     *   "status": "ACTIVE",
     *   ...
     * }
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param request the issue request
     * @return the issued voting code
     */
    @PostMapping
    public ResponseEntity<VotingCodeResponse> issueCode(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting period ID is required") Long votingPeriodId,
            @Valid @RequestBody IssueVotingCodeRequest request) {
        
        // TODO: Get issuedByPersonId from security context
        // For now, use personId from request (will be replaced with authenticated user)
        Long issuedByPersonId = request.getPersonId(); // TEMP: Replace with auth context
        
        VotingCode votingCode = votingCodeService.issueCode(
                electionId,
                votingPeriodId,
                request.getPersonId(),
                issuedByPersonId,
                request.getRemarks()
        );
        
        VotingCodeResponse response = mapToResponse(votingCode);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Regenerate a voting code for a voter (revokes old, issues new).
     * 
     * POST /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/codes/regenerate
     * 
     * Request Body:
     * {
     *   "personId": 123,
     *   "reason": "Lost code"
     * }
     * 
     * Response: 201 Created
     * {
     *   "id": 2,
     *   "code": "Q7R3M9K2WA",
     *   "status": "ACTIVE",
     *   ...
     * }
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param request the regenerate request
     * @return the new voting code
     */
    @PostMapping("/regenerate")
    public ResponseEntity<VotingCodeResponse> regenerateCode(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting period ID is required") Long votingPeriodId,
            @Valid @RequestBody RegenerateVotingCodeRequest request) {
        
        // TODO: Get issuedByPersonId from security context
        Long issuedByPersonId = request.getPersonId(); // TEMP: Replace with auth context
        
        VotingCode votingCode = votingCodeService.regenerateCode(
                electionId,
                votingPeriodId,
                request.getPersonId(),
                issuedByPersonId,
                request.getReason()
        );
        
        VotingCodeResponse response = mapToResponse(votingCode);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Revoke a voting code.
     * 
     * DELETE /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/codes/{codeId}
     * 
     * Query Parameter: reason (optional)
     * 
     * Response: 204 No Content
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param codeId the voting code ID
     * @param reason optional reason for revocation
     * @return 204 No Content
     */
    @DeleteMapping("/{codeId}")
    public ResponseEntity<Void> revokeCode(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting period ID is required") Long votingPeriodId,
            @PathVariable @NotNull(message = "Code ID is required") Long codeId,
            @RequestParam(required = false) String reason) {
        
        // TODO: Get revokedByPersonId from security context
        Long revokedByPersonId = 1L; // TEMP: Replace with auth context
        
        votingCodeService.revokeCode(codeId, revokedByPersonId, reason);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * List voting codes for an election + voting period (paginated).
     * 
     * GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/codes
     * 
     * Query Parameters:
     * - page (default 0)
     * - size (default 20)
     * - status (optional: ACTIVE, USED, REVOKED, EXPIRED)
     * - sort (default: issuedAt,desc)
     * 
     * Response: 200 OK
     * {
     *   "content": [...],
     *   "page": 0,
     *   "size": 20,
     *   "totalElements": 100,
     *   "totalPages": 5,
     *   "last": false
     * }
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param status optional status filter
     * @param pageable pagination information
     * @return paginated list of voting codes
     */
    @GetMapping
    public ResponseEntity<PagedResponse<VotingCodeResponse>> listCodes(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting period ID is required") Long votingPeriodId,
            @RequestParam(required = false) VotingCodeStatus status,
            @PageableDefault(size = 20, sort = "issuedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<VotingCode> page = votingCodeService.listCodes(
                electionId,
                votingPeriodId,
                status,
                pageable
        );
        
        Page<VotingCodeResponse> responsePage = page.map(this::mapToResponse);
        PagedResponse<VotingCodeResponse> response = PagedResponse.from(responsePage);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Count voting codes for an election + voting period.
     * 
     * GET /api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/codes/count
     * 
     * Query Parameters:
     * - status (optional: ACTIVE, USED, REVOKED, EXPIRED)
     * 
     * Response: 200 OK
     * {
     *   "count": 100
     * }
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param status optional status filter
     * @return count of voting codes
     */
    @GetMapping("/count")
    public ResponseEntity<CountResponse> countCodes(
            @PathVariable @NotNull(message = "Election ID is required") Long electionId,
            @PathVariable @NotNull(message = "Voting period ID is required") Long votingPeriodId,
            @RequestParam(required = false) VotingCodeStatus status) {
        
        long count = votingCodeService.countCodes(electionId, votingPeriodId, status);
        CountResponse response = new CountResponse(count);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Map VotingCode entity to VotingCodeResponse DTO (no entity leakage).
     */
    private VotingCodeResponse mapToResponse(VotingCode code) {
        return new VotingCodeResponse(
                code.getId(),
                code.getElection().getId(),
                code.getVotingPeriod().getId(),
                code.getPerson().getId(),
                code.getCode(),
                code.getStatus().toString(),
                code.getIssuedBy().getId(),
                code.getIssuedAt(),
                code.getUsedAt(),
                code.getRevokedAt(),
                code.getRevokedBy() != null ? code.getRevokedBy().getId() : null,
                code.getRemarks()
        );
    }
}
