package com.mukono.voting.service.org;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Diocese;
import com.mukono.voting.repository.org.DioceseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for Diocese entity.
 * Handles business logic, validation, and data access for dioceses.
 */
@Service
@Transactional
public class DioceseService {

    private final DioceseRepository dioceseRepository;

    public DioceseService(DioceseRepository dioceseRepository) {
        this.dioceseRepository = dioceseRepository;
    }

    /**
     * Create a new diocese with validation.
     * 
     * @param name the diocese name (required, unique)
     * @param code the diocese code (optional, unique if provided)
     * @return created Diocese entity
     * @throws IllegalArgumentException if validation fails
     */
    public Diocese create(String name, String code) {
        // Validate name
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Diocese name is required");
        }

        // Check name uniqueness (case-insensitive)
        if (dioceseRepository.existsByNameIgnoreCase(name.trim())) {
            throw new IllegalArgumentException("Diocese with name '" + name + "' already exists");
        }

        // Check code uniqueness if provided (case-insensitive)
        if (code != null && !code.isBlank()) {
            if (dioceseRepository.existsByCodeIgnoreCase(code.trim())) {
                throw new IllegalArgumentException("Diocese with code '" + code + "' already exists");
            }
        }

        // Create and save diocese
        Diocese diocese = new Diocese();
        diocese.setName(name.trim());
        diocese.setCode(code != null ? code.trim() : null);
        diocese.setStatus(RecordStatus.ACTIVE);

        return dioceseRepository.save(diocese);
    }

    /**
     * Update an existing diocese with partial updates.
     * Only non-null fields are updated.
     * 
     * @param id the diocese id
     * @param name the new name (optional)
     * @param code the new code (optional)
     * @param status the new status (optional)
     * @return updated Diocese entity
     * @throws IllegalArgumentException if diocese not found or validation fails
     */
    public Diocese update(Long id, String name, String code, RecordStatus status) {
        Diocese diocese = getById(id);

        // Update name if provided
        if (name != null && !name.isBlank()) {
            String trimmedName = name.trim();
            // Check uniqueness only if name is changing
            if (!trimmedName.equalsIgnoreCase(diocese.getName())) {
                if (dioceseRepository.existsByNameIgnoreCase(trimmedName)) {
                    throw new IllegalArgumentException("Diocese with name '" + trimmedName + "' already exists");
                }
            }
            diocese.setName(trimmedName);
        }

        // Update code if provided
        if (code != null && !code.isBlank()) {
            String trimmedCode = code.trim();
            // Check uniqueness only if code is changing
            if (diocese.getCode() == null || !trimmedCode.equalsIgnoreCase(diocese.getCode())) {
                if (dioceseRepository.existsByCodeIgnoreCase(trimmedCode)) {
                    throw new IllegalArgumentException("Diocese with code '" + trimmedCode + "' already exists");
                }
            }
            diocese.setCode(trimmedCode);
        }

        // Update status if provided
        if (status != null) {
            diocese.setStatus(status);
        }

        return dioceseRepository.save(diocese);
    }

    /**
     * Get a diocese by id.
     * 
     * @param id the diocese id
     * @return Diocese entity
     * @throws IllegalArgumentException if diocese not found
     */
    public Diocese getById(Long id) {
        return dioceseRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Diocese with id " + id + " not found"));
    }

    /**
     * List all dioceses with optional search.
     * 
     * @param q the search query (optional)
     * @param pageable pagination information
     * @return page of dioceses
     */
    @Transactional(readOnly = true)
    public Page<Diocese> list(String q, Pageable pageable) {
        if (q == null || q.isBlank()) {
            return dioceseRepository.findAll(pageable);
        } else {
            return dioceseRepository.findByNameContainingIgnoreCase(q.trim(), pageable);
        }
    }

    /**
     * Deactivate a diocese (set status to INACTIVE).
     * 
     * @param id the diocese id
     * @throws IllegalArgumentException if diocese not found
     */
    public void deactivate(Long id) {
        Diocese diocese = getById(id);
        diocese.setStatus(RecordStatus.INACTIVE);
        dioceseRepository.save(diocese);
    }
}
