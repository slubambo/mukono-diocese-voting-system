package com.mukono.voting.payload.response;

import com.mukono.voting.model.election.ElectionPosition;
import com.mukono.voting.model.leadership.PositionScope;

/**
 * Response DTO for election positions.
 */
public class ElectionPositionResponse {
    private Long id;
    private Long electionId;
    private FellowshipPositionSummary fellowshipPosition;
    private Integer seats;
    // New: convenience fields
    private PositionScope positionScope;
    private Long fellowshipId;
    private String fellowshipName;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getElectionId() { return electionId; }
    public void setElectionId(Long electionId) { this.electionId = electionId; }

    public FellowshipPositionSummary getFellowshipPosition() { return fellowshipPosition; }
    public void setFellowshipPosition(FellowshipPositionSummary fellowshipPosition) { this.fellowshipPosition = fellowshipPosition; }

    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }

    public PositionScope getPositionScope() { return positionScope; }
    public void setPositionScope(PositionScope positionScope) { this.positionScope = positionScope; }

    public Long getFellowshipId() { return fellowshipId; }
    public void setFellowshipId(Long fellowshipId) { this.fellowshipId = fellowshipId; }

    public String getFellowshipName() { return fellowshipName; }
    public void setFellowshipName(String fellowshipName) { this.fellowshipName = fellowshipName; }

    public static ElectionPositionResponse fromEntity(ElectionPosition ep) {
        ElectionPositionResponse response = new ElectionPositionResponse();
        response.setId(ep.getId());
        response.setElectionId(ep.getElection().getId());
        response.setFellowshipPosition(FellowshipPositionSummary.fromEntity(ep.getFellowshipPosition()));
        response.setSeats(ep.getSeats());
        // Populate convenience fields
        if (ep.getFellowshipPosition() != null) {
            response.setPositionScope(ep.getFellowshipPosition().getScope());
            if (ep.getFellowshipPosition().getFellowship() != null) {
                response.setFellowshipId(ep.getFellowshipPosition().getFellowship().getId());
                response.setFellowshipName(ep.getFellowshipPosition().getFellowship().getName());
            }
        }
        return response;
    }

    /**
     * Fellowship position summary DTO (nested in election position response).
     */
    public static class FellowshipPositionSummary {
        private Long id;
        private PositionScope scope;
        private Integer seats;
        private Long fellowshipId;
        private String fellowshipName;
        private Long titleId;
        private String titleName;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public PositionScope getScope() { return scope; }
        public void setScope(PositionScope scope) { this.scope = scope; }

        public Integer getSeats() { return seats; }
        public void setSeats(Integer seats) { this.seats = seats; }

        public Long getFellowshipId() { return fellowshipId; }
        public void setFellowshipId(Long fellowshipId) { this.fellowshipId = fellowshipId; }

        public String getFellowshipName() { return fellowshipName; }
        public void setFellowshipName(String fellowshipName) { this.fellowshipName = fellowshipName; }

        public Long getTitleId() { return titleId; }
        public void setTitleId(Long titleId) { this.titleId = titleId; }

        public String getTitleName() { return titleName; }
        public void setTitleName(String titleName) { this.titleName = titleName; }

        public static FellowshipPositionSummary fromEntity(com.mukono.voting.model.leadership.FellowshipPosition fp) {
            FellowshipPositionSummary s = new FellowshipPositionSummary();
            s.setId(fp.getId());
            s.setScope(fp.getScope());
            s.setSeats(fp.getSeats());
            s.setFellowshipId(fp.getFellowship().getId());
            s.setFellowshipName(fp.getFellowship().getName());
            s.setTitleId(fp.getTitle().getId());
            s.setTitleName(fp.getTitle().getName());
            return s;
        }
    }
}