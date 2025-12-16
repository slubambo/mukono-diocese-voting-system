package com.mukono.voting.payload.response;

import com.mukono.voting.model.org.Church;

/**
 * Lightweight summary of a church for nesting in responses.
 */
public class ChurchSummary {
    private Long id;
    private String name;
    private String code;
    private Long archdeaconryId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Long getArchdeaconryId() { return archdeaconryId; }
    public void setArchdeaconryId(Long archdeaconryId) { this.archdeaconryId = archdeaconryId; }

    public static ChurchSummary fromEntity(Church e) {
        ChurchSummary dto = new ChurchSummary();
        dto.setId(e.getId());
        dto.setName(e.getName());
        dto.setCode(e.getCode());
        dto.setArchdeaconryId(e.getArchdeaconry() != null ? e.getArchdeaconry().getId() : null);
        return dto;
    }
}
