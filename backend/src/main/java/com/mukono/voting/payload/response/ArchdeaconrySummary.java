package com.mukono.voting.payload.response;

import com.mukono.voting.model.org.Archdeaconry;

public class ArchdeaconrySummary {
    private Long id;
    private String name;
    private String code;
    private Long dioceseId; // nice-to-have

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Long getDioceseId() { return dioceseId; }
    public void setDioceseId(Long dioceseId) { this.dioceseId = dioceseId; }

    public static ArchdeaconrySummary fromEntity(Archdeaconry a) {
        ArchdeaconrySummary dto = new ArchdeaconrySummary();
        dto.setId(a.getId());
        dto.setName(a.getName());
        dto.setCode(a.getCode());
        dto.setDioceseId(a.getDiocese() != null ? a.getDiocese().getId() : null);
        return dto;
    }
}
