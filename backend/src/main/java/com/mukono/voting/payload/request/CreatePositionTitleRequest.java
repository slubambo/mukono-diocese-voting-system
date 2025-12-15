package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating a new position title.
 */
public class CreatePositionTitleRequest {
    @NotBlank(message = "Position title name is required")
    @Size(max = 255, message = "Position title name must be at most 255 characters")
    private String name;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
