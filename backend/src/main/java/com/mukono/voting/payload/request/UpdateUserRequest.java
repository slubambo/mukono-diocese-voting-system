package com.mukono.voting.payload.request;

import java.util.Set;

public class UpdateUserRequest {

    private String email;

    private String status; // ACTIVE, DISABLED

    private Set<String> roles; // Optional: update roles

    private Long personId; // Optional: link/unlink person (null to unlink)

    private String password; // Optional: update password

    public UpdateUserRequest() {
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

    public Long getPersonId() {
        return personId;
    }

    public void setPersonId(Long personId) {
        this.personId = personId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
