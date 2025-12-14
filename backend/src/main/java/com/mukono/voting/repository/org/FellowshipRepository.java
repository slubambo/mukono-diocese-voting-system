package com.mukono.voting.repository.org;

import com.mukono.voting.model.org.Fellowship;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for Fellowship entity.
 * Provides standard CRUD and custom query methods.
 */
public interface FellowshipRepository extends JpaRepository<Fellowship, Long> {

    /**
     * Find a fellowship by name (case-insensitive).
     * 
     * @param name the fellowship name
     * @return Optional containing the fellowship if found
     */
    Optional<Fellowship> findByNameIgnoreCase(String name);

    /**
     * Check if a fellowship exists by name (case-insensitive).
     * 
     * @param name the fellowship name
     * @return true if fellowship exists with the given name
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Check if a fellowship exists by code (case-insensitive).
     * 
     * @param code the fellowship code
     * @return true if fellowship exists with the given code
     */
    boolean existsByCodeIgnoreCase(String code);

    /**
     * Find fellowships by name containing (case-insensitive) with pagination.
     * 
     * @param q the search term
     * @param pageable pagination information
     * @return page of fellowships matching criteria
     */
    Page<Fellowship> findByNameContainingIgnoreCase(String q, Pageable pageable);
}
