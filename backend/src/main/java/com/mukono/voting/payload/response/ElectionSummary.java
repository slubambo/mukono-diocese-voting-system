package com.mukono.voting.payload.response;

import com.mukono.voting.model.election.ElectionStatus;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.model.election.Election;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Summary DTO for elections (lighter weight than full ElectionResponse).
 * Used in list endpoints and nested responses.
 */
public class ElectionSummary {
    private Long id;
    private String name;
    private ElectionStatus status;
    private PositionScope scope;
    private Long fellowshipId;
    private String fellowshipName;
    private LocalDate termStartDate;
    private LocalDate termEndDate;
    private Instant votingStartAt;
    private Instant votingEndAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ElectionStatus getStatus() { return status; }
    public void setStatus(ElectionStatus status) { this.status = status; }

    public PositionScope getScope() { return scope; }
    public void setScope(PositionScope scope) { this.scope = scope; }

    public Long getFellowshipId() { return fellowshipId; }
    public void setFellowshipId(Long fellowshipId) { this.fellowshipId = fellowshipId; }

    public String getFellowshipName() { return fellowshipName; }
    public void setFellowshipName(String fellowshipName) { this.fellowshipName = fellowshipName; }

    public LocalDate getTermStartDate() { return termStartDate; }
    public void setTermStartDate(LocalDate termStartDate) { this.termStartDate = termStartDate; }

    public LocalDate getTermEndDate() { return termEndDate; }
    public void setTermEndDate(LocalDate termEndDate) { this.termEndDate = termEndDate; }

    public Instant getVotingStartAt() { return votingStartAt; }
    public void setVotingStartAt(Instant votingStartAt) { this.votingStartAt = votingStartAt; }

    public Instant getVotingEndAt() { return votingEndAt; }
    public void setVotingEndAt(Instant votingEndAt) { this.votingEndAt = votingEndAt; }

    public static ElectionSummary fromEntity(Election election) {
        ElectionSummary summary = new ElectionSummary();
        summary.setId(election.getId());
        summary.setName(election.getName());
        summary.setStatus(election.getStatus());
        summary.setScope(election.getScope());
        summary.setFellowshipId(election.getFellowship().getId());
        summary.setFellowshipName(election.getFellowship().getName());
        summary.setTermStartDate(election.getTermStartDate());
        summary.setTermEndDate(election.getTermEndDate());
        summary.setVotingStartAt(election.getVotingStartAt());
        summary.setVotingEndAt(election.getVotingEndAt());
        return summary;
    }
}
