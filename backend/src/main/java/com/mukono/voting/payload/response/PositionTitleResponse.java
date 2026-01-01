package com.mukono.voting.payload.response;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.PositionTitle;

import java.time.Instant;

/**
 * Full response DTO for a position title.
 */
public class PositionTitleResponse {
    private Long id;
    private String name;
    private RecordStatus status;
    private Long usageCount;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
    public Long getUsageCount() { return usageCount; }
    public void setUsageCount(Long usageCount) { this.usageCount = usageCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static PositionTitleResponse fromEntity(PositionTitle e) {
        PositionTitleResponse dto = new PositionTitleResponse();
        dto.setId(e.getId());
        dto.setName(e.getName());
        dto.setStatus(e.getStatus());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }

    public static PositionTitleResponse fromEntity(PositionTitle e, Long usageCount) {
        PositionTitleResponse dto = fromEntity(e);
        dto.setUsageCount(usageCount);
        return dto;
    }
}
