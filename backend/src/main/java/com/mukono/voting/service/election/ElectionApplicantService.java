package com.mukono.voting.service.election;

import com.mukono.voting.model.election.*;
import com.mukono.voting.model.people.Person;
import com.mukono.voting.repository.election.*;
import com.mukono.voting.repository.people.PersonRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional
public class ElectionApplicantService {

    private final ElectionRepository electionRepository;
    private final ElectionPositionRepository electionPositionRepository;
    private final ElectionApplicantRepository electionApplicantRepository;
    private final ElectionCandidateRepository electionCandidateRepository; // optional but used for auto-create
    private final PersonRepository personRepository;

    public ElectionApplicantService(ElectionRepository electionRepository,
                                    ElectionPositionRepository electionPositionRepository,
                                    ElectionApplicantRepository electionApplicantRepository,
                                    ElectionCandidateRepository electionCandidateRepository,
                                    PersonRepository personRepository) {
        this.electionRepository = electionRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.electionApplicantRepository = electionApplicantRepository;
        this.electionCandidateRepository = electionCandidateRepository;
        this.personRepository = personRepository;
    }

    // =====================================================================
    // A) CREATE APPLICANT (MANUAL)
    // =====================================================================
    public ElectionApplicant createManualApplicant(
            Long electionId,
            Long electionPositionId,
            Long personId,
            Long submittedByPersonId,
            String notes) {

        var election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));

        var position = electionPositionRepository.findById(electionPositionId)
                .orElseThrow(() -> new IllegalArgumentException("ElectionPosition with ID " + electionPositionId + " not found"));

        // Ensure position belongs to election
        if (!position.getElection().getId().equals(election.getId())) {
            throw new IllegalArgumentException("ElectionPosition does not belong to the specified election");
        }

        var person = personRepository.findById(personId)
                .orElseThrow(() -> new IllegalArgumentException("Person with ID " + personId + " not found"));

        // Duplicate prevention
        if (electionApplicantRepository.existsByElectionIdAndElectionPositionIdAndPersonId(electionId, electionPositionId, personId)) {
            throw new IllegalArgumentException("Applicant already exists for this election position and person");
        }

        Person submittedBy = null;
        if (submittedByPersonId != null) {
            submittedBy = personRepository.findById(submittedByPersonId)
                    .orElseThrow(() -> new IllegalArgumentException("SubmittedBy person with ID " + submittedByPersonId + " not found"));
        }

        var applicant = new ElectionApplicant();
        applicant.setElection(election);
        applicant.setElectionPosition(position);
        applicant.setPerson(person);
        applicant.setSubmittedBy(submittedBy);
        applicant.setSource(ApplicantSource.MANUAL);
        applicant.setStatus(ApplicantStatus.PENDING);
        applicant.setSubmittedAt(Instant.now());
        applicant.setNotes(notes);

        return electionApplicantRepository.save(applicant);
    }

    // =====================================================================
    // A) CREATE APPLICANT (NOMINATION)
    // =====================================================================
    public ElectionApplicant nominateApplicant(
            Long electionId,
            Long electionPositionId,
            Long personId,
            Long nominatorPersonId,
            String notes) {

        var election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));

        var position = electionPositionRepository.findById(electionPositionId)
                .orElseThrow(() -> new IllegalArgumentException("ElectionPosition with ID " + electionPositionId + " not found"));

        if (!position.getElection().getId().equals(election.getId())) {
            throw new IllegalArgumentException("ElectionPosition does not belong to the specified election");
        }

        var person = personRepository.findById(personId)
                .orElseThrow(() -> new IllegalArgumentException("Person with ID " + personId + " not found"));

        // Duplicate prevention
        if (electionApplicantRepository.existsByElectionIdAndElectionPositionIdAndPersonId(electionId, electionPositionId, personId)) {
            throw new IllegalArgumentException("Applicant already exists for this election position and person");
        }

        var nominator = personRepository.findById(nominatorPersonId)
                .orElseThrow(() -> new IllegalArgumentException("Nominator person with ID " + nominatorPersonId + " not found"));

        var applicant = new ElectionApplicant();
        applicant.setElection(election);
        applicant.setElectionPosition(position);
        applicant.setPerson(person);
        applicant.setSubmittedBy(nominator);
        applicant.setSource(ApplicantSource.NOMINATION);
        applicant.setStatus(ApplicantStatus.PENDING);
        applicant.setSubmittedAt(Instant.now());
        applicant.setNotes(notes);

        return electionApplicantRepository.save(applicant);
    }

    // =====================================================================
    // B) DECISION ACTIONS
    // =====================================================================
    public ElectionApplicant approveApplicant(Long applicantId, String decisionBy, String notes) {
        var applicant = getById(applicantId);

        if (applicant.getStatus() != ApplicantStatus.PENDING) {
            throw new IllegalArgumentException("Only pending applicants can be approved");
        }

        applicant.setStatus(ApplicantStatus.APPROVED);
        applicant.setDecisionAt(Instant.now());
        applicant.setDecisionBy(decisionBy);
        applicant.setNotes(notes);

        // Auto-create candidate if not exists
        if (!electionCandidateRepository.existsByElectionIdAndElectionPositionIdAndPersonId(
                applicant.getElection().getId(),
                applicant.getElectionPosition().getId(),
                applicant.getPerson().getId())) {

            var candidate = new ElectionCandidate();
            candidate.setElection(applicant.getElection());
            candidate.setElectionPosition(applicant.getElectionPosition());
            candidate.setPerson(applicant.getPerson());
            candidate.setApplicant(applicant);
            electionCandidateRepository.save(candidate);
        }

        return electionApplicantRepository.save(applicant);
    }

    public ElectionApplicant rejectApplicant(Long applicantId, String decisionBy, String notes) {
        var applicant = getById(applicantId);

        if (applicant.getStatus() != ApplicantStatus.PENDING) {
            throw new IllegalArgumentException("Only pending applicants can be rejected");
        }

        applicant.setStatus(ApplicantStatus.REJECTED);
        applicant.setDecisionAt(Instant.now());
        applicant.setDecisionBy(decisionBy);
        applicant.setNotes(notes);

        return electionApplicantRepository.save(applicant);
    }

    public ElectionApplicant withdrawApplicant(Long applicantId, String decisionBy, String notes) {
        var applicant = getById(applicantId);

        if (applicant.getStatus() != ApplicantStatus.PENDING && applicant.getStatus() != ApplicantStatus.APPROVED) {
            throw new IllegalArgumentException("Only pending or approved applicants can be withdrawn");
        }

        applicant.setStatus(ApplicantStatus.WITHDRAWN);
        applicant.setDecisionAt(Instant.now());
        applicant.setDecisionBy(decisionBy);
        applicant.setNotes(notes);

        // If candidate exists, remove candidate (to keep ballot accurate)
        var candidateOpt = electionCandidateRepository.findByElectionIdAndElectionPositionIdAndPersonId(
                applicant.getElection().getId(),
                applicant.getElectionPosition().getId(),
                applicant.getPerson().getId());
        candidateOpt.ifPresent(electionCandidateRepository::delete);

        return electionApplicantRepository.save(applicant);
    }

    public ElectionApplicant revertToPending(Long applicantId, String decisionBy, String notes) {
        var applicant = getById(applicantId);

        if (applicant.getStatus() != ApplicantStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved applicants can be reverted to pending");
        }

        // Remove candidate if exists
        var candidateOpt = electionCandidateRepository.findByElectionIdAndElectionPositionIdAndPersonId(
                applicant.getElection().getId(),
                applicant.getElectionPosition().getId(),
                applicant.getPerson().getId());
        candidateOpt.ifPresent(electionCandidateRepository::delete);

        applicant.setStatus(ApplicantStatus.PENDING);
        applicant.setDecisionAt(Instant.now());
        applicant.setDecisionBy(decisionBy);
        applicant.setNotes(notes);

        return electionApplicantRepository.save(applicant);
    }

    // =====================================================================
    // C) QUERIES
    // =====================================================================
    @Transactional(readOnly = true)
    public ElectionApplicant getById(Long applicantId) {
        if (applicantId == null) {
            throw new IllegalArgumentException("Applicant ID is required");
        }
        return electionApplicantRepository.findById(applicantId)
                .orElseThrow(() -> new IllegalArgumentException("Applicant with ID " + applicantId + " not found"));
    }

    @Transactional(readOnly = true)
    public Page<ElectionApplicant> listApplicants(Long electionId, ApplicantStatus status, ApplicantSource source, Pageable pageable) {
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        // election must exist to avoid confusion
        if (!electionRepository.existsById(electionId)) {
            throw new IllegalArgumentException("Election with ID " + electionId + " not found");
        }

        if (status == null && source == null) {
            return electionApplicantRepository.findByElectionId(electionId, pageable);
        } else if (status != null && source == null) {
            return electionApplicantRepository.findByElectionIdAndStatus(electionId, status, pageable);
        } else if (status == null) { // source != null
            return electionApplicantRepository.findByElectionIdAndSource(electionId, source, pageable);
        } else {
            return electionApplicantRepository.findByElectionIdAndStatusAndSource(electionId, status, source, pageable);
        }
    }

    @Transactional(readOnly = true)
    public Page<ElectionApplicant> listPendingApplicants(Long electionId, Pageable pageable) {
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        if (!electionRepository.existsById(electionId)) {
            throw new IllegalArgumentException("Election with ID " + electionId + " not found");
        }
        return electionApplicantRepository.findPendingApplicantsForElection(electionId, pageable);
    }

    @Transactional(readOnly = true)
    public long countApplicantsByStatus(Long electionId, ApplicantStatus status) {
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        if (status == null) {
            throw new IllegalArgumentException("Status is required");
        }
        if (!electionRepository.existsById(electionId)) {
            throw new IllegalArgumentException("Election with ID " + electionId + " not found");
        }
        return electionApplicantRepository.countByElectionIdAndStatus(electionId, status);
    }
}
