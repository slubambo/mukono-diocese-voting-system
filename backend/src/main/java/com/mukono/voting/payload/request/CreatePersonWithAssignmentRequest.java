package com.mukono.voting.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Request DTO for creating a person and a leadership assignment in one operation.
 * Combines person fields with assignment fields.
 */
public class CreatePersonWithAssignmentRequest {

    // Person fields
    @NotBlank(message = "Full name is required")
    private String fullName;

    private String email;

    private String phoneNumber;

    private String gender; // MALE, FEMALE, OTHER

    private LocalDate dateOfBirth;

    // Assignment fields
    @NotNull(message = "Fellowship position ID is required")
    private Long fellowshipPositionId;

    @NotNull(message = "Term start date is required")
    private LocalDate termStartDate;

    private LocalDate termEndDate;

    private Long dioceseId;

    private Long archdeaconryId;

    private Long churchId;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes;

    // Getters and Setters
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

    public Long getFellowshipPositionId() {
        return fellowshipPositionId;
    }

    public void setFellowshipPositionId(Long fellowshipPositionId) {
        this.fellowshipPositionId = fellowshipPositionId;
    }

    public LocalDate getTermStartDate() {
        return termStartDate;
    }

    public void setTermStartDate(LocalDate termStartDate) {
        this.termStartDate = termStartDate;
    }

    public LocalDate getTermEndDate() {
        return termEndDate;
    }

    public void setTermEndDate(LocalDate termEndDate) {
        this.termEndDate = termEndDate;
    }

    public Long getDioceseId() {
        return dioceseId;
    }

    public void setDioceseId(Long dioceseId) {
        this.dioceseId = dioceseId;
    }

    public Long getArchdeaconryId() {
        return archdeaconryId;
    }

    public void setArchdeaconryId(Long archdeaconryId) {
        this.archdeaconryId = archdeaconryId;
    }

    public Long getChurchId() {
        return churchId;
    }

    public void setChurchId(Long churchId) {
        this.churchId = churchId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
