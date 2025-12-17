package com.mukono.voting.api.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Election results summary for a voting period.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ElectionResultsSummaryResponse {
    private Long electionId;
    private Long votingPeriodId;
    private String votingPeriodName;
    private String periodStatus; // OPEN, CLOSED, SCHEDULED, CANCELLED
    private Instant periodStartTime;
    private Instant periodEndTime;
    private Integer totalPositions;
    private Long totalBallotsCast; // VoteRecord count
    private Long totalSelectionsCast; // VoteSelection count
    private Long totalDistinctVoters; // unique personId
    private Instant serverTime;
}
