package com.mukono.voting.api.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response from running a tally.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RunTallyResponse {
    private Long tallyRunId;
    private String status; // COMPLETED, FAILED
    private Long electionId;
    private Long votingPeriodId;
    private Integer totalPositionsTallied;
    private Integer totalWinnersApplied;
    private Integer tiesDetectedCount;
    private Instant serverTime;
    private String message; // e.g., "Tally already completed" for idempotent case
}
