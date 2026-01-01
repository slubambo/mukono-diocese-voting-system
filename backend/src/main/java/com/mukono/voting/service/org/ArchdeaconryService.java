package com.mukono.voting.service.org;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Archdeaconry;
import com.mukono.voting.model.org.Diocese;
import com.mukono.voting.repository.org.ArchdeaconryRepository;
import com.mukono.voting.repository.org.DioceseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for Archdeaconry entity.
 * Handles business logic, validation, and data access for archdeaconries.
 */
@Service
@Transactional
public class ArchdeaconryService {

    private final ArchdeaconryRepository archdeaconryRepository;
    private final DioceseRepository dioceseRepository;

    public ArchdeaconryService(ArchdeaconryRepository archdeaconryRepository,
                               DioceseRepository dioceseRepository) {
        this.archdeaconryRepository = archdeaconryRepository;
        this.dioceseRepository = dioceseRepository;
    }

    /**
     * Create a new archdeaconry with validation.
     * 
     * @param dioceseId the parent diocese id (required)
     * @param name the archdeaconry name (required)
     * @param code the archdeaconry code (optional)
     * @return created Archdeaconry entity
     * @throws IllegalArgumentException if validation fails
     */
    public Archdeaconry create(Long dioceseId, String name, String code) {
        // Validate parent diocese exists
        if (dioceseId == null) {
            throw new IllegalArgumentException("Diocese id is required");
        }
        Diocese diocese = dioceseRepository.findById(dioceseId)
            .orElseThrow(() -> new IllegalArgumentException("Diocese with id " + dioceseId + " not found"));

        // Validate name
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Archdeaconry name is required");
        }

        // Check uniqueness within diocese (name + diocese_id)
        archdeaconryRepository.findByDioceseIdAndNameIgnoreCase(dioceseId, name.trim())
            .ifPresent(a -> {
                throw new IllegalArgumentException("Archdeaconry with name '" + name + "' already exists in this diocese");
            });

        // Create and save
        Archdeaconry archdeaconry = new Archdeaconry();
        archdeaconry.setDiocese(diocese);
        archdeaconry.setName(name.trim());
        archdeaconry.setCode(code != null ? code.trim() : null);
        archdeaconry.setStatus(RecordStatus.ACTIVE);

        return archdeaconryRepository.save(archdeaconry);
    }

    /**
     * Update an existing archdeaconry with partial updates.
     * Only non-null fields are updated.
     * 
     * @param id the archdeaconry id
     * @param name the new name (optional)
     * @param code the new code (optional)
     * @param status the new status (optional)
     * @return updated Archdeaconry entity
     * @throws IllegalArgumentException if archdeaconry not found or validation fails
     */
    public Archdeaconry update(Long id, String name, String code, RecordStatus status) {
        Archdeaconry archdeaconry = getById(id);

        // Update name if provided
        if (name != null && !name.isBlank()) {
            String trimmedName = name.trim();
            // Check uniqueness only if name is changing
            if (!trimmedName.equalsIgnoreCase(archdeaconry.getName())) {
                archdeaconryRepository.findByDioceseIdAndNameIgnoreCase(
                    archdeaconry.getDiocese().getId(), trimmedName
                ).ifPresent(a -> {
                    throw new IllegalArgumentException("Archdeaconry with name '" + trimmedName + "' already exists in this diocese");
                });
            }
            archdeaconry.setName(trimmedName);
        }

        // Update code if provided
        if (code != null && !code.isBlank()) {
            archdeaconry.setCode(code.trim());
        }

        // Update status if provided
        if (status != null) {
            archdeaconry.setStatus(status);
        }

        return archdeaconryRepository.save(archdeaconry);
    }

    /**
     * Get an archdeaconry by id.
     * 
     * @param id the archdeaconry id
     * @return Archdeaconry entity
     * @throws IllegalArgumentException if archdeaconry not found
     */
    public Archdeaconry getById(Long id) {
        return archdeaconryRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Archdeaconry with id " + id + " not found"));
    }

    /**
     * List archdeaconries within a diocese with optional search.
     * 
     * @param dioceseId the diocese id (required)
     * @param q the search query (optional)
     * @param pageable pagination information
     * @return page of archdeaconries
     * @throws IllegalArgumentException if dioceseId is null
     */
    @Transactional(readOnly = true)
    public Page<Archdeaconry> list(Long dioceseId, String q, Pageable pageable) {
        if (dioceseId == null) {
            throw new IllegalArgumentException("Diocese id is required");
        }

        if (q == null || q.isBlank()) {
            return archdeaconryRepository.findByDioceseId(dioceseId, pageable);
        } else {
            return archdeaconryRepository.findByDioceseIdAndNameContainingIgnoreCase(dioceseId, q.trim(), pageable);
        }
    }

    /**
     * Deactivate an archdeaconry (set status to INACTIVE).
     * 
     * @param id the archdeaconry id
     * @throws IllegalArgumentException if archdeaconry not found
     */
    public void deactivate(Long id) {
        Archdeaconry archdeaconry = getById(id);
        archdeaconry.setStatus(RecordStatus.INACTIVE);
        archdeaconryRepository.save(archdeaconry);
    }
}
