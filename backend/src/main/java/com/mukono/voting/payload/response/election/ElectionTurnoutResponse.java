package com.mukono.voting.payload.response.election;

import java.util.List;

/**
 * Response DTO for election turnout by position.
 */
public class ElectionTurnoutResponse {
    private Long electionId;
    private List<TurnoutByPositionItem> items;

    public ElectionTurnoutResponse(Long electionId, List<TurnoutByPositionItem> items) {
        this.electionId = electionId;
        this.items = items;
    }

    public Long getElectionId() {
        return electionId;
    }

    public List<TurnoutByPositionItem> getItems() {
        return items;
    }
}
