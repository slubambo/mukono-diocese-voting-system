package com.mukono.voting.service.election;

import com.mukono.voting.model.election.*;
import com.mukono.voting.model.people.Person;
import com.mukono.voting.repository.election.ElectionRepository;
import com.mukono.voting.repository.election.VotingCodeRepository;
import com.mukono.voting.repository.election.VotingPeriodRepository;
import com.mukono.voting.repository.people.PersonRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for managing voting codes lifecycle.
 * 
 * Voting codes are single-use credentials issued to eligible voters by DS/Polling Officers.
 * They enable voters to access the ballot during a specific Election + Voting Period.
 * 
 * Business Rules:
 * - Code must be globally unique
 * - Person must be eligible for the election + voting period
 * - Only ACTIVE codes can be used or revoked
 * - Codes are never deleted (audit trail)
 * 
 * Lifecycle States:
 * - ACTIVE: Code is issued and ready for use
 * - USED: Code has been used to access the ballot
 * - REVOKED: Code has been revoked by an admin
 * - EXPIRED: Code has expired (voting period closed)
 */
@Service
@Transactional
public class VotingCodeService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous chars
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final VotingCodeRepository votingCodeRepository;
    private final ElectionRepository electionRepository;
    private final VotingPeriodRepository votingPeriodRepository;
    private final PersonRepository personRepository;
    private final ElectionVoterEligibilityService eligibilityService;

    @Autowired
    public VotingCodeService(
            VotingCodeRepository votingCodeRepository,
            ElectionRepository electionRepository,
            VotingPeriodRepository votingPeriodRepository,
            PersonRepository personRepository,
            ElectionVoterEligibilityService eligibilityService) {
        this.votingCodeRepository = votingCodeRepository;
        this.electionRepository = electionRepository;
        this.votingPeriodRepository = votingPeriodRepository;
        this.personRepository = personRepository;
        this.eligibilityService = eligibilityService;
    }

    /**
     * Issue a new voting code to an eligible voter.
     * 
     * Rules:
     * - Validate election + voting period linkage
     * - Validate voter eligibility
     * - Ensure no ACTIVE code exists for same person + election + period
     * - Generate secure short code (10 chars)
     * - Persist as ACTIVE
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param personId the voter person ID
     * @param issuedByPersonId the issuer person ID (DS/Polling Officer)
     * @param remarks optional remarks
     * @return the issued voting code
     * @throws IllegalArgumentException if validation fails
     */
    public VotingCode issueCode(
            Long electionId,
            Long votingPeriodId,
            Long personId,
            Long issuedByPersonId,
            String remarks) {
        
        // Validate election
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));
        
        // Validate voting period
        VotingPeriod votingPeriod = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Voting period not found: " + votingPeriodId));
        
        // Validate election + voting period linkage
        if (!votingPeriod.getElection().getId().equals(electionId)) {
            throw new IllegalArgumentException(
                    "Voting period " + votingPeriodId + " does not belong to election " + electionId);
        }
        
        // Validate person (voter)
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new IllegalArgumentException("Person not found: " + personId));
        
        // Validate issuer
        Person issuedBy = personRepository.findById(issuedByPersonId)
                .orElseThrow(() -> new IllegalArgumentException("Issuer person not found: " + issuedByPersonId));
        
        // Check voter eligibility for this voting period
        EligibilityDecision eligibility = eligibilityService.checkEligibility(electionId, votingPeriodId, personId);
        if (!eligibility.isEligible()) {
            throw new IllegalArgumentException(
                    "Person " + personId + " is not eligible for election " + electionId + " voting period " + votingPeriodId + ": " + eligibility.getReason());
        }
        
        // Check for existing ACTIVE code
        Optional<VotingCode> existingCode = votingCodeRepository
                .findByElectionIdAndVotingPeriodIdAndPersonIdAndStatus(
                        electionId, votingPeriodId, personId, VotingCodeStatus.ACTIVE);
        
        if (existingCode.isPresent()) {
            throw new IllegalArgumentException(
                    "Person " + personId + " already has an ACTIVE voting code for this election + voting period");
        }
        
        // Generate unique code
        String code = generateUniqueCode();
        
        // Create voting code
        VotingCode votingCode = new VotingCode(election, votingPeriod, person, code, issuedBy);
        votingCode.setRemarks(remarks);
        
        return votingCodeRepository.save(votingCode);
    }

    /**
     * Validate a voting code for use.
     * 
     * Rules:
     * - Code must exist
     * - Must be ACTIVE
     * - Must belong to an OPEN voting period
     * 
     * Note: Does NOT mark code as USED. Use markCodeUsed() for that.
     * 
     * @param code the voting code string
     * @return the voting code if valid
     * @throws IllegalArgumentException if validation fails
     */
    @Transactional(readOnly = true)
    public VotingCode validateCode(String code) {
        // Find code
        VotingCode votingCode = votingCodeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Voting code not found: " + code));
        
        // Check status
        if (votingCode.getStatus() != VotingCodeStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "Voting code is not active. Status: " + votingCode.getStatus());
        }
        
        // Check voting period status
        if (votingCode.getVotingPeriod().getStatus() != VotingPeriodStatus.OPEN) {
            throw new IllegalArgumentException(
                    "Voting period is not open. Status: " + votingCode.getVotingPeriod().getStatus());
        }
        
        return votingCode;
    }

    /**
     * Mark a voting code as USED.
     * 
     * Rules:
     * - Must be ACTIVE
     * - Transition → USED
     * - Set usedAt
     * - Idempotent (if already USED, no-op)
     * 
     * @param code the voting code string
     * @throws IllegalArgumentException if code not found or invalid state
     */
    public void markCodeUsed(String code) {
        VotingCode votingCode = votingCodeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Voting code not found: " + code));
        
        // Idempotent check
        if (votingCode.getStatus() == VotingCodeStatus.USED) {
            return; // Already used, no-op
        }
        
        // Validate state
        if (votingCode.getStatus() != VotingCodeStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "Cannot mark code as USED. Current status: " + votingCode.getStatus());
        }
        
        // Mark as used
        votingCode.setStatus(VotingCodeStatus.USED);
        votingCode.setUsedAt(LocalDateTime.now());
        
        votingCodeRepository.save(votingCode);
    }

    /**
     * Revoke a voting code.
     * 
     * Rules:
     * - Only ACTIVE can be revoked
     * - Set revokedAt, revokedBy, status=REVOKED
     * 
     * @param votingCodeId the voting code ID
     * @param revokedByPersonId the person ID who revoked it
     * @param reason the reason for revocation
     * @throws IllegalArgumentException if validation fails
     */
    public void revokeCode(Long votingCodeId, Long revokedByPersonId, String reason) {
        VotingCode votingCode = votingCodeRepository.findById(votingCodeId)
                .orElseThrow(() -> new IllegalArgumentException("Voting code not found: " + votingCodeId));
        
        // Validate status
        if (votingCode.getStatus() != VotingCodeStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "Cannot revoke code. Current status: " + votingCode.getStatus());
        }
        
        // Validate revoker
        Person revokedBy = personRepository.findById(revokedByPersonId)
                .orElseThrow(() -> new IllegalArgumentException("Revoker person not found: " + revokedByPersonId));
        
        // Revoke code
        votingCode.setStatus(VotingCodeStatus.REVOKED);
        votingCode.setRevokedAt(LocalDateTime.now());
        votingCode.setRevokedBy(revokedBy);
        votingCode.setRemarks(reason);
        
        votingCodeRepository.save(votingCode);
    }

    /**
     * Regenerate a voting code for a person.
     * 
     * Rules:
     * - Revoke existing ACTIVE code
     * - Create new ACTIVE code
     * - Both actions must be atomic (@Transactional)
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param personId the voter person ID
     * @param issuedByPersonId the issuer person ID
     * @param reason the reason for regeneration
     * @return the new voting code
     * @throws IllegalArgumentException if validation fails
     */
    public VotingCode regenerateCode(
            Long electionId,
            Long votingPeriodId,
            Long personId,
            Long issuedByPersonId,
            String reason) {
        
        // Find existing ACTIVE code
        Optional<VotingCode> existingCodeOpt = votingCodeRepository
                .findByElectionIdAndVotingPeriodIdAndPersonIdAndStatus(
                        electionId, votingPeriodId, personId, VotingCodeStatus.ACTIVE);
        
        if (existingCodeOpt.isEmpty()) {
            throw new IllegalArgumentException(
                    "No ACTIVE voting code found for person " + personId + " in this election + voting period");
        }
        
        VotingCode existingCode = existingCodeOpt.get();
        
        // Revoke existing code
        revokeCode(existingCode.getId(), issuedByPersonId, "Regenerated: " + reason);
        
        // Issue new code
        return issueCode(electionId, votingPeriodId, personId, issuedByPersonId, "Regenerated: " + reason);
    }

    /**
     * List voting codes for an election + voting period (paginated).
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param status optional status filter
     * @param pageable pagination information
     * @return page of voting codes
     */
    @Transactional(readOnly = true)
    public Page<VotingCode> listCodes(
            Long electionId,
            Long votingPeriodId,
            VotingCodeStatus status,
            Pageable pageable) {
        
        if (status != null) {
            return votingCodeRepository.findByElectionIdAndVotingPeriodIdAndStatus(
                    electionId, votingPeriodId, status, pageable);
        } else {
            return votingCodeRepository.findByElectionIdAndVotingPeriodId(
                    electionId, votingPeriodId, pageable);
        }
    }

    /**
     * Count voting codes for an election + voting period.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param status optional status filter
     * @return count of voting codes
     */
    @Transactional(readOnly = true)
    public long countCodes(Long electionId, Long votingPeriodId, VotingCodeStatus status) {
        if (status != null) {
            return votingCodeRepository.countByElectionIdAndVotingPeriodIdAndStatus(
                    electionId, votingPeriodId, status);
        } else {
            return votingCodeRepository.countByElectionIdAndVotingPeriodId(
                    electionId, votingPeriodId);
        }
    }

    /**
     * Generate a unique, secure, short voting code.
     * 
     * Format: 8 uppercase alphanumeric characters (excludes ambiguous characters like 0, O, I, 1)
     * Example: A3K7P2QW9R
     * 
     * @return a unique voting code
     */
    private String generateUniqueCode() {
        String code;
        int attempts = 0;
        int maxAttempts = 10;
        
        do {
            code = generateRandomCode();
            attempts++;
            
            if (attempts > maxAttempts) {
                throw new IllegalStateException(
                        "Failed to generate unique voting code after " + maxAttempts + " attempts");
            }
        } while (votingCodeRepository.existsByCode(code));
        
        return code;
    }

    /**
     * Generate a random code string.
     * 
     * @return a random code
     */
    private String generateRandomCode() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return code.toString();
    }

    // ============ HARDENING: LIFECYCLE VALIDATION & EXPIRATION ============

    /**
     * Validate voting period is suitable for issuing codes.
     * Rules:
     * - Status must be SCHEDULED or OPEN
     * - Current time must be before endTime
     */
    private void validatePeriodForIssue(VotingPeriod votingPeriod) {
        VotingPeriodStatus status = votingPeriod.getStatus();
        
        if (status == VotingPeriodStatus.CLOSED || status == VotingPeriodStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Voting period is " + status + "; cannot issue codes");
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(votingPeriod.getEndTime())) {
            throw new IllegalArgumentException(
                    "Voting period has ended; cannot issue codes");
        }
    }

    /**
     * Validate voting period is suitable for voting (F1 validate).
     * Rules:
     * - Status must be OPEN
     * - Current time must be within [startTime, endTime)
     */
    private void validatePeriodForVoting(VotingPeriod votingPeriod) {
        VotingPeriodStatus status = votingPeriod.getStatus();
        
        if (status != VotingPeriodStatus.OPEN) {
            throw new IllegalArgumentException(
                    "Voting is not OPEN for this period. Status: " + status);
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(votingPeriod.getStartTime()) || !now.isBefore(votingPeriod.getEndTime())) {
            throw new IllegalArgumentException(
                    "Voting is not within the period time window");
        }
    }

    /**
     * Validate voting code lifecycle transitions (immutability of terminal states).
     * Rules:
     * - USED, REVOKED, EXPIRED are terminal (no transitions out)
     * - ACTIVE can transition to USED, REVOKED, or EXPIRED
     */
    private void validateTransition(VotingCodeStatus currentStatus, VotingCodeStatus targetStatus) {
        if (currentStatus == VotingCodeStatus.USED) {
            throw new IllegalArgumentException(
                    "Cannot transition from USED. Voting codes are immutable once used");
        }
        if (currentStatus == VotingCodeStatus.REVOKED) {
            throw new IllegalArgumentException(
                    "Cannot transition from REVOKED. Code is permanently revoked");
        }
        if (currentStatus == VotingCodeStatus.EXPIRED) {
            throw new IllegalArgumentException(
                    "Cannot transition from EXPIRED. Code is permanently expired");
        }
    }

    /**
     * Expire all ACTIVE codes for a voting period.
     * Called when period transitions to CLOSED or CANCELLED.
     * Atomic operation.
     */
    public int expireActiveCodesForPeriod(Long electionId, Long votingPeriodId) {
        LocalDateTime now = LocalDateTime.now();
        return votingCodeRepository.expireActiveCodesForPeriod(electionId, votingPeriodId, now);
    }

    /**
     * Regenerate a voting code with concurrency safety.
     * Uses pessimistic locking to prevent concurrent modifications.
     */
    public VotingCode regenerateCodeSafe(
            Long electionId,
            Long votingPeriodId,
            Long personId,
            Long issuedByPersonId,
            String reason) {
        
        // Fetch with pessimistic lock
        Optional<VotingCode> existingCodeOpt = votingCodeRepository.findActiveForUpdate(
                electionId, votingPeriodId, personId);
        
        if (existingCodeOpt.isEmpty()) {
            throw new IllegalArgumentException(
                    "No ACTIVE voting code found for person in this election + voting period");
        }
        
        VotingCode existingCode = existingCodeOpt.get();
        
        // Validate period is suitable for new issue
        VotingPeriod votingPeriod = existingCode.getVotingPeriod();
        validatePeriodForIssue(votingPeriod);
        
        // Revoke and issue new (atomic via @Transactional)
        revokeCode(existingCode.getId(), issuedByPersonId, "Regenerated: " + reason);
        return issueCode(electionId, votingPeriodId, personId, issuedByPersonId, "Regenerated: " + reason);
    }

    /**
     * Mark a voting code as USED with enhanced validation and idempotency.
     * Period must be OPEN and within time window.
     * Idempotent: if already USED, returns success (no-op).
     */
    public void markCodeUsedSafe(String code) {
        VotingCode votingCode = votingCodeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Voting code not found"));
        
        // Idempotent: if already USED, no-op
        if (votingCode.getStatus() == VotingCodeStatus.USED) {
            return;
        }
        
        // Validate transition (no transitions out of REVOKED/EXPIRED)
        validateTransition(votingCode.getStatus(), VotingCodeStatus.USED);
        
        // Validate period is OPEN and within time window
        VotingPeriod period = votingCode.getVotingPeriod();
        validatePeriodForVoting(period);
        
        votingCode.setStatus(VotingCodeStatus.USED);
        votingCode.setUsedAt(LocalDateTime.now());
        votingCodeRepository.save(votingCode);
    }

    /**
     * Mark a voting code as USED by ID with enhanced validation and idempotency.
     * Period must be OPEN and within time window.
     * Idempotent: if already USED, returns success (no-op).
     */
    public void markCodeUsedSafeById(Long codeId) {
        VotingCode votingCode = votingCodeRepository.findById(codeId)
                .orElseThrow(() -> new IllegalArgumentException("Voting code not found"));

        if (votingCode.getStatus() == VotingCodeStatus.USED) {
            return;
        }

        validateTransition(votingCode.getStatus(), VotingCodeStatus.USED);

        VotingPeriod period = votingCode.getVotingPeriod();
        validatePeriodForVoting(period);

        votingCode.setStatus(VotingCodeStatus.USED);
        votingCode.setUsedAt(LocalDateTime.now());
        votingCodeRepository.save(votingCode);
    }

    /**
     * Validate a voting code for use with enhanced checks.
     * Must be ACTIVE, period must be OPEN, within time window.
     * Does not mark code as USED.
     */
    @Transactional(readOnly = true)
    public VotingCode validateCodeSafe(String code) {
        VotingCode votingCode = votingCodeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Voting code not found"));
        
        if (votingCode.getStatus() != VotingCodeStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "Voting code is " + votingCode.getStatus() + "; cannot use");
        }
        
        VotingPeriod period = votingCode.getVotingPeriod();
        validatePeriodForVoting(period);
        
        return votingCode;
    }
}
