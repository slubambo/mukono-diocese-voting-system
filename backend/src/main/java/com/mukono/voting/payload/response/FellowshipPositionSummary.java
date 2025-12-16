package com.mukono.voting.payload.response;

import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.model.leadership.FellowshipPosition;
import com.mukono.voting.model.common.RecordStatus;

/**
 * Lightweight summary of a fellowship position for nesting in assignment responses.
 */
public class FellowshipPositionSummary {
    private Long id;
    private PositionScope scope;
    private Integer seats;
    private RecordStatus status;
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
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
    public Long getFellowshipId() { return fellowshipId; }
    public void setFellowshipId(Long fellowshipId) { this.fellowshipId = fellowshipId; }
    public String getFellowshipName() { return fellowshipName; }
    public void setFellowshipName(String fellowshipName) { this.fellowshipName = fellowshipName; }
    public Long getTitleId() { return titleId; }
    public void setTitleId(Long titleId) { this.titleId = titleId; }
    public String getTitleName() { return titleName; }
    public void setTitleName(String titleName) { this.titleName = titleName; }

    public static FellowshipPositionSummary fromEntity(FellowshipPosition e) {
        FellowshipPositionSummary dto = new FellowshipPositionSummary();
        dto.setId(e.getId());
        dto.setScope(e.getScope());
        dto.setSeats(e.getSeats());
        dto.setStatus(e.getStatus());
        dto.setFellowshipId(e.getFellowship().getId());
        dto.setFellowshipName(e.getFellowship().getName());
        dto.setTitleId(e.getTitle().getId());
        dto.setTitleName(e.getTitle().getName());
        return dto;
    }
}
