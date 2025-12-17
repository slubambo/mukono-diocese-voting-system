package com.mukono.voting.payload.response.election;

/**
 * Item in turnout results (single position vote count).
 */
public class TurnoutByPositionItem {
    private Long positionId;
    private Long votes;

    public TurnoutByPositionItem(Long positionId, Long votes) {
        this.positionId = positionId;
        this.votes = votes;
    }

    public Long getPositionId() {
        return positionId;
    }

    public Long getVotes() {
        return votes;
    }
}
