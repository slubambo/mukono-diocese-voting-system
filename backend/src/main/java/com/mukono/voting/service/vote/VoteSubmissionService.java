package com.mukono.voting.service.vote;

import com.mukono.voting.model.election.*;
import com.mukono.voting.model.people.Person;
import com.mukono.voting.payload.request.VoteSubmitRequest;
import com.mukono.voting.payload.response.VoteSubmitResponse;
import com.mukono.voting.repository.election.*;
import com.mukono.voting.repository.people.PersonRepository;
import com.mukono.voting.service.election.ElectionVoterEligibilityService;
import com.mukono.voting.service.election.EligibilityDecision;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VoteSubmissionService {

    private final VotingPeriodRepository votingPeriodRepository;
    private final VotingPeriodPositionRepository votingPeriodPositionRepository;
    private final ElectionPositionRepository electionPositionRepository;
    private final ElectionCandidateRepository electionCandidateRepository;
    private final PersonRepository personRepository;
    private final VoteRecordRepository voteRecordRepository;
    private final VoteSelectionRepository voteSelectionRepository;
    private final ElectionVoterEligibilityService eligibilityService;

    public VoteSubmissionService(VotingPeriodRepository votingPeriodRepository,
                                 VotingPeriodPositionRepository votingPeriodPositionRepository,
                                 ElectionPositionRepository electionPositionRepository,
                                 ElectionCandidateRepository electionCandidateRepository,
                                 PersonRepository personRepository,
                                 VoteRecordRepository voteRecordRepository,
                                 VoteSelectionRepository voteSelectionRepository,
                                 ElectionVoterEligibilityService eligibilityService) {
        this.votingPeriodRepository = votingPeriodRepository;
        this.votingPeriodPositionRepository = votingPeriodPositionRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.electionCandidateRepository = electionCandidateRepository;
        this.personRepository = personRepository;
        this.voteRecordRepository = voteRecordRepository;
        this.voteSelectionRepository = voteSelectionRepository;
        this.eligibilityService = eligibilityService;
    }

    @Transactional
    public VoteSubmitResponse submitVotes(Long personId, Long electionId, Long votingPeriodId, VoteSubmitRequest request) {
        // 0) Validate request: duplicates in candidateIds per position
        validateRequest(request);

        // 1) Load + validate period
        VotingPeriod period = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Voting period not found"));
        if (!period.getElection().getId().equals(electionId)) {
            throw new IllegalArgumentException("Voting period does not belong to the specified election");
        }
        if (period.getStatus() != VotingPeriodStatus.OPEN) {
            throw new IllegalArgumentException("Voting is not OPEN for this period. Status: " + period.getStatus());
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(period.getStartTime()) || !now.isBefore(period.getEndTime())) {
            throw new IllegalArgumentException("Voting is not within the period time window");
        }

        // 2) Eligibility for this voting period
        EligibilityDecision decision = eligibilityService.checkEligibility(electionId, votingPeriodId, personId);
        if (!decision.isEligible()) {
            throw new IllegalArgumentException("Voter not eligible for this election voting period: " + decision.getReason());
        }

        // 2.5) Extract position IDs and validate they are assigned to this voting period
        List<Long> positionIds = request.getVotes().stream().map(VoteSubmitRequest.VoteItem::getPositionId).toList();
        List<Long> assignedPositionIds = votingPeriodPositionRepository
                .findElectionPositionIdsByVotingPeriod(electionId, votingPeriodId);
        
        if (assignedPositionIds.isEmpty()) {
            throw new IllegalArgumentException("No positions are configured for this voting period");
        }
        
        Set<Long> assignedSet = new HashSet<>(assignedPositionIds);
        for (Long posId : positionIds) {
            if (!assignedSet.contains(posId)) {
                throw new IllegalArgumentException(
                        "Position " + posId + " is not active for voting in this period");
            }
        }

        // 3) Validate positions belong to election
        Map<Long, ElectionPosition> positions = electionPositionRepository.findAllById(positionIds)
                .stream()
                .collect(Collectors.toMap(ElectionPosition::getId, p -> p));
        for (Long posId : positionIds) {
            ElectionPosition pos = positions.get(posId);
            if (pos == null || !pos.getElection().getId().equals(electionId)) {
                throw new IllegalArgumentException("Invalid position for election: " + posId);
            }
        }

        // 4) Validate candidates
        List<Long> allCandidateIds = request.getVotes().stream()
                .flatMap(v -> v.getCandidateIds().stream())
                .distinct()
                .toList();
        Map<Long, ElectionCandidate> candidatesById = electionCandidateRepository.findAllById(allCandidateIds)
                .stream().collect(Collectors.toMap(ElectionCandidate::getId, c -> c));

        for (VoteSubmitRequest.VoteItem item : request.getVotes()) {
            for (Long candidateId : item.getCandidateIds()) {
                ElectionCandidate c = candidatesById.get(candidateId);
                if (c == null) {
                    throw new IllegalArgumentException("Candidate not found: " + candidateId);
                }
                if (!c.getElection().getId().equals(electionId)) {
                    throw new IllegalArgumentException("Invalid candidate for election: " + candidateId);
                }
                if (!c.getElectionPosition().getId().equals(item.getPositionId())) {
                    throw new IllegalArgumentException("Invalid candidate for position: candidate " + candidateId + " not in position " + item.getPositionId());
                }
            }
        }

        // 5) Enforce max votes per position
        for (VoteSubmitRequest.VoteItem item : request.getVotes()) {
            ElectionPosition pos = positions.get(item.getPositionId());
            int allowed = pos.getSeats() != null ? pos.getSeats() : 1; // fallback to seats; if null, 1
            if (item.getCandidateIds().size() > allowed) {
                throw new IllegalArgumentException("Too many selections for position " + item.getPositionId() + ". Max is " + allowed);
            }
        }

        // 6) Prevent double voting (bulk check)
        List<VoteRecord> existing = voteRecordRepository.findExistingForPositions(electionId, votingPeriodId, personId, positionIds);
        if (!existing.isEmpty()) {
            // Prefer 409 Conflict, but project may use 400; throwing IllegalArgumentException for global handler style
            throw new IllegalArgumentException("Already voted for one or more positions in this period");
        }

        // 7) Persist votes atomically
        String receiptId = generateReceiptId();
        Instant submittedAt = Instant.now();
        List<VoteRecord> toSave = new ArrayList<>();

        for (VoteSubmitRequest.VoteItem item : request.getVotes()) {
            VoteRecord vr = new VoteRecord();
            vr.setElection(period.getElection());
            vr.setVotingPeriod(period);
            Person person = new Person();
            person.setId(personId);
            vr.setPerson(person);
            vr.setPosition(positions.get(item.getPositionId()));
            vr.setSubmittedAt(submittedAt);
            vr.setReceiptId(receiptId);

            List<VoteSelection> sels = new ArrayList<>();
            for (Long candidateId : item.getCandidateIds()) {
                VoteSelection sel = new VoteSelection();
                sel.setVoteRecord(vr);
                sel.setCandidate(candidatesById.get(candidateId));
                sels.add(sel);
            }
            vr.setSelections(sels);

            toSave.add(vr);
        }

        try {
            voteRecordRepository.saveAll(toSave);
        } catch (DataIntegrityViolationException ex) {
            // Unique constraint may have been hit due to race conditions
            throw new IllegalArgumentException("Already voted for one or more positions in this period");
        }

        // 8) Build response
        VoteSubmitResponse resp = new VoteSubmitResponse();
        resp.setReceiptId(receiptId);
        resp.setElectionId(electionId);
        resp.setVotingPeriodId(votingPeriodId);
        resp.setPersonId(personId);
        resp.setSubmittedAt(submittedAt);
        resp.setPositions(request.getVotes().stream()
                .map(v -> new VoteSubmitResponse.PositionVote(v.getPositionId(), v.getCandidateIds()))
                .toList());
        return resp;
    }

    private void validateRequest(VoteSubmitRequest request) {
        if (request == null || request.getVotes() == null || request.getVotes().isEmpty()) {
            throw new IllegalArgumentException("votes must not be empty");
        }
        for (VoteSubmitRequest.VoteItem item : request.getVotes()) {
            if (item.getPositionId() == null) {
                throw new IllegalArgumentException("positionId must not be null");
            }
            if (item.getCandidateIds() == null || item.getCandidateIds().isEmpty()) {
                throw new IllegalArgumentException("candidateIds must not be empty");
            }
            Set<Long> uniq = new HashSet<>(item.getCandidateIds());
            if (uniq.size() != item.getCandidateIds().size()) {
                throw new IllegalArgumentException("candidateIds contains duplicates for position " + item.getPositionId());
            }
        }
    }

    private String generateReceiptId() {
        String date = DateTimeFormatter.ofPattern("yyyyMMdd").format(java.time.LocalDate.now());
        String random = randomAlphaNum(6);
        return "VS-" + date + "-" + random;
    }

    private static final String ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RNG = new SecureRandom();
    private String randomAlphaNum(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(ALPHANUM.charAt(RNG.nextInt(ALPHANUM.length())));
        }
        return sb.toString();
    }
}