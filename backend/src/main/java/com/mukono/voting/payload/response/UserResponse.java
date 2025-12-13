package com.mukono.voting.payload.response;

import java.util.Set;

public class UserResponse {

    private Long id;

    private String username;

    private String email;

    private String status;

    private Set<String> roles;

    private PersonResponse person; // Optional: linked person

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String email, String status, Set<String> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.status = status;
        this.roles = roles;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public PersonResponse getPerson() {
        return person;
    }

    public void setPerson(PersonResponse person) {
        this.person = person;
    }
}
