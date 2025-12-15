package com.mukono.voting.repository.leadership;

import com.mukono.voting.model.leadership.PositionTitle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for PositionTitle entity.
 * Provides methods to manage reusable leadership position titles.
 */
@Repository
public interface PositionTitleRepository extends JpaRepository<PositionTitle, Long> {

    /**
     * Check if a position title with the given name already exists (case-insensitive).
     * 
     * @param name the position title name to check
     * @return true if a title with the given name exists, false otherwise
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Find position titles by name containing the search query (case-insensitive).
     * 
     * @param q the search query
     * @param pageable pagination information
     * @return a page of matching position titles
     */
    Page<PositionTitle> findByNameContainingIgnoreCase(String q, Pageable pageable);
}
