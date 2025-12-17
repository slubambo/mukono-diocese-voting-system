package com.mukono.voting.payload.response.voting;

import java.time.Instant;

/**
 * Response DTO for vote information.
 * Maps from ElectionVote entity (without nested objects).
 */
public class VoteResponse {
    private Long voteId;
    private Long electionId;
    private Long positionId;
    private Long candidateId;
    private Long voterId;
    private String status;
    private Instant castAt;
    private String source;

    public VoteResponse(Long voteId, Long electionId, Long positionId, Long candidateId, 
                       Long voterId, String status, Instant castAt, String source) {
        this.voteId = voteId;
        this.electionId = electionId;
        this.positionId = positionId;
        this.candidateId = candidateId;
        this.voterId = voterId;
        this.status = status;
        this.castAt = castAt;
        this.source = source;
    }

    public Long getVoteId() {
        return voteId;
    }

    public Long getElectionId() {
        return electionId;
    }

    public Long getPositionId() {
        return positionId;
    }

    public Long getCandidateId() {
        return candidateId;
    }

    public Long getVoterId() {
        return voterId;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCastAt() {
        return castAt;
    }

    public String getSource() {
        return source;
    }
}
