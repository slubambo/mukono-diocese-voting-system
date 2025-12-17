package com.mukono.voting.service.election;

import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.VotingPeriod;
import com.mukono.voting.model.election.VotingPeriodStatus;
import com.mukono.voting.payload.request.CreateVotingPeriodRequest;
import com.mukono.voting.payload.request.UpdateVotingPeriodRequest;
import com.mukono.voting.payload.response.VotingPeriodResponse;
import com.mukono.voting.repository.election.ElectionRepository;
import com.mukono.voting.repository.election.VotingPeriodRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for VotingPeriod entity.
 * Handles business logic, validation, status transitions, and data access for voting periods.
 */
@Service
@Transactional
public class VotingPeriodService {

    private final VotingPeriodRepository votingPeriodRepository;
    private final ElectionRepository electionRepository;

    public VotingPeriodService(
            VotingPeriodRepository votingPeriodRepository,
            ElectionRepository electionRepository) {
        this.votingPeriodRepository = votingPeriodRepository;
        this.electionRepository = electionRepository;
    }

    /**
     * Create a new voting period for an election.
     *
     * @param electionId the election ID
     * @param request create voting period request containing name, description, startTime, endTime
     * @return created VotingPeriod entity
     * @throws IllegalArgumentException if validation fails
     */
    public VotingPeriod createVotingPeriod(Long electionId, CreateVotingPeriodRequest request) {
        // Validate election exists
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found"));

        // Validate request data
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (request.getName().length() > 120) {
            throw new IllegalArgumentException("Name must not exceed 120 characters");
        }

        if (request.getDescription() != null && request.getDescription().length() > 1000) {
            throw new IllegalArgumentException("Description must not exceed 1000 characters");
        }

        if (request.getStartTime() == null) {
            throw new IllegalArgumentException("Start time is required");
        }
        if (request.getEndTime() == null) {
            throw new IllegalArgumentException("End time is required");
        }

        // Validate time window
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        // Create and save
        VotingPeriod votingPeriod = new VotingPeriod();
        votingPeriod.setElection(election);
        votingPeriod.setName(request.getName());
        votingPeriod.setDescription(request.getDescription());
        votingPeriod.setStartTime(request.getStartTime());
        votingPeriod.setEndTime(request.getEndTime());
        votingPeriod.setStatus(VotingPeriodStatus.SCHEDULED);

        return votingPeriodRepository.save(votingPeriod);
    }

    /**
     * Get a voting period by ID for a specific election.
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return VotingPeriod entity
     * @throws IllegalArgumentException if not found or doesn't belong to election
     */
    public VotingPeriod getVotingPeriod(Long electionId, Long votingPeriodId) {
        // Validate election exists
        if (!electionRepository.existsById(electionId)) {
            throw new IllegalArgumentException("Election not found");
        }

        return votingPeriodRepository.findByElectionIdAndId(electionId, votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Voting period not found or does not belong to this election"));
    }

    /**
     * List voting periods for an election (paginated, optionally filtered by status).
     *
     * @param electionId the election ID
     * @param status optional status filter
     * @param pageable pagination information
     * @return page of voting periods
     * @throws IllegalArgumentException if election not found
     */
    public Page<VotingPeriod> listVotingPeriods(Long electionId, VotingPeriodStatus status, Pageable pageable) {
        // Validate election exists
        if (!electionRepository.existsById(electionId)) {
            throw new IllegalArgumentException("Election not found");
        }

        if (status != null) {
            return votingPeriodRepository.findByElectionIdAndStatus(electionId, status, pageable);
        }
        return votingPeriodRepository.findByElectionId(electionId, pageable);
    }

    /**
     * Update a voting period.
     * Only allowed when status is SCHEDULED (or OPEN for description-only updates).
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param request update request with optional fields
     * @return updated VotingPeriod entity
     * @throws IllegalArgumentException if validation fails
     */
    public VotingPeriod updateVotingPeriod(Long electionId, Long votingPeriodId, UpdateVotingPeriodRequest request) {
        VotingPeriod votingPeriod = getVotingPeriod(electionId, votingPeriodId);

        // Reject updates if status is CLOSED or CANCELLED
        if (votingPeriod.getStatus() == VotingPeriodStatus.CLOSED || 
            votingPeriod.getStatus() == VotingPeriodStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot update voting period with status " + votingPeriod.getStatus());
        }

        // Update name if provided
        if (request.getName() != null && !request.getName().isBlank()) {
            if (request.getName().length() > 120) {
                throw new IllegalArgumentException("Name must not exceed 120 characters");
            }
            votingPeriod.setName(request.getName());
        }

        // Update description if provided
        if (request.getDescription() != null) {
            if (request.getDescription().length() > 1000) {
                throw new IllegalArgumentException("Description must not exceed 1000 characters");
            }
            votingPeriod.setDescription(request.getDescription());
        }

        // Update times if provided, with validation
        LocalDateTime newStartTime = request.getStartTime() != null ? request.getStartTime() : votingPeriod.getStartTime();
        LocalDateTime newEndTime = request.getEndTime() != null ? request.getEndTime() : votingPeriod.getEndTime();

        if (!newStartTime.isBefore(newEndTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        votingPeriod.setStartTime(newStartTime);
        votingPeriod.setEndTime(newEndTime);

        return votingPeriodRepository.save(votingPeriod);
    }

    /**
     * Transition voting period to OPEN status.
     * Only allowed from SCHEDULED status.
     * Enforces: only one OPEN period per election at a time.
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return updated VotingPeriod entity
     * @throws IllegalArgumentException if transition not allowed
     */
    public VotingPeriod openVotingPeriod(Long electionId, Long votingPeriodId) {
        VotingPeriod votingPeriod = getVotingPeriod(electionId, votingPeriodId);

        if (votingPeriod.getStatus() != VotingPeriodStatus.SCHEDULED) {
            throw new IllegalArgumentException("Can only open voting periods with status SCHEDULED, current status: " + votingPeriod.getStatus());
        }

        // Check if another period is already OPEN for this election
        long openCount = votingPeriodRepository.countByElectionIdAndStatus(electionId, VotingPeriodStatus.OPEN);
        if (openCount > 0) {
            throw new IllegalArgumentException("An election can only have one OPEN voting period at a time");
        }

        votingPeriod.setStatus(VotingPeriodStatus.OPEN);
        return votingPeriodRepository.save(votingPeriod);
    }

    /**
     * Transition voting period to CLOSED status.
     * Allowed from SCHEDULED or OPEN status.
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return updated VotingPeriod entity
     * @throws IllegalArgumentException if transition not allowed
     */
    public VotingPeriod closeVotingPeriod(Long electionId, Long votingPeriodId) {
        VotingPeriod votingPeriod = getVotingPeriod(electionId, votingPeriodId);

        if (votingPeriod.getStatus() != VotingPeriodStatus.SCHEDULED && 
            votingPeriod.getStatus() != VotingPeriodStatus.OPEN) {
            throw new IllegalArgumentException("Can only close voting periods with status SCHEDULED or OPEN, current status: " + votingPeriod.getStatus());
        }

        votingPeriod.setStatus(VotingPeriodStatus.CLOSED);
        return votingPeriodRepository.save(votingPeriod);
    }

    /**
     * Transition voting period to CANCELLED status.
     * Only allowed from SCHEDULED status.
     *
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @return updated VotingPeriod entity
     * @throws IllegalArgumentException if transition not allowed
     */
    public VotingPeriod cancelVotingPeriod(Long electionId, Long votingPeriodId) {
        VotingPeriod votingPeriod = getVotingPeriod(electionId, votingPeriodId);

        if (votingPeriod.getStatus() != VotingPeriodStatus.SCHEDULED) {
            throw new IllegalArgumentException("Can only cancel voting periods with status SCHEDULED, current status: " + votingPeriod.getStatus());
        }

        votingPeriod.setStatus(VotingPeriodStatus.CANCELLED);
        return votingPeriodRepository.save(votingPeriod);
    }

    /**
     * Convert VotingPeriod entity to VotingPeriodResponse DTO.
     *
     * @param votingPeriod the voting period entity
     * @return response DTO
     */
    public VotingPeriodResponse toResponse(VotingPeriod votingPeriod) {
        return new VotingPeriodResponse(
                votingPeriod.getId(),
                votingPeriod.getElection().getId(),
                votingPeriod.getName(),
                votingPeriod.getDescription(),
                votingPeriod.getStartTime(),
                votingPeriod.getEndTime(),
                votingPeriod.getStatus(),
                votingPeriod.getCreatedAt(),
                votingPeriod.getUpdatedAt()
        );
    }
}
