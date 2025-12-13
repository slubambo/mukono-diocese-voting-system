package com.mukono.voting.people;

import com.mukono.voting.payload.request.CreatePersonRequest;
import com.mukono.voting.payload.request.UpdatePersonRequest;
import com.mukono.voting.payload.response.PersonResponse;
import com.mukono.voting.user.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * PersonController handles REST endpoints for managing people records.
 * Access: Admin + DS can manage people records (create/update/list/search).
 */
@RestController
@RequestMapping("/api/v1/people")
public class PersonController {

    private final PersonService personService;
    private final UserService userService;

    public PersonController(PersonService personService, UserService userService) {
        this.personService = personService;
        this.userService = userService;
    }

    /**
     * Create a new person.
     * Requires ROLE_ADMIN or ROLE_DS.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DS')")
    public ResponseEntity<PersonResponse> createPerson(@Valid @RequestBody CreatePersonRequest request) {
        Person person = new Person();
        person.setFullName(request.getFullName());
        person.setEmail(request.getEmail());
        person.setPhoneNumber(request.getPhoneNumber());
        
        if (request.getGender() != null && !request.getGender().isBlank()) {
            person.setGender(Person.Gender.valueOf(request.getGender().toUpperCase()));
        }
        
        person.setDateOfBirth(request.getDateOfBirth());
        person.setStatus(Person.Status.ACTIVE);

        Person createdPerson = personService.createPerson(person);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.toPersonResponse(createdPerson));
    }

    /**
     * Update an existing person.
     * Requires ROLE_ADMIN or ROLE_DS.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DS')")
    public ResponseEntity<PersonResponse> updatePerson(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePersonRequest request) {

        Person updates = new Person();
        updates.setFullName(request.getFullName());
        updates.setEmail(request.getEmail());
        updates.setPhoneNumber(request.getPhoneNumber());
        
        if (request.getGender() != null && !request.getGender().isBlank()) {
            updates.setGender(Person.Gender.valueOf(request.getGender().toUpperCase()));
        }
        
        updates.setDateOfBirth(request.getDateOfBirth());
        
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            updates.setStatus(Person.Status.valueOf(request.getStatus().toUpperCase()));
        }

        Person updatedPerson = personService.updatePerson(id, updates);
        return ResponseEntity.ok(userService.toPersonResponse(updatedPerson));
    }

    /**
     * Get a person by ID.
     * Requires ROLE_ADMIN or ROLE_DS.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DS')")
    public ResponseEntity<PersonResponse> getPerson(@PathVariable Long id) {
        Person person = personService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Person not found"));
        return ResponseEntity.ok(userService.toPersonResponse(person));
    }

    /**
     * Search people by full name with pagination.
     * Requires ROLE_ADMIN or ROLE_DS.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DS')")
    public ResponseEntity<Page<PersonResponse>> searchPeople(
            @RequestParam(required = false) String q,
            Pageable pageable) {

        Page<Person> people = personService.searchByFullName(q, pageable);
        Page<PersonResponse> responses = people.map(userService::toPersonResponse);
        return ResponseEntity.ok(responses);
    }

    /**
     * Delete a person by ID.
     * Requires ROLE_ADMIN.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deletePerson(@PathVariable Long id) {
        personService.deletePerson(id);
        return ResponseEntity.noContent().build();
    }
}
