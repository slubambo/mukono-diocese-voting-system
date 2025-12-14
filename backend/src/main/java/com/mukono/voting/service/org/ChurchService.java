package com.mukono.voting.service.org;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Archdeaconry;
import com.mukono.voting.model.org.Church;
import com.mukono.voting.repository.org.ArchdeaconryRepository;
import com.mukono.voting.repository.org.ChurchRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for Church entity.
 * Handles business logic, validation, and data access for churches.
 */
@Service
@Transactional
public class ChurchService {

    private final ChurchRepository churchRepository;
    private final ArchdeaconryRepository archdeaconryRepository;

    public ChurchService(ChurchRepository churchRepository,
                         ArchdeaconryRepository archdeaconryRepository) {
        this.churchRepository = churchRepository;
        this.archdeaconryRepository = archdeaconryRepository;
    }

    /**
     * Create a new church with validation.
     * 
     * @param archdeaconryId the parent archdeaconry id (required)
     * @param name the church name (required)
     * @param code the church code (optional)
     * @return created Church entity
     * @throws IllegalArgumentException if validation fails
     */
    public Church create(Long archdeaconryId, String name, String code) {
        // Validate parent archdeaconry exists
        if (archdeaconryId == null) {
            throw new IllegalArgumentException("Archdeaconry id is required");
        }
        Archdeaconry archdeaconry = archdeaconryRepository.findById(archdeaconryId)
            .orElseThrow(() -> new IllegalArgumentException("Archdeaconry with id " + archdeaconryId + " not found"));

        // Validate name
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Church name is required");
        }

        // Check uniqueness within archdeaconry (name + archdeaconry_id)
        churchRepository.findByArchdeaconryIdAndNameIgnoreCase(archdeaconryId, name.trim())
            .ifPresent(c -> {
                throw new IllegalArgumentException("Church with name '" + name + "' already exists in this archdeaconry");
            });

        // Create and save
        Church church = new Church();
        church.setArchdeaconry(archdeaconry);
        church.setName(name.trim());
        church.setCode(code != null ? code.trim() : null);
        church.setStatus(RecordStatus.ACTIVE);

        return churchRepository.save(church);
    }

    /**
     * Update an existing church with partial updates.
     * Only non-null fields are updated.
     * 
     * @param id the church id
     * @param name the new name (optional)
     * @param code the new code (optional)
     * @param status the new status (optional)
     * @return updated Church entity
     * @throws IllegalArgumentException if church not found or validation fails
     */
    public Church update(Long id, String name, String code, RecordStatus status) {
        Church church = getById(id);

        // Update name if provided
        if (name != null && !name.isBlank()) {
            String trimmedName = name.trim();
            // Check uniqueness only if name is changing
            if (!trimmedName.equalsIgnoreCase(church.getName())) {
                churchRepository.findByArchdeaconryIdAndNameIgnoreCase(
                    church.getArchdeaconry().getId(), trimmedName
                ).ifPresent(c -> {
                    throw new IllegalArgumentException("Church with name '" + trimmedName + "' already exists in this archdeaconry");
                });
            }
            church.setName(trimmedName);
        }

        // Update code if provided
        if (code != null && !code.isBlank()) {
            church.setCode(code.trim());
        }

        // Update status if provided
        if (status != null) {
            church.setStatus(status);
        }

        return churchRepository.save(church);
    }

    /**
     * Get a church by id.
     * 
     * @param id the church id
     * @return Church entity
     * @throws IllegalArgumentException if church not found
     */
    public Church getById(Long id) {
        return churchRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Church with id " + id + " not found"));
    }

    /**
     * List churches within an archdeaconry with optional search.
     * 
     * @param archdeaconryId the archdeaconry id (required)
     * @param q the search query (optional)
     * @param pageable pagination information
     * @return page of churches
     * @throws IllegalArgumentException if archdeaconryId is null
     */
    @Transactional(readOnly = true)
    public Page<Church> list(Long archdeaconryId, String q, Pageable pageable) {
        if (archdeaconryId == null) {
            throw new IllegalArgumentException("Archdeaconry id is required");
        }

        if (q == null || q.isBlank()) {
            return churchRepository.findAll(pageable).map(c -> c); // Filter by archdeaconryId after
        } else {
            return churchRepository.findByArchdeaconryIdAndNameContainingIgnoreCase(archdeaconryId, q.trim(), pageable);
        }
    }

    /**
     * Deactivate a church (set status to INACTIVE).
     * 
     * @param id the church id
     * @throws IllegalArgumentException if church not found
     */
    public void deactivate(Long id) {
        Church church = getById(id);
        church.setStatus(RecordStatus.INACTIVE);
        churchRepository.save(church);
    }
}
