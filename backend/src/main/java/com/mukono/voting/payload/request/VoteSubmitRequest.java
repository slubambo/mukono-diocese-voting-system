package com.mukono.voting.payload.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class VoteSubmitRequest {

    @NotNull(message = "votes must not be null")
    @NotEmpty(message = "votes must not be empty")
    @Valid
    private List<VoteItem> votes;

    public List<VoteItem> getVotes() { return votes; }
    public void setVotes(List<VoteItem> votes) { this.votes = votes; }

    public static class VoteItem {
        @NotNull(message = "positionId must not be null")
        private Long positionId;

        @NotNull(message = "candidateIds must not be null")
        @NotEmpty(message = "candidateIds must not be empty")
        private List<Long> candidateIds;

        public Long getPositionId() { return positionId; }
        public void setPositionId(Long positionId) { this.positionId = positionId; }
        public List<Long> getCandidateIds() { return candidateIds; }
        public void setCandidateIds(List<Long> candidateIds) { this.candidateIds = candidateIds; }
    }
}
