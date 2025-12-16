package com.mukono.voting.repository.leadership;

import com.mukono.voting.model.leadership.FellowshipPosition;
import com.mukono.voting.model.leadership.PositionScope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for FellowshipPosition entity.
 * Provides methods to manage leadership positions within fellowships.
 */
@Repository
public interface FellowshipPositionRepository extends JpaRepository<FellowshipPosition, Long> {

    /**
     * Check if a fellowship position with the given fellowship, scope, and title already exists.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope
     * @param titleId the position title ID
     * @return true if a matching position exists, false otherwise
     */
    boolean existsByFellowshipIdAndScopeAndTitleId(Long fellowshipId, PositionScope scope, Long titleId);

    /**
     * Find all positions for a specific fellowship.
     * 
     * @param fellowshipId the fellowship ID
     * @param pageable pagination information
     * @return a page of fellowship positions
     */
    Page<FellowshipPosition> findByFellowshipId(Long fellowshipId, Pageable pageable);

    /**
     * Find all positions for a specific fellowship and scope.
     * 
     * @param fellowshipId the fellowship ID
     * @param scope the position scope
     * @param pageable pagination information
     * @return a page of fellowship positions
     */
    Page<FellowshipPosition> findByFellowshipIdAndScope(Long fellowshipId, PositionScope scope, Pageable pageable);
}
