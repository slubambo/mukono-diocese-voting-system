package com.mukono.voting.payload.request;

import com.mukono.voting.model.common.RecordStatus;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating an existing position title (all fields optional).
 */
public class UpdatePositionTitleRequest {
    @Size(max = 255, message = "Position title name must be at most 255 characters")
    private String name;

    private RecordStatus status;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
}
