package com.mukono.voting.api.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Rollback response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RollbackTallyResponse {
    private Long tallyRunId;
    private String status; // ROLLED_BACK
    private Integer winnersRemoved;
    private Instant rolledBackAt;
    private String message;
}
