package com.mukono.voting.repository.org;

import com.mukono.voting.model.org.Diocese;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for Diocese entity.
 * Provides standard CRUD and custom query methods.
 */
public interface DioceseRepository extends JpaRepository<Diocese, Long> {

    /**
     * Find a diocese by name (case-insensitive).
     * 
     * @param name the diocese name
     * @return Optional containing the diocese if found
     */
    Optional<Diocese> findByNameIgnoreCase(String name);

    /**
     * Check if a diocese exists by name (case-insensitive).
     * 
     * @param name the diocese name
     * @return true if diocese exists with the given name
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Check if a diocese exists by code (case-insensitive).
     * 
     * @param code the diocese code
     * @return true if diocese exists with the given code
     */
    boolean existsByCodeIgnoreCase(String code);

    /**
     * Find dioceses by name containing (case-insensitive) with pagination.
     * 
     * @param q the search term
     * @param pageable pagination information
     * @return page of dioceses matching criteria
     */
    Page<Diocese> findByNameContainingIgnoreCase(String q, Pageable pageable);
}
