package com.mukono.voting.service.org;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Fellowship;
import com.mukono.voting.repository.leadership.FellowshipPositionRepository;
import com.mukono.voting.repository.org.FellowshipRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * Service for Fellowship entity.
 * Handles business logic, validation, and data access for fellowships.
 */
@Service
@Transactional
public class FellowshipService {

    private final FellowshipRepository fellowshipRepository;
    private final FellowshipPositionRepository fellowshipPositionRepository;

    public FellowshipService(FellowshipRepository fellowshipRepository,
                             FellowshipPositionRepository fellowshipPositionRepository) {
        this.fellowshipRepository = fellowshipRepository;
        this.fellowshipPositionRepository = fellowshipPositionRepository;
    }

    /**
     * Create a new fellowship with validation.
     * 
     * @param name the fellowship name (required, unique)
     * @param code the fellowship code (optional, unique if provided)
     * @return created Fellowship entity
     * @throws IllegalArgumentException if validation fails
     */
    public Fellowship create(String name, String code) {
        // Validate name
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Fellowship name is required");
        }

        // Check name uniqueness (case-insensitive)
        if (fellowshipRepository.existsByNameIgnoreCase(name.trim())) {
            throw new IllegalArgumentException("Fellowship with name '" + name + "' already exists");
        }

        // Check code uniqueness if provided (case-insensitive)
        if (code != null && !code.isBlank()) {
            if (fellowshipRepository.existsByCodeIgnoreCase(code.trim())) {
                throw new IllegalArgumentException("Fellowship with code '" + code + "' already exists");
            }
        }

        // Create and save fellowship
        Fellowship fellowship = new Fellowship();
        fellowship.setName(name.trim());
        fellowship.setCode(code != null ? code.trim() : null);
        fellowship.setStatus(RecordStatus.ACTIVE);

        return fellowshipRepository.save(fellowship);
    }

    /**
     * Update an existing fellowship with partial updates.
     * Only non-null fields are updated.
     * 
     * @param id the fellowship id
     * @param name the new name (optional)
     * @param code the new code (optional)
     * @param status the new status (optional)
     * @return updated Fellowship entity
     * @throws IllegalArgumentException if fellowship not found or validation fails
     */
    public Fellowship update(Long id, String name, String code, RecordStatus status) {
        Fellowship fellowship = getById(id);

        // Update name if provided
        if (name != null && !name.isBlank()) {
            String trimmedName = name.trim();
            // Check uniqueness only if name is changing
            if (!trimmedName.equalsIgnoreCase(fellowship.getName())) {
                if (fellowshipRepository.existsByNameIgnoreCase(trimmedName)) {
                    throw new IllegalArgumentException("Fellowship with name '" + trimmedName + "' already exists");
                }
            }
            fellowship.setName(trimmedName);
        }

        // Update code if provided
        if (code != null && !code.isBlank()) {
            String trimmedCode = code.trim();
            // Check uniqueness only if code is changing
            if (fellowship.getCode() == null || !trimmedCode.equalsIgnoreCase(fellowship.getCode())) {
                if (fellowshipRepository.existsByCodeIgnoreCase(trimmedCode)) {
                    throw new IllegalArgumentException("Fellowship with code '" + trimmedCode + "' already exists");
                }
            }
            fellowship.setCode(trimmedCode);
        }

        // Update status if provided
        if (status != null) {
            fellowship.setStatus(status);
        }

        return fellowshipRepository.save(fellowship);
    }

    /**
     * Get a fellowship by id.
     * 
     * @param id the fellowship id
     * @return Fellowship entity
     * @throws IllegalArgumentException if fellowship not found
     */
    public Fellowship getById(Long id) {
        return fellowshipRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Fellowship with id " + id + " not found"));
    }

    /**
     * List all fellowships with optional search and enriched data.
     * 
     * @param q the search query (optional)
     * @param pageable pagination information
     * @return page of fellowships with position counts
     */
    @Transactional(readOnly = true)
    public Page<FellowshipWithCounts> listWithCounts(String q, Pageable pageable) {
        Page<Fellowship> page;
        if (q == null || q.isBlank()) {
            page = fellowshipRepository.findAll(pageable);
        } else {
            page = fellowshipRepository.findByNameContainingIgnoreCase(q.trim(), pageable);
        }

        var content = page.getContent().stream()
            .map(fellowship -> new FellowshipWithCounts(
                fellowship,
                fellowshipPositionRepository.countByFellowshipIdAndStatus(fellowship.getId(), RecordStatus.ACTIVE)
            ))
            .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    /**
     * List all fellowships with optional search.
     * 
     * @param q the search query (optional)
     * @param pageable pagination information
     * @return page of fellowships
     */
    @Transactional(readOnly = true)
    public Page<Fellowship> list(String q, Pageable pageable) {
        if (q == null || q.isBlank()) {
            return fellowshipRepository.findAll(pageable);
        } else {
            return fellowshipRepository.findByNameContainingIgnoreCase(q.trim(), pageable);
        }
    }

    /**
     * Deactivate a fellowship (set status to INACTIVE).
     * 
     * @param id the fellowship id
     * @throws IllegalArgumentException if fellowship not found
     */
    public void deactivate(Long id) {
        Fellowship fellowship = getById(id);
        fellowship.setStatus(RecordStatus.INACTIVE);
        fellowshipRepository.save(fellowship);
    }

    /**
     * Internal DTO class to hold Fellowship with enriched counts.
     */
    public static class FellowshipWithCounts {
        private final Fellowship fellowship;
        private final Long positionsCount;

        public FellowshipWithCounts(Fellowship fellowship, Long positionsCount) {
            this.fellowship = fellowship;
            this.positionsCount = positionsCount;
        }

        public Fellowship getFellowship() {
            return fellowship;
        }

        public Long getPositionsCount() {
            return positionsCount;
        }
    }
}