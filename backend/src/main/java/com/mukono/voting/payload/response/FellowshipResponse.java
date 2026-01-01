package com.mukono.voting.payload.response;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Fellowship;

import java.time.Instant;

public class FellowshipResponse {
    private Long id;
    private String name;
    private String code;
    private RecordStatus status;
    private Long positionsCount;
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
    public Long getPositionsCount() { return positionsCount; }
    public void setPositionsCount(Long positionsCount) { this.positionsCount = positionsCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static FellowshipResponse fromEntity(Fellowship f) {
        FellowshipResponse dto = new FellowshipResponse();
        dto.setId(f.getId());
        dto.setName(f.getName());
        dto.setCode(f.getCode());
        dto.setStatus(f.getStatus());
        dto.setCreatedAt(f.getCreatedAt());
        dto.setUpdatedAt(f.getUpdatedAt());
        return dto;
    }

    public static FellowshipResponse fromEntity(Fellowship f, Long positionsCount) {
        FellowshipResponse dto = fromEntity(f);
        dto.setPositionsCount(positionsCount);
        return dto;
    }
}
