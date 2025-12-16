package com.mukono.voting.payload.response;

import com.mukono.voting.model.org.Fellowship;

/**
 * Lightweight summary of a fellowship for nesting in responses.
 */
public class FellowshipSummary {
    private Long id;
    private String name;
    private String code;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public static FellowshipSummary fromEntity(Fellowship f) {
        FellowshipSummary dto = new FellowshipSummary();
        dto.setId(f.getId());
        dto.setName(f.getName());
        dto.setCode(f.getCode());
        return dto;
    }
}
