package com.mukono.voting.repository.org;

import com.mukono.voting.model.org.Church;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Church entity.
 * Provides standard CRUD and custom query methods.
 */
public interface ChurchRepository extends JpaRepository<Church, Long> {

    /**
     * Find all churches by archdeaconry id.
     * 
     * @param archdeaconryId the archdeaconry id
     * @return list of churches
     */
    List<Church> findByArchdeaconryId(Long archdeaconryId);

    /**
     * Find churches by archdeaconry id and name containing (case-insensitive).
     * 
     * @param archdeaconryId the archdeaconry id
     * @param name the name search term
     * @param pageable pagination information
     * @return page of churches matching criteria
     */
    @Query("SELECT c FROM Church c WHERE c.archdeaconry.id = :archdeaconryId AND LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Church> findByArchdeaconryIdAndNameContainingIgnoreCase(
        @Param("archdeaconryId") Long archdeaconryId,
        @Param("name") String name,
        Pageable pageable
    );

    /**
     * Find all churches by archdeaconry id with pagination.
     * 
     * @param archdeaconryId the archdeaconry id
     * @param pageable pagination information
     * @return page of churches
     */
    Page<Church> findByArchdeaconryId(Long archdeaconryId, Pageable pageable);

    /**
     * Find a church by archdeaconry id and name (exact match, case-insensitive).
     * 
     * @param archdeaconryId the archdeaconry id
     * @param name the church name
     * @return Optional containing the church if found
     */
    @Query("SELECT c FROM Church c WHERE c.archdeaconry.id = :archdeaconryId AND LOWER(c.name) = LOWER(:name)")
    Optional<Church> findByArchdeaconryIdAndNameIgnoreCase(
        @Param("archdeaconryId") Long archdeaconryId,
        @Param("name") String name
    );

    /**
     * Count active churches in an archdeaconry.
     * 
     * @param archdeaconryId the archdeaconry id
     * @return count of active churches
     */
    @Query("SELECT COUNT(c) FROM Church c WHERE c.archdeaconry.id = :archdeaconryId AND c.status = 'ACTIVE'")
    long countActiveByArchdeaconryId(@Param("archdeaconryId") Long archdeaconryId);
}
