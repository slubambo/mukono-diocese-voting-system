package com.mukono.voting.payload.response;

import com.mukono.voting.model.leadership.PositionTitle;

/**
 * Lightweight summary of a position title for nesting in responses.
 */
public class PositionTitleSummary {
    private Long id;
    private String name;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public static PositionTitleSummary fromEntity(PositionTitle e) {
        PositionTitleSummary dto = new PositionTitleSummary();
        dto.setId(e.getId());
        dto.setName(e.getName());
        return dto;
    }
}
