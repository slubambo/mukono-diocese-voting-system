package com.mukono.voting.payload.request.voting;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class VotePhoneVerifyRequest {

    @NotBlank(message = "last3 must not be blank")
    @Size(min = 3, max = 3, message = "last3 must be exactly 3 digits")
    @Pattern(regexp = "\\d{3}", message = "last3 must be numeric")
    private String last3;

    public VotePhoneVerifyRequest() {
    }

    public VotePhoneVerifyRequest(String last3) {
        this.last3 = last3;
    }

    public String getLast3() {
        return last3;
    }

    public void setLast3(String last3) {
        this.last3 = last3;
    }
}
