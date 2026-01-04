package com.mukono.voting.payload.response;

/**
 * Response DTO for creating a person with a leadership assignment.
 * Returns both the created person and the created assignment so UI can use either.
 */
public class PersonWithAssignmentResponse {

    private PersonResponse person;
    private LeadershipAssignmentResponse assignment;

    public PersonWithAssignmentResponse() {
    }

    public PersonWithAssignmentResponse(PersonResponse person, LeadershipAssignmentResponse assignment) {
        this.person = person;
        this.assignment = assignment;
    }

    public PersonResponse getPerson() {
        return person;
    }

    public void setPerson(PersonResponse person) {
        this.person = person;
    }

    public LeadershipAssignmentResponse getAssignment() {
        return assignment;
    }

    public void setAssignment(LeadershipAssignmentResponse assignment) {
        this.assignment = assignment;
    }
}
