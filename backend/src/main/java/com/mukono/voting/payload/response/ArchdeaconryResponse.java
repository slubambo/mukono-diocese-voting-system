package com.mukono.voting.payload.response;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Archdeaconry;

import java.time.Instant;

public class ArchdeaconryResponse {
    private Long id;
    private String name;
    private String code;
    private RecordStatus status;
    private DioceseSummary diocese;
    private Long churchCount;
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
    public DioceseSummary getDiocese() { return diocese; }
    public void setDiocese(DioceseSummary diocese) { this.diocese = diocese; }
    public Long getChurchCount() { return churchCount; }
    public void setChurchCount(Long churchCount) { this.churchCount = churchCount; }
    public Long getCurrentLeadersCount() { return currentLeadersCount; }
    public void setCurrentLeadersCount(Long currentLeadersCount) { this.currentLeadersCount = currentLeadersCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static ArchdeaconryResponse fromEntity(Archdeaconry a) {
        ArchdeaconryResponse dto = new ArchdeaconryResponse();
        dto.setId(a.getId());
        dto.setName(a.getName());
        dto.setCode(a.getCode());
        dto.setStatus(a.getStatus());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());
        dto.setDiocese(a.getDiocese() != null ? DioceseSummary.fromEntity(a.getDiocese()) : null);
        return dto;
    }

    public static ArchdeaconryResponse fromEntity(Archdeaconry a, Long churchCount, Long currentLeadersCount) {
        ArchdeaconryResponse dto = fromEntity(a);
        dto.setChurchCount(churchCount);
        dto.setCurrentLeadersCount(currentLeadersCount);
        return dto;
    }
}
