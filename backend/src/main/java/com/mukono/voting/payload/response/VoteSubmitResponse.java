package com.mukono.voting.payload.response;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class VoteSubmitResponse {
    private String receiptId;
    private Long electionId;
    private Long votingPeriodId;
    private Long personId;
    private Instant submittedAt;
    private List<PositionVote> positions = new ArrayList<>();

    public static class PositionVote {
        private Long positionId;
        private List<Long> candidateIds;

        public PositionVote() {}
        public PositionVote(Long positionId, List<Long> candidateIds) {
            this.positionId = positionId;
            this.candidateIds = candidateIds;
        }
        public Long getPositionId() { return positionId; }
        public void setPositionId(Long positionId) { this.positionId = positionId; }
        public List<Long> getCandidateIds() { return candidateIds; }
        public void setCandidateIds(List<Long> candidateIds) { this.candidateIds = candidateIds; }
    }

    public String getReceiptId() { return receiptId; }
    public void setReceiptId(String receiptId) { this.receiptId = receiptId; }
    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }
    public Long getVotingPeriodId() { return votingPeriodId; }
    public void setVotingPeriodId(Long votingPeriodId) { this.votingPeriodId = votingPeriodId; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public List<PositionVote> getPositions() { return positions; }
    public void setPositions(List<PositionVote> positions) { this.positions = positions; }
}
