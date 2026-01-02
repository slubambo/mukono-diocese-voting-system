package com.mukono.voting.payload.response;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Church;

import java.time.Instant;

public class ChurchResponse {
    private Long id;
    private String name;
    private String code;
    private RecordStatus status;
    private ArchdeaconrySummary archdeaconry;
    private DioceseSummary diocese;
    private Long currentLeadersCount;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
    public ArchdeaconrySummary getArchdeaconry() { return archdeaconry; }
    public void setArchdeaconry(ArchdeaconrySummary archdeaconry) { this.archdeaconry = archdeaconry; }
    public DioceseSummary getDiocese() { return diocese; }
    public void setDiocese(DioceseSummary diocese) { this.diocese = diocese; }
    public Long getCurrentLeadersCount() { return currentLeadersCount; }
    public void setCurrentLeadersCount(Long currentLeadersCount) { this.currentLeadersCount = currentLeadersCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static ChurchResponse fromEntity(Church c) {
        ChurchResponse dto = new ChurchResponse();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setCode(c.getCode());
        dto.setStatus(c.getStatus());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        dto.setArchdeaconry(c.getArchdeaconry() != null ? ArchdeaconrySummary.fromEntity(c.getArchdeaconry()) : null);
        dto.setDiocese(c.getArchdeaconry() != null && c.getArchdeaconry().getDiocese() != null 
            ? DioceseSummary.fromEntity(c.getArchdeaconry().getDiocese()) : null);
        return dto;
    }

    public static ChurchResponse fromEntity(Church c, Long currentLeadersCount) {
        ChurchResponse dto = fromEntity(c);
        dto.setCurrentLeadersCount(currentLeadersCount);
        return dto;
    }
}
