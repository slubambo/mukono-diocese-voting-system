package com.mukono.voting.payload.response.tally;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.LeadershipAssignment;
import com.mukono.voting.payload.response.FellowshipPositionResponse;
import com.mukono.voting.payload.response.FellowshipSummary;
import com.mukono.voting.payload.response.PersonSummary;

import java.time.LocalDate;

/**
 * Response DTO for leadership assignments created during result certification.
 */
public class CertifiedLeadershipAssignmentResponse {
    private Long id;
    private PersonSummary person;
    private FellowshipPositionResponse fellowshipPosition;
    private FellowshipSummary fellowship;
    private LocalDate termStartDate;
    private LocalDate termEndDate;
    private RecordStatus status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PersonSummary getPerson() { return person; }
    public void setPerson(PersonSummary person) { this.person = person; }
    public FellowshipPositionResponse getFellowshipPosition() { return fellowshipPosition; }
    public void setFellowshipPosition(FellowshipPositionResponse fellowshipPosition) { this.fellowshipPosition = fellowshipPosition; }
    public FellowshipSummary getFellowship() { return fellowship; }
    public void setFellowship(FellowshipSummary fellowship) { this.fellowship = fellowship; }
    public LocalDate getTermStartDate() { return termStartDate; }
    public void setTermStartDate(LocalDate termStartDate) { this.termStartDate = termStartDate; }
    public LocalDate getTermEndDate() { return termEndDate; }
    public void setTermEndDate(LocalDate termEndDate) { this.termEndDate = termEndDate; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }

    public static CertifiedLeadershipAssignmentResponse fromEntity(LeadershipAssignment assignment) {
        CertifiedLeadershipAssignmentResponse dto = new CertifiedLeadershipAssignmentResponse();
        dto.setId(assignment.getId());
        dto.setPerson(PersonSummary.fromEntity(assignment.getPerson()));
        dto.setFellowshipPosition(FellowshipPositionResponse.fromEntity(assignment.getFellowshipPosition()));
        dto.setFellowship(FellowshipSummary.fromEntity(assignment.getFellowshipPosition().getFellowship()));
        dto.setTermStartDate(assignment.getTermStartDate());
        dto.setTermEndDate(assignment.getTermEndDate());
        dto.setStatus(assignment.getStatus());
        return dto;
    }
}
