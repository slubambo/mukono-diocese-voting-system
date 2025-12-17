package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VoteLoginRequest {

    @NotBlank(message = "Code must not be blank")
    @Size(min = 6, max = 32, message = "Code length must be between 6 and 32 characters")
    private String code;

    public VoteLoginRequest() {}

    public VoteLoginRequest(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
