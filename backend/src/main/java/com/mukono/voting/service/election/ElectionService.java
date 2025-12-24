package com.mukono.voting.service.election;

import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.ElectionStatus;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.model.org.Archdeaconry;
import com.mukono.voting.model.org.Church;
import com.mukono.voting.model.org.Diocese;
import com.mukono.voting.model.org.Fellowship;
import com.mukono.voting.repository.election.ElectionRepository;
import com.mukono.voting.repository.org.ArchdeaconryRepository;
import com.mukono.voting.repository.org.ChurchRepository;
import com.mukono.voting.repository.org.DioceseRepository;
import com.mukono.voting.repository.org.FellowshipRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Service for Election entity.
 * Handles business logic, validation, status transitions, and data access for elections.
 */
@Service
@Transactional
public class ElectionService {

    private final ElectionRepository electionRepository;
    private final FellowshipRepository fellowshipRepository;
    private final DioceseRepository dioceseRepository;
    private final ArchdeaconryRepository archdeaconryRepository;
    private final ChurchRepository churchRepository;

    public ElectionService(
            ElectionRepository electionRepository,
            FellowshipRepository fellowshipRepository,
            DioceseRepository dioceseRepository,
            ArchdeaconryRepository archdeaconryRepository,
            ChurchRepository churchRepository) {
        this.electionRepository = electionRepository;
        this.fellowshipRepository = fellowshipRepository;
        this.dioceseRepository = dioceseRepository;
        this.archdeaconryRepository = archdeaconryRepository;
        this.churchRepository = churchRepository;
    }

    /**
     * Create a new election with full validation.
     * 
     * @param name election name (required, max 255)
     * @param description election description (optional, max 1000)
     * @param fellowshipId fellowship ID (optional, deprecated - fellowships inferred from positions)
     * @param scope position scope (required)
     * @param dioceseId diocese ID (required if scope is DIOCESE)
     * @param archdeaconryId archdeaconry ID (required if scope is ARCHDEACONRY)
     * @param churchId church ID (required if scope is CHURCH)
     * @param termStartDate term start date (required)
     * @param termEndDate term end date (required, must be after start)
     * @param nominationStartAt nomination start time (optional, but both required if one provided)
     * @param nominationEndAt nomination end time (optional, but both required if one provided)
     * @param votingStartAt voting start time (required)
     * @param votingEndAt voting end time (required, must be after start)
     * @return created Election entity
     * @throws IllegalArgumentException if validation fails
     */
    public Election create(
            String name,
            String description,
            Long fellowshipId,
            PositionScope scope,
            Long dioceseId,
            Long archdeaconryId,
            Long churchId,
            LocalDate termStartDate,
            LocalDate termEndDate,
            Instant nominationStartAt,
            Instant nominationEndAt,
            Instant votingStartAt,
            Instant votingEndAt) {

        // Validate name
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Election name is required");
        }
        if (name.length() > 255) {
            throw new IllegalArgumentException("Election name must not exceed 255 characters");
        }

        // Validate description length if provided
        if (description != null && description.length() > 1000) {
            throw new IllegalArgumentException("Election description must not exceed 1000 characters");
        }

        // Validate fellowship (optional for backward compatibility, not used for new elections)
        Fellowship fellowship = null;
        if (fellowshipId != null) {
            fellowship = fellowshipRepository.findById(fellowshipId)
                    .orElseThrow(() -> new IllegalArgumentException("Fellowship with ID " + fellowshipId + " not found"));
        }

        // Validate scope
        if (scope == null) {
            throw new IllegalArgumentException("Scope is required");
        }

        // Validate scope-to-target matching (exactly one target based on scope)
        Diocese diocese = null;
        Archdeaconry archdeaconry = null;
        Church church = null;

        switch (scope) {
            case DIOCESE:
                if (dioceseId == null) {
                    throw new IllegalArgumentException("Diocese ID is required for DIOCESE scope");
                }
                if (archdeaconryId != null || churchId != null) {
                    throw new IllegalArgumentException(
                            "For DIOCESE scope, only dioceseId should be provided; archdeaconryId and churchId must be null");
                }
                diocese = dioceseRepository.findById(dioceseId)
                        .orElseThrow(() -> new IllegalArgumentException("Diocese with ID " + dioceseId + " not found"));
                break;

            case ARCHDEACONRY:
                if (archdeaconryId == null) {
                    throw new IllegalArgumentException("Archdeaconry ID is required for ARCHDEACONRY scope");
                }
                if (dioceseId != null || churchId != null) {
                    throw new IllegalArgumentException(
                            "For ARCHDEACONRY scope, only archdeaconryId should be provided; dioceseId and churchId must be null");
                }
                archdeaconry = archdeaconryRepository.findById(archdeaconryId)
                        .orElseThrow(() -> new IllegalArgumentException("Archdeaconry with ID " + archdeaconryId + " not found"));
                break;

            case CHURCH:
                if (churchId == null) {
                    throw new IllegalArgumentException("Church ID is required for CHURCH scope");
                }
                if (dioceseId != null || archdeaconryId != null) {
                    throw new IllegalArgumentException(
                            "For CHURCH scope, only churchId should be provided; dioceseId and archdeaconryId must be null");
                }
                church = churchRepository.findById(churchId)
                        .orElseThrow(() -> new IllegalArgumentException("Church with ID " + churchId + " not found"));
                break;

            default:
                throw new IllegalArgumentException("Invalid scope: " + scope);
        }

        // Validate term dates
        if (termStartDate == null) {
            throw new IllegalArgumentException("Term start date is required");
        }
        if (termEndDate == null) {
            throw new IllegalArgumentException("Term end date is required");
        }
        if (!termEndDate.isAfter(termStartDate)) {
            throw new IllegalArgumentException("Term end date must be after term start date");
        }

        // Validate voting window (required)
        if (votingStartAt == null) {
            throw new IllegalArgumentException("Voting start time is required");
        }
        if (votingEndAt == null) {
            throw new IllegalArgumentException("Voting end time is required");
        }
        if (!votingEndAt.isAfter(votingStartAt)) {
            throw new IllegalArgumentException("Voting end time must be after voting start time");
        }

        // Validate nomination window (optional, but if any is provided, both must be present)
        if (nominationStartAt != null || nominationEndAt != null) {
            if (nominationStartAt == null) {
                throw new IllegalArgumentException("Nomination start time is required when nomination end time is provided");
            }
            if (nominationEndAt == null) {
                throw new IllegalArgumentException("Nomination end time is required when nomination start time is provided");
            }
            if (!nominationEndAt.isAfter(nominationStartAt)) {
                throw new IllegalArgumentException("Nomination end time must be after nomination start time");
            }
            // Strict ordering: nomination must end before or when voting starts
            if (nominationEndAt.isAfter(votingEndAt)) {
                throw new IllegalArgumentException("Nomination end time must not be after voting end time");
            }
        }

        // Check for duplicate election (same scope + target + term)
        // Note: fellowship is no longer part of uniqueness; positions define fellowships
        boolean exists = false;
        switch (scope) {
            case DIOCESE:
                exists = electionRepository.existsByScopeAndDioceseIdAndTermStartDateAndTermEndDate(
                        scope, dioceseId, termStartDate, termEndDate);
                break;
            case ARCHDEACONRY:
                exists = electionRepository.existsByScopeAndArchdeaconryIdAndTermStartDateAndTermEndDate(
                        scope, archdeaconryId, termStartDate, termEndDate);
                break;
            case CHURCH:
                exists = electionRepository.existsByScopeAndChurchIdAndTermStartDateAndTermEndDate(
                        scope, churchId, termStartDate, termEndDate);
                break;
        }

        if (exists) {
            throw new IllegalArgumentException(
                    "An election already exists for this scope, target, and term period");
        }

        // Create election
        Election election = new Election();
        election.setName(name);
        election.setDescription(description);
        election.setFellowship(fellowship);
        election.setScope(scope);
        election.setDiocese(diocese);
        election.setArchdeaconry(archdeaconry);
        election.setChurch(church);
        election.setTermStartDate(termStartDate);
        election.setTermEndDate(termEndDate);
        election.setNominationStartAt(nominationStartAt);
        election.setNominationEndAt(nominationEndAt);
        election.setVotingStartAt(votingStartAt);
        election.setVotingEndAt(votingEndAt);
        election.setStatus(ElectionStatus.DRAFT);

        return electionRepository.save(election);
    }

    /**
     * Update an existing election (partial update).
     * Allows changing fellowship, scope, and targets with the same validations used on create.
     * 
     * @param electionId election ID (required)
     * @param name new name (optional)
     * @param description new description (optional)
     * @param status new status (optional, validated for transitions)
     * @param fellowshipId new fellowship id (optional)
     * @param scope new scope (optional)
     * @param dioceseId new diocese id (optional)
     * @param archdeaconryId new archdeaconry id (optional)
     * @param churchId new church id (optional)
     * @param termStartDate new term start date (optional)
     * @param termEndDate new term end date (optional)
     * @param nominationStartAt new nomination start time (optional)
     * @param nominationEndAt new nomination end time (optional)
     * @param votingStartAt new voting start time (optional)
     * @param votingEndAt new voting end time (optional)
     * @return updated Election entity
     * @throws IllegalArgumentException if validation fails
     */
    public Election update(
            Long electionId,
            String name,
            String description,
            ElectionStatus status,
            Long fellowshipId,
            PositionScope scope,
            Long dioceseId,
            Long archdeaconryId,
            Long churchId,
            LocalDate termStartDate,
            LocalDate termEndDate,
            Instant nominationStartAt,
            Instant nominationEndAt,
            Instant votingStartAt,
            Instant votingEndAt) {

        // Validate election exists
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));

        // Update name if provided
        if (name != null) {
            if (name.isBlank()) {
                throw new IllegalArgumentException("Election name cannot be blank");
            }
            if (name.length() > 255) {
                throw new IllegalArgumentException("Election name must not exceed 255 characters");
            }
            election.setName(name);
        }

        // Update description if provided
        if (description != null) {
            if (description.length() > 1000) {
                throw new IllegalArgumentException("Election description must not exceed 1000 characters");
            }
            election.setDescription(description);
        }

        // Update fellowship if provided (nullable fellowship supported only when explicitly set via domain rules)
        if (fellowshipId != null) {
            Fellowship fellowship = fellowshipRepository.findById(fellowshipId)
                    .orElseThrow(() -> new IllegalArgumentException("Fellowship with ID " + fellowshipId + " not found"));
            election.setFellowship(fellowship);
        }

        // Determine final scope/targets considering inputs and current entity
        PositionScope finalScope = scope != null ? scope : election.getScope();

        Long currentDioceseId = election.getDiocese() != null ? election.getDiocese().getId() : null;
        Long currentArchdeaconryId = election.getArchdeaconry() != null ? election.getArchdeaconry().getId() : null;
        Long currentChurchId = election.getChurch() != null ? election.getChurch().getId() : null;

        Long finalDioceseId = dioceseId != null ? dioceseId : currentDioceseId;
        Long finalArchdeaconryId = archdeaconryId != null ? archdeaconryId : currentArchdeaconryId;
        Long finalChurchId = churchId != null ? churchId : currentChurchId;

        // If scope is changing, require the appropriate target ID to be provided
        if (scope != null) {
            switch (finalScope) {
                case DIOCESE:
                    if (dioceseId == null) {
                        throw new IllegalArgumentException("Diocese ID is required when changing scope to DIOCESE");
                    }
                    finalArchdeaconryId = null;
                    finalChurchId = null;
                    break;
                case ARCHDEACONRY:
                    if (archdeaconryId == null) {
                        throw new IllegalArgumentException("Archdeaconry ID is required when changing scope to ARCHDEACONRY");
                    }
                    finalDioceseId = null;
                    finalChurchId = null;
                    break;
                case CHURCH:
                    if (churchId == null) {
                        throw new IllegalArgumentException("Church ID is required when changing scope to CHURCH");
                    }
                    finalDioceseId = null;
                    finalArchdeaconryId = null;
                    break;
            }
        }

        // Create effectively-final copies for lambda usage
        final Long dioceseIdForLookup = finalDioceseId;
        final Long archdeaconryIdForLookup = finalArchdeaconryId;
        final Long churchIdForLookup = finalChurchId;

        // Load and set target entities based on final scope/ids
        Diocese finalDiocese = null;
        Archdeaconry finalArchdeaconry = null;
        Church finalChurch = null;

        switch (finalScope) {
            case DIOCESE:
                if (dioceseIdForLookup == null) {
                    throw new IllegalArgumentException("Diocese ID is required for DIOCESE scope");
                }
                if (archdeaconryIdForLookup != null || churchIdForLookup != null) {
                    throw new IllegalArgumentException("For DIOCESE scope, only dioceseId should be provided");
                }
                finalDiocese = dioceseRepository.findById(dioceseIdForLookup)
                        .orElseThrow(() -> new IllegalArgumentException("Diocese with ID " + dioceseIdForLookup + " not found"));
                break;
            case ARCHDEACONRY:
                if (archdeaconryIdForLookup == null) {
                    throw new IllegalArgumentException("Archdeaconry ID is required for ARCHDEACONRY scope");
                }
                if (dioceseIdForLookup != null || churchIdForLookup != null) {
                    throw new IllegalArgumentException("For ARCHDEACONRY scope, only archdeaconryId should be provided");
                }
                finalArchdeaconry = archdeaconryRepository.findById(archdeaconryIdForLookup)
                        .orElseThrow(() -> new IllegalArgumentException("Archdeaconry with ID " + archdeaconryIdForLookup + " not found"));
                break;
            case CHURCH:
                if (churchIdForLookup == null) {
                    throw new IllegalArgumentException("Church ID is required for CHURCH scope");
                }
                if (dioceseIdForLookup != null || archdeaconryIdForLookup != null) {
                    throw new IllegalArgumentException("For CHURCH scope, only churchId should be provided");
                }
                finalChurch = churchRepository.findById(churchIdForLookup)
                        .orElseThrow(() -> new IllegalArgumentException("Church with ID " + churchIdForLookup + " not found"));
                break;
        }

        // Update term dates if provided
        LocalDate finalTermStartDate = termStartDate != null ? termStartDate : election.getTermStartDate();
        LocalDate finalTermEndDate = termEndDate != null ? termEndDate : election.getTermEndDate();

        if (termStartDate != null || termEndDate != null) {
            if (!finalTermEndDate.isAfter(finalTermStartDate)) {
                throw new IllegalArgumentException("Term end date must be after term start date");
            }
        }

        // Update voting window if provided
        Instant finalVotingStartAt = votingStartAt != null ? votingStartAt : election.getVotingStartAt();
        Instant finalVotingEndAt = votingEndAt != null ? votingEndAt : election.getVotingEndAt();

        if (votingStartAt != null || votingEndAt != null) {
            if (!finalVotingEndAt.isAfter(finalVotingStartAt)) {
                throw new IllegalArgumentException("Voting end time must be after voting start time");
            }
        }

        // Update nomination window if provided
        if (nominationStartAt != null || nominationEndAt != null) {
            Instant finalNominationStartAt = nominationStartAt != null ? nominationStartAt : election.getNominationStartAt();
            Instant finalNominationEndAt = nominationEndAt != null ? nominationEndAt : election.getNominationEndAt();

            if (finalNominationStartAt != null && finalNominationEndAt != null) {
                if (!finalNominationEndAt.isAfter(finalNominationStartAt)) {
                    throw new IllegalArgumentException("Nomination end time must be after nomination start time");
                }
                if (finalNominationEndAt.isAfter(finalVotingEndAt)) {
                    throw new IllegalArgumentException("Nomination end time must not be after voting end time");
                }
            }
        }

        // Uniqueness check when scope/target/term changes (using multi-fellowship uniqueness rules)
        boolean uniquenessCheckNeeded = scope != null || dioceseId != null || archdeaconryId != null || churchId != null
                || termStartDate != null || termEndDate != null;
        if (uniquenessCheckNeeded) {
            boolean exists = false;
            switch (finalScope) {
                case DIOCESE:
                    exists = electionRepository.existsByScopeAndDioceseIdAndTermStartDateAndTermEndDate(
                            finalScope, dioceseIdForLookup, finalTermStartDate, finalTermEndDate);
                    break;
                case ARCHDEACONRY:
                    exists = electionRepository.existsByScopeAndArchdeaconryIdAndTermStartDateAndTermEndDate(
                            finalScope, archdeaconryIdForLookup, finalTermStartDate, finalTermEndDate);
                    break;
                case CHURCH:
                    exists = electionRepository.existsByScopeAndChurchIdAndTermStartDateAndTermEndDate(
                            finalScope, churchIdForLookup, finalTermStartDate, finalTermEndDate);
                    break;
            }
            if (exists) {
                if (!(finalScope == election.getScope()
                        && ((dioceseIdForLookup != null && election.getDiocese() != null && dioceseIdForLookup.equals(election.getDiocese().getId()))
                            || (archdeaconryIdForLookup != null && election.getArchdeaconry() != null && archdeaconryIdForLookup.equals(election.getArchdeaconry().getId()))
                            || (churchIdForLookup != null && election.getChurch() != null && churchIdForLookup.equals(election.getChurch().getId())))
                        && finalTermStartDate.equals(election.getTermStartDate())
                        && finalTermEndDate.equals(election.getTermEndDate()))) {
                    throw new IllegalArgumentException("An election already exists for this scope, target, and term period");
                }
            }
        }

        // Apply status change last (validates lifecycle)
        if (status != null) {
            validateStatusTransition(election.getStatus(), status);
            election.setStatus(status);
        }

        // Persist the calculated scope/targets and dates/windows
        election.setScope(finalScope);
        election.setDiocese(finalDiocese);
        election.setArchdeaconry(finalArchdeaconry);
        election.setChurch(finalChurch);

        if (termStartDate != null) election.setTermStartDate(termStartDate);
        if (termEndDate != null) election.setTermEndDate(termEndDate);
        if (votingStartAt != null) election.setVotingStartAt(votingStartAt);
        if (votingEndAt != null) election.setVotingEndAt(votingEndAt);
        if (nominationStartAt != null) election.setNominationStartAt(nominationStartAt);
        if (nominationEndAt != null) election.setNominationEndAt(nominationEndAt);

        return electionRepository.save(election);
    }

    /**
     * Get election by ID.
     * 
     * @param electionId election ID
     * @return Election entity
     * @throws IllegalArgumentException if not found
     */
    @Transactional(readOnly = true)
    public Election getById(Long electionId) {
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        return electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));
    }

    /**
     * List elections with filters.
     * Supports filtering by fellowship, scope, status, and target organizations.
     * 
     * @param fellowshipId fellowship ID (optional)
     * @param scope position scope (optional)
     * @param status election status (optional)
     * @param dioceseId diocese ID (optional)
     * @param archdeaconryId archdeaconry ID (optional)
     * @param churchId church ID (optional)
     * @param pageable pagination information
     * @return page of elections matching criteria
     */
    @Transactional(readOnly = true)
    public Page<Election> list(
            Long fellowshipId,
            PositionScope scope,
            ElectionStatus status,
            Long dioceseId,
            Long archdeaconryId,
            Long churchId,
            Pageable pageable) {

        // Priority-based filtering using repository methods
        if (fellowshipId != null && scope != null && status != null) {
            return electionRepository.findByFellowshipIdAndScopeAndStatus(fellowshipId, scope, status, pageable);
        } else if (fellowshipId != null && scope != null) {
            return electionRepository.findByFellowshipIdAndScope(fellowshipId, scope, pageable);
        } else if (fellowshipId != null && status != null) {
            return electionRepository.findByFellowshipIdAndStatus(fellowshipId, status, pageable);
        } else if (fellowshipId != null) {
            return electionRepository.findByFellowshipId(fellowshipId, pageable);
        } else if (scope != null && dioceseId != null) {
            return electionRepository.findByScopeAndDioceseId(scope, dioceseId, pageable);
        } else if (scope != null && archdeaconryId != null) {
            return electionRepository.findByScopeAndArchdeaconryId(scope, archdeaconryId, pageable);
        } else if (scope != null && churchId != null) {
            return electionRepository.findByScopeAndChurchId(scope, churchId, pageable);
        } else {
            // Return all if no filters provided
            return electionRepository.findAll(pageable);
        }
    }

    /**
     * Cancel an election.
     * Only allowed if election is not already PUBLISHED.
     * Sets status to CANCELLED and appends reason to description.
     * 
     * @param electionId election ID
     * @param reason cancellation reason
     * @return cancelled Election entity
     * @throws IllegalArgumentException if election not found or already published
     */
    public Election cancel(Long electionId, String reason) {
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }

        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));

        if (election.getStatus() == ElectionStatus.PUBLISHED) {
            throw new IllegalArgumentException("Cannot cancel an election that has been published");
        }

        election.setStatus(ElectionStatus.CANCELLED);

        // Append cancellation reason to description
        if (reason != null && !reason.isBlank()) {
            String currentDescription = election.getDescription() != null ? election.getDescription() : "";
            String updatedDescription = currentDescription.isBlank()
                    ? "CANCELLED: " + reason
                    : currentDescription + "\n\nCANCELLED: " + reason;

            if (updatedDescription.length() <= 1000) {
                election.setDescription(updatedDescription);
            } else {
                // Truncate if too long
                election.setDescription(updatedDescription.substring(0, 1000));
            }
        }

        return electionRepository.save(election);
    }

    /**
     * Validate status transition.
     * Enforces strict state machine for election lifecycle.
     * 
     * @param current current status
     * @param next desired next status
     * @throws IllegalArgumentException if transition is not allowed
     */
    private void validateStatusTransition(ElectionStatus current, ElectionStatus next) {
        if (current == next) {
            return; // No change, allowed
        }

        boolean allowed = false;

        switch (current) {
            case DRAFT:
                allowed = next == ElectionStatus.NOMINATION_OPEN || next == ElectionStatus.CANCELLED;
                break;

            case NOMINATION_OPEN:
                allowed = next == ElectionStatus.NOMINATION_CLOSED || next == ElectionStatus.CANCELLED;
                break;

            case NOMINATION_CLOSED:
                allowed = next == ElectionStatus.VOTING_OPEN || next == ElectionStatus.CANCELLED;
                break;

            case VOTING_OPEN:
                allowed = next == ElectionStatus.VOTING_CLOSED || next == ElectionStatus.CANCELLED;
                break;

            case VOTING_CLOSED:
                allowed = next == ElectionStatus.TALLIED || next == ElectionStatus.CANCELLED;
                break;

            case TALLIED:
                allowed = next == ElectionStatus.PUBLISHED || next == ElectionStatus.CANCELLED;
                break;

            case PUBLISHED:
                // No transitions allowed from PUBLISHED
                allowed = false;
                break;

            case CANCELLED:
                // No transitions allowed from CANCELLED
                allowed = false;
                break;
        }

        if (!allowed) {
            throw new IllegalArgumentException(
                    "Invalid status transition from " + current + " to " + next + ". " +
                    "This transition is not allowed in the election lifecycle.");
        }
    }
}
