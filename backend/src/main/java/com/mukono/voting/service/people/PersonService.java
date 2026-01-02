package com.mukono.voting.service.people;

import com.mukono.voting.model.people.Person;
import com.mukono.voting.repository.people.PersonRepository;
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

    public Person createPerson(Person person) {
        // Convert empty strings to null to avoid unique constraint violations
        if (person.getEmail() != null && person.getEmail().isBlank()) {
            person.setEmail(null);
        }
        if (person.getPhoneNumber() != null && person.getPhoneNumber().isBlank()) {
            person.setPhoneNumber(null);
        }
        
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

    public Person updatePerson(Long id, Person updates) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Person not found"));

        if (updates.getFullName() != null && !updates.getFullName().isBlank()) {
            person.setFullName(updates.getFullName());
        }
        if (updates.getEmail() != null) {
            // Convert empty strings to null
            String email = updates.getEmail().isBlank() ? null : updates.getEmail();
            if (email != null) {
                if (!email.equals(person.getEmail()) &&
                    personRepository.existsByEmail(email)) {
                    throw new IllegalArgumentException("Email already in use");
                }
            }
            person.setEmail(email);
        }
        if (updates.getPhoneNumber() != null) {
            // Convert empty strings to null
            String phoneNumber = updates.getPhoneNumber().isBlank() ? null : updates.getPhoneNumber();
            if (phoneNumber != null) {
                if (!phoneNumber.equals(person.getPhoneNumber()) &&
                    personRepository.existsByPhoneNumber(phoneNumber)) {
                    throw new IllegalArgumentException("Phone number already in use");
                }
            }
            person.setPhoneNumber(phoneNumber);
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

    public Optional<Person> findById(Long id) { return personRepository.findById(id); }
    public Optional<Person> findByEmail(String email) { return email == null || email.isBlank() ? Optional.empty() : personRepository.findByEmail(email); }
    public Optional<Person> findByPhoneNumber(String phone) { return phone == null || phone.isBlank() ? Optional.empty() : personRepository.findByPhoneNumber(phone); }

    public Page<Person> searchByFullName(String fullName, Pageable pageable) {
        if (fullName == null || fullName.isBlank()) {
            return personRepository.findAll(pageable);
        }
        return personRepository.findByFullNameContainingIgnoreCase(fullName, pageable);
    }

    public Page<Person> getAllPeople(Pageable pageable) { return personRepository.findAll(pageable); }

    public void deletePerson(Long id) {
        if (!personRepository.existsById(id)) {
            throw new IllegalArgumentException("Person not found");
        }
        personRepository.deleteById(id);
    }
}
