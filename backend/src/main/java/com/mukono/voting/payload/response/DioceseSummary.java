package com.mukono.voting.payload.response;

import com.mukono.voting.model.org.Diocese;

public class DioceseSummary {
    private Long id;
    private String name;
    private String code;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public static DioceseSummary fromEntity(Diocese diocese) {
        DioceseSummary dto = new DioceseSummary();
        dto.setId(diocese.getId());
        dto.setName(diocese.getName());
        dto.setCode(diocese.getCode());
        return dto;
    }
}
