package com.mukono.voting.payload.response;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Diocese;

import java.time.Instant;

public class DioceseResponse {
    private Long id;
    private String name;
    private String code;
    private RecordStatus status;
    private Long archdeaconryCount;
    private Long churchCount;
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
    public Long getArchdeaconryCount() { return archdeaconryCount; }
    public void setArchdeaconryCount(Long archdeaconryCount) { this.archdeaconryCount = archdeaconryCount; }
    public Long getChurchCount() { return churchCount; }
    public void setChurchCount(Long churchCount) { this.churchCount = churchCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static DioceseResponse fromEntity(Diocese diocese) {
        DioceseResponse dto = new DioceseResponse();
        dto.setId(diocese.getId());
        dto.setName(diocese.getName());
        dto.setCode(diocese.getCode());
        dto.setStatus(diocese.getStatus());
        dto.setCreatedAt(diocese.getCreatedAt());
        dto.setUpdatedAt(diocese.getUpdatedAt());
        return dto;
    }

    public static DioceseResponse fromEntity(Diocese diocese, Long archdeaconryCount, Long churchCount) {
        DioceseResponse dto = fromEntity(diocese);
        dto.setArchdeaconryCount(archdeaconryCount);
        dto.setChurchCount(churchCount);
        return dto;
    }
}
