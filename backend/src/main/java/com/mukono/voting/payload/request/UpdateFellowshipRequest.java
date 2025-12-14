package com.mukono.voting.payload.request;

import com.mukono.voting.model.common.RecordStatus;
import jakarta.validation.constraints.Size;

public class UpdateFellowshipRequest {
    @Size(max = 255, message = "Name must be at most 255 characters")
    private String name; // optional

    @Size(max = 255, message = "Code must be at most 255 characters")
    private String code; // optional

    private RecordStatus status; // optional

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public RecordStatus getStatus() { return status; }
    public void setStatus(RecordStatus status) { this.status = status; }
}
