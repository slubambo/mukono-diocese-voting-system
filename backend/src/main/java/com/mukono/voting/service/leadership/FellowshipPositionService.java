package com.mukono.voting.service.leadership;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.FellowshipPosition;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.model.leadership.PositionTitle;
import com.mukono.voting.model.org.Fellowship;
import com.mukono.voting.repository.leadership.FellowshipPositionRepository;
import com.mukono.voting.repository.leadership.LeadershipAssignmentRepository;
import com.mukono.voting.repository.leadership.PositionTitleRepository;
import com.mukono.voting.repository.org.FellowshipRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * Service for FellowshipPosition entity.
 * Handles business logic, validation, and data access for fellowship positions.
 */
@Service
@Transactional
public class FellowshipPositionService {

    private final FellowshipPositionRepository fellowshipPositionRepository;
    private final FellowshipRepository fellowshipRepository;
    private final PositionTitleRepository positionTitleRepository;
    private final LeadershipAssignmentRepository leadershipAssignmentRepository;

    public FellowshipPositionService(
            FellowshipPositionRepository fellowshipPositionRepository,
            FellowshipRepository fellowshipRepository,
            PositionTitleRepository positionTitleRepository,
            LeadershipAssignmentRepository leadershipAssignmentRepository) {
        this.fellowshipPositionRepository = fellowshipPositionRepository;
        this.fellowshipRepository = fellowshipRepository;
        this.positionTitleRepository = positionTitleRepository;
        this.leadershipAssignmentRepository = leadershipAssignmentRepository;
    }

    /**
     * Create a new fellowship position with validation.
     * 
     * @param fellowshipId the fellowship ID (required)
     * @param titleId the position title ID (required)
     * @param scope the position scope (required)
     * @param seats number of seats (defaults to 1 if null, must be >= 1)
     * @return created FellowshipPosition entity
     * @throws IllegalArgumentException if validation fails
     */
    public FellowshipPosition create(Long fellowshipId, Long titleId, PositionScope scope, Integer seats) {
        // Validate fellowship exists
        if (fellowshipId == null) {
            throw new IllegalArgumentException("Fellowship ID is required");
        }
        Fellowship fellowship = fellowshipRepository.findById(fellowshipId)
            .orElseThrow(() -> new IllegalArgumentException("Fellowship with ID " + fellowshipId + " not found"));

        // Validate title exists
        if (titleId == null) {
            throw new IllegalArgumentException("Position title ID is required");
        }
        PositionTitle title = positionTitleRepository.findById(titleId)
            .orElseThrow(() -> new IllegalArgumentException("Position title with ID " + titleId + " not found"));

        // Validate scope
        if (scope == null) {
            throw new IllegalArgumentException("Position scope is required");
        }

        // Validate and set default seats
        Integer finalSeats = seats != null ? seats : 1;
        if (finalSeats < 1) {
            throw new IllegalArgumentException("Number of seats must be at least 1");
        }

        // Check for duplicates (fellowship + scope + title combination)
        if (fellowshipPositionRepository.existsByFellowshipIdAndScopeAndTitleId(fellowshipId, scope, titleId)) {
            throw new IllegalArgumentException(
                "Fellowship position already exists for this combination of fellowship, scope, and title");
        }

        // Create and save
        FellowshipPosition position = new FellowshipPosition();
        position.setFellowship(fellowship);
        position.setTitle(title);
        position.setScope(scope);
        position.setSeats(finalSeats);
        position.setStatus(RecordStatus.ACTIVE);

        return fellowshipPositionRepository.save(position);
    }

    /**
     * Update an existing fellowship position.
     * 
     * @param id the fellowship position ID
     * @param titleId the new title ID (optional)
     * @param scope the new scope (optional)
     * @param seats the new number of seats (optional, must be >= 1 if provided)
     * @param status the new status (optional)
     * @return updated FellowshipPosition entity
     * @throws IllegalArgumentException if position not found or validation fails
     */
    public FellowshipPosition update(Long id, Long titleId, PositionScope scope, Integer seats, RecordStatus status) {
        FellowshipPosition position = getById(id);

        // Track if we need to re-check uniqueness
        boolean needsDuplicateCheck = false;
        Long newTitleId = titleId;
        PositionScope newScope = scope;

        // Update title if provided
        if (titleId != null && !titleId.equals(position.getTitle().getId())) {
            PositionTitle newTitle = positionTitleRepository.findById(titleId)
                .orElseThrow(() -> new IllegalArgumentException("Position title with ID " + titleId + " not found"));
            position.setTitle(newTitle);
            needsDuplicateCheck = true;
        } else {
            newTitleId = position.getTitle().getId();
        }

        // Update scope if provided
        if (scope != null && !scope.equals(position.getScope())) {
            position.setScope(scope);
            needsDuplicateCheck = true;
        } else {
            newScope = position.getScope();
        }

        // Check for duplicates if fellowship/title/scope combination changed
        if (needsDuplicateCheck) {
            Long fellowshipId = position.getFellowship().getId();
            if (fellowshipPositionRepository.existsByFellowshipIdAndScopeAndTitleId(
                    fellowshipId, newScope, newTitleId)) {
                throw new IllegalArgumentException(
                    "Fellowship position already exists for this combination of fellowship, scope, and title");
            }
        }

        // Update seats if provided
        if (seats != null) {
            if (seats < 1) {
                throw new IllegalArgumentException("Number of seats must be at least 1");
            }
            position.setSeats(seats);
        }

        // Update status if provided
        if (status != null) {
            position.setStatus(status);
        }

        return fellowshipPositionRepository.save(position);
    }

    /**
     * Get a fellowship position by ID.
     * 
     * @param id the fellowship position ID
     * @return the FellowshipPosition entity
     * @throws IllegalArgumentException if position not found
     */
    public FellowshipPosition getById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Fellowship position ID is required");
        }
        return fellowshipPositionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Fellowship position with ID " + id + " not found"));
    }

    /**
     * List fellowship positions with optional filters and enriched data.
     * 
     * @param fellowshipId filter by fellowship ID (optional)
     * @param scope filter by position scope (optional)
     * @param pageable pagination information
     * @return a page of fellowship positions with assignment counts
     */
    @Transactional(readOnly = true)
    public Page<FellowshipPositionWithCounts> listWithCounts(Long fellowshipId, PositionScope scope, Pageable pageable) {
        Page<FellowshipPosition> page;
        
        // Apply filters
        if (fellowshipId != null && scope != null) {
            page = fellowshipPositionRepository.findByFellowshipIdAndScope(fellowshipId, scope, pageable);
        } else if (fellowshipId != null) {
            page = fellowshipPositionRepository.findByFellowshipId(fellowshipId, pageable);
        } else {
            page = fellowshipPositionRepository.findAll(pageable);
        }

        // Enrich with counts
        var content = page.getContent().stream()
            .map(position -> new FellowshipPositionWithCounts(
                position,
                leadershipAssignmentRepository.countByFellowshipPositionIdAndStatus(position.getId(), RecordStatus.ACTIVE)
            ))
            .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    /**
     * List fellowship positions with optional filters.
     * 
     * @param fellowshipId filter by fellowship ID (optional)
     * @param scope filter by position scope (optional)
     * @param pageable pagination information
     * @return a page of fellowship positions
     */
    public Page<FellowshipPosition> list(Long fellowshipId, PositionScope scope, Pageable pageable) {
        // If both filters provided
        if (fellowshipId != null && scope != null) {
            return fellowshipPositionRepository.findByFellowshipIdAndScope(fellowshipId, scope, pageable);
        }
        
        // If only fellowship filter
        if (fellowshipId != null) {
            return fellowshipPositionRepository.findByFellowshipId(fellowshipId, pageable);
        }
        
        // No filters - return all
        return fellowshipPositionRepository.findAll(pageable);
    }

    /**
     * Deactivate a fellowship position by setting its status to INACTIVE.
     * 
     * @param id the fellowship position ID
     * @throws IllegalArgumentException if position not found
     */
    public void deactivate(Long id) {
        FellowshipPosition position = getById(id);
        position.setStatus(RecordStatus.INACTIVE);
        fellowshipPositionRepository.save(position);
    }

    /**
     * Internal DTO class to hold FellowshipPosition with enriched counts.
     */
    public static class FellowshipPositionWithCounts {
        private final FellowshipPosition position;
        private final Long currentAssignmentsCount;

        public FellowshipPositionWithCounts(FellowshipPosition position, Long currentAssignmentsCount) {
            this.position = position;
            this.currentAssignmentsCount = currentAssignmentsCount;
        }

        public FellowshipPosition getPosition() {
            return position;
        }

        public Long getCurrentAssignmentsCount() {
            return currentAssignmentsCount;
        }
    }
}