package com.mukono.voting.api.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents vote results for a single candidate in a position.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CandidateResultsResponse {
    private Long candidateId;
    private Long personId;
    private String fullName;
    private Long voteCount;
    private Double voteSharePercent; // null if no votes in position
}
