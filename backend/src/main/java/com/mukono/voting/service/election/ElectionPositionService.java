package com.mukono.voting.service.election;

import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.ElectionPosition;
import com.mukono.voting.model.election.ElectionStatus;
import com.mukono.voting.model.leadership.FellowshipPosition;
import com.mukono.voting.repository.election.ElectionPositionRepository;
import com.mukono.voting.repository.election.ElectionRepository;
import com.mukono.voting.repository.leadership.FellowshipPositionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for ElectionPosition entity.
 * Handles business logic, validation, and data access for election positions.
 */
@Service
@Transactional
public class ElectionPositionService {

    private final ElectionRepository electionRepository;
    private final ElectionPositionRepository electionPositionRepository;
    private final FellowshipPositionRepository fellowshipPositionRepository;

    public ElectionPositionService(
            ElectionRepository electionRepository,
            ElectionPositionRepository electionPositionRepository,
            FellowshipPositionRepository fellowshipPositionRepository) {
        this.electionRepository = electionRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.fellowshipPositionRepository = fellowshipPositionRepository;
    }

    /**
     * Add a position to an election.
     * 
     * @param electionId election ID (required)
     * @param fellowshipPositionId fellowship position ID (required)
     * @param seats number of seats for this position in this election (required, must be >= 1)
     * @return created ElectionPosition entity
     * @throws IllegalArgumentException if validation fails
     */
    public ElectionPosition addPosition(Long electionId, Long fellowshipPositionId, Integer seats) {
        // Validate election exists
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));

        // Validate election status allows editing positions
        validateElectionEditable(election);

        // Validate fellowship position exists
        if (fellowshipPositionId == null) {
            throw new IllegalArgumentException("Fellowship position ID is required");
        }
        FellowshipPosition fellowshipPosition = fellowshipPositionRepository.findById(fellowshipPositionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Fellowship position with ID " + fellowshipPositionId + " not found"));

        // Validate scope match
        if (fellowshipPosition.getScope() != election.getScope()) {
            throw new IllegalArgumentException(
                    "Fellowship position scope (" + fellowshipPosition.getScope() + 
                    ") does not match election scope (" + election.getScope() + ")");
        }

        // Validate fellowship match
        if (!fellowshipPosition.getFellowship().getId().equals(election.getFellowship().getId())) {
            throw new IllegalArgumentException(
                    "Fellowship position belongs to a different fellowship than the election");
        }

        // Validate seats (default to fellowshipPosition.seats if not provided)
        Integer finalSeats = seats != null ? seats : fellowshipPosition.getSeats();
        if (finalSeats == null || finalSeats < 1) {
            throw new IllegalArgumentException("Number of seats must be at least 1");
        }

        // Check for duplicates
        if (electionPositionRepository.existsByElectionIdAndFellowshipPositionId(electionId, fellowshipPositionId)) {
            throw new IllegalArgumentException(
                    "Position is already added to this election");
        }

        // Create and save
        ElectionPosition electionPosition = new ElectionPosition();
        electionPosition.setElection(election);
        electionPosition.setFellowshipPosition(fellowshipPosition);
        electionPosition.setSeats(finalSeats);

        return electionPositionRepository.save(electionPosition);
    }

    /**
     * Remove a position from an election.
     * 
     * @param electionId election ID
     * @param fellowshipPositionId fellowship position ID
     * @throws IllegalArgumentException if position not found or election status doesn't allow editing
     */
    public void removePosition(Long electionId, Long fellowshipPositionId) {
        // Validate inputs
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        if (fellowshipPositionId == null) {
            throw new IllegalArgumentException("Fellowship position ID is required");
        }

        // Get election and validate status
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));

        validateElectionEditable(election);

        // Get election position
        ElectionPosition electionPosition = electionPositionRepository
                .findByElectionIdAndFellowshipPositionId(electionId, fellowshipPositionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Position not found in this election"));

        // Delete
        electionPositionRepository.delete(electionPosition);
    }

    /**
     * List all positions for an election (paginated).
     * 
     * @param electionId election ID
     * @param pageable pagination information
     * @return page of election positions
     * @throws IllegalArgumentException if election not found
     */
    @Transactional(readOnly = true)
    public Page<ElectionPosition> listPositions(Long electionId, Pageable pageable) {
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }

        // Verify election exists
        if (!electionRepository.existsById(electionId)) {
            throw new IllegalArgumentException("Election with ID " + electionId + " not found");
        }

        return electionPositionRepository.findByElectionId(electionId, pageable);
    }

    /**
     * Get a specific position entry within an election.
     * 
     * @param electionId election ID
     * @param fellowshipPositionId fellowship position ID
     * @return ElectionPosition entity
     * @throws IllegalArgumentException if not found
     */
    @Transactional(readOnly = true)
    public ElectionPosition getByElectionAndFellowshipPosition(Long electionId, Long fellowshipPositionId) {
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        if (fellowshipPositionId == null) {
            throw new IllegalArgumentException("Fellowship position ID is required");
        }

        return electionPositionRepository.findByElectionIdAndFellowshipPositionId(electionId, fellowshipPositionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Position not found in this election"));
    }

    /**
     * Validate that an election's status allows editing positions.
     * Only DRAFT status allows editing positions.
     * Optionally, NOMINATION_CLOSED could be allowed if desired.
     * 
     * @param election the election to validate
     * @throws IllegalArgumentException if status doesn't allow editing
     */
    private void validateElectionEditable(Election election) {
        ElectionStatus status = election.getStatus();

        // Only allow editing in DRAFT status
        // Optionally add NOMINATION_CLOSED if you want to allow adding positions after nominations
        if (status != ElectionStatus.DRAFT) {
            throw new IllegalArgumentException(
                    "Cannot modify positions for election in " + status + " status. " +
                    "Positions can only be modified when election is in DRAFT status.");
        }
    }
}
