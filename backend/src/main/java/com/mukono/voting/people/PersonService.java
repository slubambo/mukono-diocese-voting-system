package com.mukono.voting.people;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class PersonService {

    private final PersonRepository personRepository;

    public PersonService(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    /**
     * Create a new person with validation.
     * Enforces uniqueness on email and phone number if provided.
     */
    public Person createPerson(Person person) {
        if (person.getEmail() != null && !person.getEmail().isBlank()) {
            if (personRepository.existsByEmail(person.getEmail())) {
                throw new IllegalArgumentException("Email already in use");
            }
        }
        if (person.getPhoneNumber() != null && !person.getPhoneNumber().isBlank()) {
            if (personRepository.existsByPhoneNumber(person.getPhoneNumber())) {
                throw new IllegalArgumentException("Phone number already in use");
            }
        }
        return personRepository.save(person);
    }

    /**
     * Update an existing person.
     * Enforces uniqueness on email and phone number if changed.
     */
    public Person updatePerson(Long id, Person updates) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Person not found"));

        if (updates.getFullName() != null && !updates.getFullName().isBlank()) {
            person.setFullName(updates.getFullName());
        }

        if (updates.getEmail() != null && !updates.getEmail().isBlank()) {
            if (!updates.getEmail().equals(person.getEmail()) && 
                personRepository.existsByEmail(updates.getEmail())) {
                throw new IllegalArgumentException("Email already in use");
            }
            person.setEmail(updates.getEmail());
        }

        if (updates.getPhoneNumber() != null && !updates.getPhoneNumber().isBlank()) {
            if (!updates.getPhoneNumber().equals(person.getPhoneNumber()) && 
                personRepository.existsByPhoneNumber(updates.getPhoneNumber())) {
                throw new IllegalArgumentException("Phone number already in use");
            }
            person.setPhoneNumber(updates.getPhoneNumber());
        }

        if (updates.getGender() != null) {
            person.setGender(updates.getGender());
        }

        if (updates.getDateOfBirth() != null) {
            person.setDateOfBirth(updates.getDateOfBirth());
        }

        if (updates.getStatus() != null) {
            person.setStatus(updates.getStatus());
        }

        return personRepository.save(person);
    }

    /**
     * Find a person by ID.
     */
    public Optional<Person> findById(Long id) {
        return personRepository.findById(id);
    }

    /**
     * Find a person by email.
     */
    public Optional<Person> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        return personRepository.findByEmail(email);
    }

    /**
     * Find a person by phone number.
     */
    public Optional<Person> findByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return Optional.empty();
        }
        return personRepository.findByPhoneNumber(phoneNumber);
    }

    /**
     * Search people by full name (case-insensitive) with pagination.
     */
    public Page<Person> searchByFullName(String fullName, Pageable pageable) {
        if (fullName == null || fullName.isBlank()) {
            return personRepository.findAll(pageable);
        }
        return personRepository.findByFullNameContainingIgnoreCase(fullName, pageable);
    }

    /**
     * Get all people with pagination.
     */
    public Page<Person> getAllPeople(Pageable pageable) {
        return personRepository.findAll(pageable);
    }

    /**
     * Delete a person by ID.
     */
    public void deletePerson(Long id) {
        if (!personRepository.existsById(id)) {
            throw new IllegalArgumentException("Person not found");
        }
        personRepository.deleteById(id);
    }
}
