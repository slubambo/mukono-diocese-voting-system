package com.mukono.voting.payload.response;

import com.mukono.voting.model.people.Person;

/**
 * Lightweight summary of a person for nesting in responses.
 */
public class PersonSummary {
    private Long id;
    private String fullName;
    private String phoneNumber;
    private String email;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public static PersonSummary fromEntity(Person e) {
        PersonSummary dto = new PersonSummary();
        dto.setId(e.getId());
        dto.setFullName(e.getFullName());
        dto.setPhoneNumber(e.getPhoneNumber());
        dto.setEmail(e.getEmail());
        return dto;
    }
}
