package com.mukono.voting.service.election;

import com.mukono.voting.model.election.*;
import com.mukono.voting.model.people.Person;
import com.mukono.voting.payload.response.BallotGroupedByPositionResponse;
import com.mukono.voting.payload.response.BallotPreviewResponse;
import com.mukono.voting.payload.response.ElectionCandidateResponse;
import com.mukono.voting.repository.election.*;
import com.mukono.voting.repository.people.PersonRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ElectionCandidateService {

    private final ElectionRepository electionRepository;
    private final ElectionPositionRepository electionPositionRepository;
    private final ElectionCandidateRepository electionCandidateRepository;
    private final ElectionApplicantRepository electionApplicantRepository;
    private final PersonRepository personRepository;
    private final VotingPeriodPositionRepository votingPeriodPositionRepository;
    private final VotingPeriodRepository votingPeriodRepository;

    public ElectionCandidateService(
            ElectionRepository electionRepository,
            ElectionPositionRepository electionPositionRepository,
            ElectionCandidateRepository electionCandidateRepository,
            ElectionApplicantRepository electionApplicantRepository,
            PersonRepository personRepository,
            VotingPeriodPositionRepository votingPeriodPositionRepository,
            VotingPeriodRepository votingPeriodRepository) {
        this.electionRepository = electionRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.electionCandidateRepository = electionCandidateRepository;
        this.electionApplicantRepository = electionApplicantRepository;
        this.personRepository = personRepository;
        this.votingPeriodPositionRepository = votingPeriodPositionRepository;
        this.votingPeriodRepository = votingPeriodRepository;
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

    /**
     * Get ballot candidates grouped by position.
     * Optionally filter by voting period if votingPeriodId is provided.
     *
     * @param electionId the election ID
     * @param votingPeriodId optional voting period ID to filter positions
     * @return grouped ballot response
     */
    @Transactional(readOnly = true)
    public BallotGroupedByPositionResponse listBallotGroupedByPosition(Long electionId, Long votingPeriodId) {
        if (electionId == null) {
            throw new IllegalArgumentException("Election ID is required");
        }
        // Validate election exists
        var election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));

        // Get all candidates for the election with details
        List<ElectionCandidate> candidates = electionCandidateRepository.findAllCandidatesForElectionWithDetails(electionId);

        // If votingPeriodId is provided, filter to only positions in that period
        Set<Long> positionIds = candidates.stream()
                .map(c -> c.getElectionPosition().getId())
                .collect(Collectors.toSet());

        if (votingPeriodId != null) {
            List<Long> periodPositionIds = votingPeriodPositionRepository
                    .findElectionPositionIdsByVotingPeriod(electionId, votingPeriodId);
            positionIds.retainAll(periodPositionIds);
        }

        // Group candidates by position
        Map<Long, List<ElectionCandidate>> byPosition = candidates.stream()
                .filter(c -> positionIds.contains(c.getElectionPosition().getId()))
                .collect(Collectors.groupingBy(c -> c.getElectionPosition().getId(), Collectors.toList()));

        // Build grouped response
        List<BallotGroupedByPositionResponse.PositionGroup> groups = new ArrayList<>();
        for (Long posId : byPosition.keySet()) {
            var position = electionPositionRepository.findById(posId).orElse(null);
            if (position == null) continue;

            var candidatesList = byPosition.get(posId).stream()
                    .map(ElectionCandidateResponse::fromEntity)
                    .collect(Collectors.toList());

            var group = new BallotGroupedByPositionResponse.PositionGroup(
                    position.getId(),
                    position.getFellowshipPosition().getTitle().getName(),
                    position.getFellowship().getName(),
                    position.getFellowship().getId(),
                    position.getSeats(),
                    mapPositionScope(position.getFellowshipPosition().getScope()),
                    candidatesList
            );
            groups.add(group);
        }

        // Sort by position ID for stable ordering
        groups.sort(Comparator.comparing(BallotGroupedByPositionResponse.PositionGroup::getElectionPositionId));

        return new BallotGroupedByPositionResponse(groups);
    }

    private BallotGroupedByPositionResponse.PositionScope mapPositionScope(
            com.mukono.voting.model.leadership.PositionScope scope) {
        if (scope == null) return null;
        return BallotGroupedByPositionResponse.PositionScope.valueOf(scope.name());
    }

    /**
     * Build ballot preview grouped by position, honoring voting period assignments.
     */
    @Transactional(readOnly = true)
    public BallotPreviewResponse ballotPreview(Long electionId, Long votingPeriodId, Long electionPositionId) {
        if (electionId == null) throw new IllegalArgumentException("Election ID is required");
        var election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election with ID " + electionId + " not found"));

        // Validate voting period linkage if provided
        if (votingPeriodId != null) {
            var vp = votingPeriodRepository.findById(votingPeriodId)
                    .orElseThrow(() -> new IllegalArgumentException("Voting period with ID " + votingPeriodId + " not found"));
            if (!vp.getElection().getId().equals(electionId)) {
                throw new IllegalArgumentException("Voting period does not belong to election " + electionId);
            }
        }

        // Determine eligible position IDs
        Set<Long> positionIds = new HashSet<>();
        if (electionPositionId != null) {
            var pos = electionPositionRepository.findById(electionPositionId)
                    .orElseThrow(() -> new IllegalArgumentException("ElectionPosition with ID " + electionPositionId + " not found"));
            if (!pos.getElection().getId().equals(electionId)) {
                throw new IllegalArgumentException("ElectionPosition does not belong to election " + electionId);
            }
            positionIds.add(electionPositionId);
        } else if (votingPeriodId != null) {
            positionIds.addAll(votingPeriodPositionRepository.findElectionPositionIdsByVotingPeriod(electionId, votingPeriodId));
        } else {
            positionIds.addAll(electionPositionRepository.findByElectionIdOrderByIdAsc(electionId)
                    .stream().map(ElectionPosition::getId).toList());
        }

        // Fetch all positions in scope
        var positions = electionPositionRepository.findAllById(positionIds)
                .stream()
                .filter(p -> p.getElection().getId().equals(electionId))
                .sorted(Comparator.comparing(ElectionPosition::getId))
                .toList();

        // Fetch all candidates with details then group by position
        List<ElectionCandidate> allCandidates = electionCandidateRepository.findAllCandidatesForElectionWithDetails(electionId);
        Map<Long, List<ElectionCandidate>> byPosition = allCandidates.stream()
                .filter(c -> positionIds.contains(c.getElectionPosition().getId()))
                .collect(Collectors.groupingBy(c -> c.getElectionPosition().getId()));

        // Build DTO
        BallotPreviewResponse response = new BallotPreviewResponse();
        response.setElectionId(electionId);
        response.setVotingPeriodId(votingPeriodId);
        response.setBallotTitle(election.getName());

        List<BallotPreviewResponse.Position> positionDtos = new ArrayList<>();
        for (ElectionPosition p : positions) {
            BallotPreviewResponse.Position dto = new BallotPreviewResponse.Position();
            dto.setElectionPositionId(p.getId());
            dto.setPositionTitle(p.getFellowshipPosition().getTitle().getName());
            dto.setFellowshipName(p.getFellowship().getName());
            dto.setFellowshipId(p.getFellowship().getId());
            dto.setScope(p.getFellowshipPosition().getScope());
            dto.setSeats(p.getSeats());
            dto.setMaxVotesPerVoter(p.getMaxVotesPerVoter());

            List<BallotPreviewResponse.Candidate> candidateDtos = byPosition.getOrDefault(p.getId(), List.of()).stream()
                    .sorted(Comparator.comparing(c -> c.getPerson().getFullName()))
                    .map(c -> {
                        BallotPreviewResponse.Candidate cd = new BallotPreviewResponse.Candidate();
                        cd.setCandidateId(c.getId());
                        cd.setPersonId(c.getPerson().getId());
                        cd.setFullName(c.getPerson().getFullName());
                        return cd;
                    })
                    .toList();
            dto.setCandidates(candidateDtos);
            positionDtos.add(dto);
        }

        response.setPositions(positionDtos);
        return response;
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