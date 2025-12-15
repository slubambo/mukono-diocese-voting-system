package com.mukono.voting.service.leadership;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.leadership.PositionTitle;
import com.mukono.voting.repository.leadership.PositionTitleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for PositionTitle entity.
 * Handles business logic, validation, and data access for position titles.
 */
@Service
@Transactional
public class PositionTitleService {

    private final PositionTitleRepository positionTitleRepository;

    public PositionTitleService(PositionTitleRepository positionTitleRepository) {
        this.positionTitleRepository = positionTitleRepository;
    }

    /**
     * Create a new position title with validation.
     * 
     * @param name the position title name (required, must be unique case-insensitive)
     * @return created PositionTitle entity
     * @throws IllegalArgumentException if validation fails
     */
    public PositionTitle create(String name) {
        // Validate name
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Position title name is required");
        }

        String trimmedName = name.trim();

        // Check uniqueness (case-insensitive)
        if (positionTitleRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new IllegalArgumentException("Position title with name '" + trimmedName + "' already exists");
        }

        // Create and save
        PositionTitle title = new PositionTitle();
        title.setName(trimmedName);
        title.setStatus(RecordStatus.ACTIVE);

        return positionTitleRepository.save(title);
    }

    /**
     * Update an existing position title.
     * 
     * @param id the position title ID
     * @param name the new name (optional)
     * @param status the new status (optional)
     * @return updated PositionTitle entity
     * @throws IllegalArgumentException if position title not found or validation fails
     */
    public PositionTitle update(Long id, String name, RecordStatus status) {
        PositionTitle title = getById(id);

        // Update name if provided
        if (name != null && !name.isBlank()) {
            String trimmedName = name.trim();
            
            // Only check uniqueness if name is actually changing
            if (!trimmedName.equalsIgnoreCase(title.getName())) {
                if (positionTitleRepository.existsByNameIgnoreCase(trimmedName)) {
                    throw new IllegalArgumentException("Position title with name '" + trimmedName + "' already exists");
                }
                title.setName(trimmedName);
            }
        }

        // Update status if provided
        if (status != null) {
            title.setStatus(status);
        }

        return positionTitleRepository.save(title);
    }

    /**
     * Get a position title by ID.
     * 
     * @param id the position title ID
     * @return the PositionTitle entity
     * @throws IllegalArgumentException if position title not found
     */
    public PositionTitle getById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Position title ID is required");
        }
        return positionTitleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Position title with ID " + id + " not found"));
    }

    /**
     * List position titles with optional search query.
     * 
     * @param q search query for name (optional)
     * @param pageable pagination information
     * @return a page of position titles
     */
    public Page<PositionTitle> list(String q, Pageable pageable) {
        if (q == null || q.isBlank()) {
            return positionTitleRepository.findAll(pageable);
        }
        return positionTitleRepository.findByNameContainingIgnoreCase(q.trim(), pageable);
    }

    /**
     * Deactivate a position title by setting its status to INACTIVE.
     * 
     * @param id the position title ID
     * @throws IllegalArgumentException if position title not found
     */
    public void deactivate(Long id) {
        PositionTitle title = getById(id);
        title.setStatus(RecordStatus.INACTIVE);
        positionTitleRepository.save(title);
    }
}
