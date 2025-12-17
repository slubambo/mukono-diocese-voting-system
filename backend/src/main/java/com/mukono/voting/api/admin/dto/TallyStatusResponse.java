package com.mukono.voting.api.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Tally status response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TallyStatusResponse {
    private Boolean tallyExists;
    private Long tallyRunId;
    private String status;
    private Long electionId;
    private Long votingPeriodId;
    private Instant startedAt;
    private Instant completedAt;
    private Long startedByPersonId;
    private Long completedByPersonId;
    private String remarks;
    private Integer totalPositionsCertified;
    private Integer totalWinnersApplied;
}
