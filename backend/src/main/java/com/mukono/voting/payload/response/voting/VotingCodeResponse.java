package com.mukono.voting.payload.response.voting;

import java.time.LocalDateTime;

/**
 * Response DTO for voting code information.
 * Does not expose internal audit fields unless required.
 */
public class VotingCodeResponse {

    private Long id;
    private Long electionId;
    private Long votingPeriodId;
    private Long personId;
    private String code;
    private String status;
    private Long issuedById;
    private LocalDateTime issuedAt;
    private LocalDateTime usedAt;
    private LocalDateTime revokedAt;
    private Long revokedById;
    private String remarks;

    public VotingCodeResponse() {
    }

    public VotingCodeResponse(Long id, Long electionId, Long votingPeriodId, Long personId,
                             String code, String status, Long issuedById, LocalDateTime issuedAt,
                             LocalDateTime usedAt, LocalDateTime revokedAt, Long revokedById,
                             String remarks) {
        this.id = id;
        this.electionId = electionId;
        this.votingPeriodId = votingPeriodId;
        this.personId = personId;
        this.code = code;
        this.status = status;
        this.issuedById = issuedById;
        this.issuedAt = issuedAt;
        this.usedAt = usedAt;
        this.revokedAt = revokedAt;
        this.revokedById = revokedById;
        this.remarks = remarks;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getElectionId() {
        return electionId;
    }

    public void setElectionId(Long electionId) {
        this.electionId = electionId;
    }

    public Long getVotingPeriodId() {
        return votingPeriodId;
    }

    public void setVotingPeriodId(Long votingPeriodId) {
        this.votingPeriodId = votingPeriodId;
    }

    public Long getPersonId() {
        return personId;
    }

    public void setPersonId(Long personId) {
        this.personId = personId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getIssuedById() {
        return issuedById;
    }

    public void setIssuedById(Long issuedById) {
        this.issuedById = issuedById;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    public Long getRevokedById() {
        return revokedById;
    }

    public void setRevokedById(Long revokedById) {
        this.revokedById = revokedById;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
