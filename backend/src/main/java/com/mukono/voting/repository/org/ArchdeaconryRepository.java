package com.mukono.voting.repository.org;

import com.mukono.voting.model.org.Archdeaconry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Archdeaconry entity.
 * Provides standard CRUD and custom query methods.
 */
public interface ArchdeaconryRepository extends JpaRepository<Archdeaconry, Long> {

    /**
     * Find all archdeaconries by diocese id.
     * 
     * @param dioceseId the diocese id
     * @return list of archdeaconries
     */
    List<Archdeaconry> findByDioceseId(Long dioceseId);

    /**
     * Find archdeaconries by diocese id and name containing (case-insensitive).
     * 
     * @param dioceseId the diocese id
     * @param name the name search term
     * @param pageable pagination information
     * @return page of archdeaconries matching criteria
     */
    @Query("SELECT a FROM Archdeaconry a WHERE a.diocese.id = :dioceseId AND LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Archdeaconry> findByDioceseIdAndNameContainingIgnoreCase(
        @Param("dioceseId") Long dioceseId,
        @Param("name") String name,
        Pageable pageable
    );

    /**
     * Find all archdeaconries by diocese id with pagination.
     * 
     * @param dioceseId the diocese id
     * @param pageable pagination information
     * @return page of archdeaconries in the diocese
     */
    Page<Archdeaconry> findByDioceseId(Long dioceseId, Pageable pageable);

    /**
     * Find an archdeaconry by diocese id and name (exact match, case-insensitive).
     * 
     * @param dioceseId the diocese id
     * @param name the archdeaconry name
     * @return Optional containing the archdeaconry if found
     */
    @Query("SELECT a FROM Archdeaconry a WHERE a.diocese.id = :dioceseId AND LOWER(a.name) = LOWER(:name)")
    Optional<Archdeaconry> findByDioceseIdAndNameIgnoreCase(
        @Param("dioceseId") Long dioceseId,
        @Param("name") String name
    );

    /**
     * Count active archdeaconries in a diocese.
     * 
     * @param dioceseId the diocese id
     * @return count of active archdeaconries
     */
    @Query("SELECT COUNT(a) FROM Archdeaconry a WHERE a.diocese.id = :dioceseId AND a.status = 'ACTIVE'")
    long countActiveByDioceseId(@Param("dioceseId") Long dioceseId);
}
