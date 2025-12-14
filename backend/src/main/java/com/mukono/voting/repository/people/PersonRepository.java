package com.mukono.voting.repository.people;

import com.mukono.voting.model.people.Person;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PersonRepository extends JpaRepository<Person, Long> {

    Optional<Person> findByEmail(String email);

    Optional<Person> findByPhoneNumber(String phoneNumber);

    Page<Person> findByFullNameContainingIgnoreCase(String fullName, Pageable pageable);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);
}
