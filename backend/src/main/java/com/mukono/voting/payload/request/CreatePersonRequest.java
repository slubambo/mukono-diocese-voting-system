package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class CreatePersonRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String email;

    private String phoneNumber;

    private String gender; // MALE, FEMALE, OTHER

    private LocalDate dateOfBirth;

    public CreatePersonRequest() {
    }

    public CreatePersonRequest(String fullName) {
        this.fullName = fullName;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }
}
