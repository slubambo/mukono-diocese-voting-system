package com.mukono.voting.api.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to run a tally.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RunTallyRequest {
    private String remarks; // max 1000
    private Boolean force = false; // allow tally even if period not CLOSED
}
