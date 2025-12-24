package com.mukono.voting.payload.response;

import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.ElectionStatus;
import com.mukono.voting.model.leadership.PositionScope;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Full response DTO for elections with all details.
 * Includes organization summaries and target information.
 */
public class ElectionResponse {
    private Long id;
    private String name;
    private String description;
    private ElectionStatus status;
    private PositionScope scope;

    // IDs for quick reference (data used to save)
    private Long fellowshipId;
    private Long dioceseId;
    private Long archdeaconryId;
    private Long churchId;

    // Fellowship summary
    private FellowshipSummary fellowship;

    // Target organization (only one populated based on scope)
    private DioceseSummary diocese;
    private ArchdeaconrySummary archdeaconry;
    private ChurchSummary church;

    // Term dates
    private LocalDate termStartDate;
    private LocalDate termEndDate;

    // Windows
    private Instant nominationStartAt;
    private Instant nominationEndAt;
    private Instant votingStartAt;
    private Instant votingEndAt;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ElectionStatus getStatus() { return status; }
    public void setStatus(ElectionStatus status) { this.status = status; }

    public PositionScope getScope() { return scope; }
    public void setScope(PositionScope scope) { this.scope = scope; }

    public Long getFellowshipId() { return fellowshipId; }
    public void setFellowshipId(Long fellowshipId) { this.fellowshipId = fellowshipId; }

    public Long getDioceseId() { return dioceseId; }
    public void setDioceseId(Long dioceseId) { this.dioceseId = dioceseId; }

    public Long getArchdeaconryId() { return archdeaconryId; }
    public void setArchdeaconryId(Long archdeaconryId) { this.archdeaconryId = archdeaconryId; }

    public Long getChurchId() { return churchId; }
    public void setChurchId(Long churchId) { this.churchId = churchId; }

    public FellowshipSummary getFellowship() { return fellowship; }
    public void setFellowship(FellowshipSummary fellowship) { this.fellowship = fellowship; }

    public DioceseSummary getDiocese() { return diocese; }
    public void setDiocese(DioceseSummary diocese) { this.diocese = diocese; }

    public ArchdeaconrySummary getArchdeaconry() { return archdeaconry; }
    public void setArchdeaconry(ArchdeaconrySummary archdeaconry) { this.archdeaconry = archdeaconry; }

    public ChurchSummary getChurch() { return church; }
    public void setChurch(ChurchSummary church) { this.church = church; }

    public LocalDate getTermStartDate() { return termStartDate; }
    public void setTermStartDate(LocalDate termStartDate) { this.termStartDate = termStartDate; }

    public LocalDate getTermEndDate() { return termEndDate; }
    public void setTermEndDate(LocalDate termEndDate) { this.termEndDate = termEndDate; }

    public Instant getNominationStartAt() { return nominationStartAt; }
    public void setNominationStartAt(Instant nominationStartAt) { this.nominationStartAt = nominationStartAt; }

    public Instant getNominationEndAt() { return nominationEndAt; }
    public void setNominationEndAt(Instant nominationEndAt) { this.nominationEndAt = nominationEndAt; }

    public Instant getVotingStartAt() { return votingStartAt; }
    public void setVotingStartAt(Instant votingStartAt) { this.votingStartAt = votingStartAt; }

    public Instant getVotingEndAt() { return votingEndAt; }
    public void setVotingEndAt(Instant votingEndAt) { this.votingEndAt = votingEndAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static ElectionResponse fromEntity(Election election) {
        ElectionResponse response = new ElectionResponse();
        response.setId(election.getId());
        response.setName(election.getName());
        response.setDescription(election.getDescription());
        response.setStatus(election.getStatus());
        response.setScope(election.getScope());

        // IDs - include full hierarchy for editing context
        response.setFellowshipId(election.getFellowship() != null ? election.getFellowship().getId() : null);
        
        // Populate IDs based on scope and traverse hierarchy
        if (election.getChurch() != null) {
            // Church scope: church -> archdeaconry -> diocese
            response.setChurchId(election.getChurch().getId());
            if (election.getChurch().getArchdeaconry() != null) {
                response.setArchdeaconryId(election.getChurch().getArchdeaconry().getId());
                if (election.getChurch().getArchdeaconry().getDiocese() != null) {
                    response.setDioceseId(election.getChurch().getArchdeaconry().getDiocese().getId());
                }
            }
        } else if (election.getArchdeaconry() != null) {
            // Archdeaconry scope: archdeaconry -> diocese
            response.setArchdeaconryId(election.getArchdeaconry().getId());
            if (election.getArchdeaconry().getDiocese() != null) {
                response.setDioceseId(election.getArchdeaconry().getDiocese().getId());
            }
        } else if (election.getDiocese() != null) {
            // Diocese scope: just diocese
            response.setDioceseId(election.getDiocese().getId());
        }

        // Fellowship summary
        if (election.getFellowship() != null) {
            response.setFellowship(FellowshipSummary.fromEntity(election.getFellowship()));
        }

        // Target organization
        if (election.getDiocese() != null) {
            response.setDiocese(DioceseSummary.fromEntity(election.getDiocese()));
        }
        if (election.getArchdeaconry() != null) {
            response.setArchdeaconry(ArchdeaconrySummary.fromEntity(election.getArchdeaconry()));
        }
        if (election.getChurch() != null) {
            response.setChurch(ChurchSummary.fromEntity(election.getChurch()));
        }

        // Term dates
        response.setTermStartDate(election.getTermStartDate());
        response.setTermEndDate(election.getTermEndDate());

        // Windows
        response.setNominationStartAt(election.getNominationStartAt());
        response.setNominationEndAt(election.getNominationEndAt());
        response.setVotingStartAt(election.getVotingStartAt());
        response.setVotingEndAt(election.getVotingEndAt());

        // Audit
        response.setCreatedAt(election.getCreatedAt());
        response.setUpdatedAt(election.getUpdatedAt());

        return response;
    }
}