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
import java.util.List;

@Service
@Transactional
public class ElectionCandidateService {

    private final ElectionRepository electionRepository;
    private final ElectionPositionRepository electionPositionRepository;
    private final ElectionCandidateRepository electionCandidateRepository;
    private final ElectionApplicantRepository electionApplicantRepository;
    private final PersonRepository personRepository;

    public ElectionCandidateService(ElectionRepository electionRepository,
                                    ElectionPositionRepository electionPositionRepository,
                                    ElectionCandidateRepository electionCandidateRepository,
                                    ElectionApplicantRepository electionApplicantRepository,
                                    PersonRepository personRepository) {
        this.electionRepository = electionRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.electionCandidateRepository = electionCandidateRepository;
        this.electionApplicantRepository = electionApplicantRepository;
        this.personRepository = personRepository;
    }

    // =====================================================================
    // A) CANDIDATE FROM APPLICANT
    // =====================================================================
    public ElectionCandidate createCandidateFromApplicant(Long applicantId, String createdBy) {
        var applicant = electionApplicantRepository.findById(applicantId)
                .orElseThrow(() -> new IllegalArgumentException("Applicant with ID " + applicantId + " not found"));

        if (applicant.getStatus() != ApplicantStatus.APPROVED) {
            throw new IllegalArgumentException("Candidate can only be created from an APPROVED applicant");
        }

        Long electionId = applicant.getElection().getId();
        Long positionId = applicant.getElectionPosition().getId();
        Long personId = applicant.getPerson().getId();

        if (electionCandidateRepository.existsByElectionIdAndElectionPositionIdAndPersonId(electionId, positionId, personId)) {
            throw new IllegalArgumentException("Candidate already exists for this election position and person");
        }

        var candidate = new ElectionCandidate();
        candidate.setElection(applicant.getElection());
        candidate.setElectionPosition(applicant.getElectionPosition());
        candidate.setPerson(applicant.getPerson());
        candidate.setApplicant(applicant);

        return electionCandidateRepository.save(candidate);
    }

    public int generateCandidatesForPosition(Long electionId, Long electionPositionId, String createdBy) {
        // Validate election and position linkage
        var election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));
        var position = electionPositionRepository.findById(electionPositionId)
                .orElseThrow(() -> new IllegalArgumentException("ElectionPosition with ID " + electionPositionId + " not found"));
        if (!position.getElection().getId().equals(election.getId())) {
            throw new IllegalArgumentException("ElectionPosition does not belong to the specified election");
        }

        // Pull all approved applicants for election + position, create candidates if missing
        var page = electionApplicantRepository.findByElectionIdAndElectionPositionIdAndStatus(
                electionId, electionPositionId, ApplicantStatus.APPROVED, Pageable.unpaged());

        int created = 0;
        for (var applicant : page.getContent()) {
            Long personId = applicant.getPerson().getId();
            if (!electionCandidateRepository.existsByElectionIdAndElectionPositionIdAndPersonId(electionId, electionPositionId, personId)) {
                var candidate = new ElectionCandidate();
                candidate.setElection(applicant.getElection());
                candidate.setElectionPosition(applicant.getElectionPosition());
                candidate.setPerson(applicant.getPerson());
                candidate.setApplicant(applicant);
                electionCandidateRepository.save(candidate);
                created++;
            }
        }
        return created;
    }

    // =====================================================================
    // B) DIRECT CANDIDATE ADD (with audit applicant)
    // =====================================================================
    public ElectionCandidate addCandidateDirect(
            Long electionId,
            Long electionPositionId,
            Long personId,
            String decisionBy,
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

        // Prevent duplicate candidate
        if (electionCandidateRepository.existsByElectionIdAndElectionPositionIdAndPersonId(electionId, electionPositionId, personId)) {
            throw new IllegalArgumentException("Candidate already exists for this election position and person");
        }

        // Ensure an approved applicant exists (create one if necessary)
        ElectionApplicant applicant = electionApplicantRepository
                .findByElectionIdAndElectionPositionIdAndPersonId(electionId, electionPositionId, personId)
                .orElse(null);

        if (applicant == null) {
            applicant = new ElectionApplicant();
            applicant.setElection(election);
            applicant.setElectionPosition(position);
            applicant.setPerson(person);
            applicant.setSource(ApplicantSource.MANUAL);
            applicant.setStatus(ApplicantStatus.APPROVED);
            applicant.setSubmittedAt(Instant.now());
            applicant.setDecisionAt(Instant.now());
            applicant.setDecisionBy(decisionBy);
            applicant.setNotes(notes);
            applicant = electionApplicantRepository.save(applicant);
        } else {
            // If applicant exists but not approved, approve it
            if (applicant.getStatus() != ApplicantStatus.APPROVED) {
                applicant.setStatus(ApplicantStatus.APPROVED);
                applicant.setDecisionAt(Instant.now());
                applicant.setDecisionBy(decisionBy);
                applicant.setNotes(notes);
                applicant = electionApplicantRepository.save(applicant);
            }
        }

        // Create candidate linked to applicant
        var candidate = new ElectionCandidate();
        candidate.setElection(election);
        candidate.setElectionPosition(position);
        candidate.setPerson(person);
        candidate.setApplicant(applicant);

        return electionCandidateRepository.save(candidate);
    }

    // =====================================================================
    // C) QUERIES
    // =====================================================================
    @Transactional(readOnly = true)
    public Page<ElectionCandidate> listCandidates(Long electionId, Pageable pageable) {
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        if (!electionRepository.existsById(electionId)) {
            throw new IllegalArgumentException("Election with ID " + electionId + " not found");
        }
        return electionCandidateRepository.findByElectionId(electionId, pageable);
    }

    @Transactional(readOnly = true)
    public List<ElectionCandidate> listCandidatesForBallot(Long electionId, Long electionPositionId) {
        if (electionId == null || electionPositionId == null) {
            throw new IllegalArgumentException("Election ID and ElectionPosition ID are required");
        }
        // Validate linkage
        var election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));
        var position = electionPositionRepository.findById(electionPositionId)
                .orElseThrow(() -> new IllegalArgumentException("ElectionPosition with ID " + electionPositionId + " not found"));
        if (!position.getElection().getId().equals(election.getId())) {
            throw new IllegalArgumentException("ElectionPosition does not belong to the specified election");
        }
        return electionCandidateRepository.findCandidatesForBallot(electionId, electionPositionId);
    }

    public void removeCandidate(Long electionId, Long electionPositionId, Long personId, String removedBy, String notes) {
        if (electionId == null || electionPositionId == null || personId == null) {
            throw new IllegalArgumentException("Election ID, ElectionPosition ID, and Person ID are required");
        }
        // Remove candidate if exists
        var candidateOpt = electionCandidateRepository.findByElectionIdAndElectionPositionIdAndPersonId(
                electionId, electionPositionId, personId);
        candidateOpt.ifPresent(electionCandidateRepository::delete);

        // Optionally update applicant to WITHDRAWN for audit
        var applicantOpt = electionApplicantRepository.findByElectionIdAndElectionPositionIdAndPersonId(
                electionId, electionPositionId, personId);
        applicantOpt.ifPresent(applicant -> {
            if (applicant.getStatus() == ApplicantStatus.APPROVED) {
                applicant.setStatus(ApplicantStatus.WITHDRAWN);
                applicant.setDecisionAt(Instant.now());
                applicant.setDecisionBy(removedBy);
                applicant.setNotes(notes);
                electionApplicantRepository.save(applicant);
            }
        });
    }
}
