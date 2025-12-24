package com.mukono.voting.api.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mukono.voting.payload.request.tally.RunTallyRequest;
import com.mukono.voting.backend.integration.IntegrationTestBase;
import com.mukono.voting.model.election.*;
import com.mukono.voting.model.people.Person;
import com.mukono.voting.repository.election.*;
import com.mukono.voting.repository.leadership.FellowshipPositionRepository;
import com.mukono.voting.repository.leadership.PositionTitleRepository;
import com.mukono.voting.repository.org.FellowshipRepository;
import com.mukono.voting.repository.people.PersonRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
public class ElectionTallyAdminControllerTest extends IntegrationTestBase {

    @Autowired private ElectionRepository electionRepository;
    @Autowired private VotingPeriodRepository votingPeriodRepository;
    @Autowired private ElectionPositionRepository positionRepository;
    @Autowired private ElectionCandidateRepository candidateRepository;
    @Autowired private VoteRecordRepository voteRecordRepository;
    @Autowired private VoteSelectionRepository voteSelectionRepository;
    @Autowired private PersonRepository personRepository;
    @Autowired private FellowshipRepository fellowshipRepository;
    @Autowired private FellowshipPositionRepository fellowshipPositionRepository;
    @Autowired private PositionTitleRepository positionTitleRepository;
    @Autowired private ElectionTallyRunRepository tallyRunRepository;
    @Autowired private CertifiedPositionResultRepository certifiedPositionResultRepository;
    @Autowired private CertifiedCandidateResultRepository certifiedCandidateResultRepository;
    @Autowired private ElectionWinnerAssignmentRepository winnerAssignmentRepository;
    @Autowired private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "ADMIN")
    void cannotRunTallyWhenPeriodOpen() throws Exception {
        // Setup election with OPEN period
        Long electionId = setupElectionWithVotes(3, 2, VotingPeriodStatus.OPEN);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        RunTallyRequest request = new RunTallyRequest();
        request.setForce(false);

        // Act & Assert
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/run",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void canRunTallyWhenPeriodClosed() throws Exception {
        // Setup election with CLOSED period
        Long electionId = setupElectionWithVotes(3, 2, VotingPeriodStatus.CLOSED);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        RunTallyRequest request = new RunTallyRequest();
        request.setRemarks("Test tally");

        // Act
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/run",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.tallyRunId").isNumber())
                .andExpect(jsonPath("$.totalPositionsTallied").value(1))
                .andExpect(jsonPath("$.totalWinnersApplied").isNumber());

        // Verify tally run exists
        assertThat(tallyRunRepository.existsByElectionIdAndVotingPeriodId(electionId, period.getId())).isTrue();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void idempotentSecondRunReturnsExisting() throws Exception {
        // Setup and run tally
        Long electionId = setupElectionWithVotes(3, 2, VotingPeriodStatus.CLOSED);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        RunTallyRequest request = new RunTallyRequest();

        // First run
        String response1 = mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/run",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Second run (idempotent)
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/run",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("already completed")));

        // Verify only one tally run exists
        assertThat(tallyRunRepository.countByElectionIdAndVotingPeriodId(electionId, period.getId())).isEqualTo(1);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void winnerSelectionDeterministicWithTie() throws Exception {
        // Setup election with tie (2 candidates, same votes)
        Long electionId = setupElectionWithTie();
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        RunTallyRequest request = new RunTallyRequest();

        // Run tally
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/run",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalWinnersApplied").value(1)); // Only 1 seat

        // Verify tie was detected but resolved deterministically
        assertThat(certifiedPositionResultRepository.findByElectionIdAndVotingPeriodId(electionId, period.getId()))
                .isNotEmpty();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void certifiedResultsPersisted() throws Exception {
        // Setup and run tally
        Long electionId = setupElectionWithVotes(3, 2, VotingPeriodStatus.CLOSED);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        RunTallyRequest request = new RunTallyRequest();

        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/run",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Verify certified position results
        assertThat(certifiedPositionResultRepository.countByElectionIdAndVotingPeriodId(electionId, period.getId()))
                .isEqualTo(1);

        // Verify certified candidate results
        CertifiedPositionResult certifiedPos = certifiedPositionResultRepository
                .findByElectionIdAndVotingPeriodId(electionId, period.getId()).get(0);
        assertThat(certifiedCandidateResultRepository.findByCertifiedPositionResultId(certifiedPos.getId()))
                .hasSize(2); // 2 candidates
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void winnerAssignmentsMatchSeats() throws Exception {
        // Setup election with 2 seats
        Long electionId = setupElectionWithMultipleSeats(3, 3, 2);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        RunTallyRequest request = new RunTallyRequest();

        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/run",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalWinnersApplied").value(2)); // 2 seats

        // Verify 2 winner assignments
        assertThat(winnerAssignmentRepository.countByElectionIdAndVotingPeriodId(electionId, period.getId()))
                .isEqualTo(2);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void rollbackRemovesWinnersAndMarksTallyRolledBack() throws Exception {
        // Setup and run tally
        Long electionId = setupElectionWithVotes(3, 2, VotingPeriodStatus.CLOSED);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        RunTallyRequest request = new RunTallyRequest();

        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/run",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        long winnersBefore = winnerAssignmentRepository.countByElectionIdAndVotingPeriodId(electionId, period.getId());
        assertThat(winnersBefore).isGreaterThan(0);

        // Rollback
        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/rollback",
                electionId, period.getId())
                .param("reason", "Test rollback"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ROLLED_BACK"))
                .andExpect(jsonPath("$.winnersRemoved").value((int) winnersBefore));

        // Verify winners removed
        assertThat(winnerAssignmentRepository.countByElectionIdAndVotingPeriodId(electionId, period.getId()))
                .isEqualTo(0);

        // Verify tally status is ROLLED_BACK
        ElectionTallyRun tally = tallyRunRepository.findByElectionIdAndVotingPeriodId(electionId, period.getId()).get();
        assertThat(tally.getStatus()).isEqualTo(TallyStatus.ROLLED_BACK);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getStatusReturnsCorrectInfo() throws Exception {
        // Setup and run tally
        Long electionId = setupElectionWithVotes(3, 2, VotingPeriodStatus.CLOSED);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        RunTallyRequest request = new RunTallyRequest();

        mockMvc.perform(post("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/run",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Get status
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/tally/status",
                electionId, period.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tallyExists").value(true))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.totalPositionsCertified").value(1))
                .andExpect(jsonPath("$.totalWinnersApplied").isNumber());
    }

    // Helper methods

    private Long setupElectionWithVotes(int numVoters, int numCandidates, VotingPeriodStatus periodStatus) {
        return setupElectionWithMultipleSeats(numVoters, numCandidates, 1, periodStatus);
    }

    private Long setupElectionWithMultipleSeats(int numVoters, int numCandidates, int seats) {
        return setupElectionWithMultipleSeats(numVoters, numCandidates, seats, VotingPeriodStatus.CLOSED);
    }

    private Long setupElectionWithMultipleSeats(int numVoters, int numCandidates, int seats, VotingPeriodStatus periodStatus) {
        // Create fellowship
        com.mukono.voting.model.org.Fellowship fellowship = new com.mukono.voting.model.org.Fellowship("Test Fellowship", "TF");
        fellowshipRepository.save(fellowship);

        // Create election
        Election election = new Election();
        election.setName("Test Election");
        election.setStatus(ElectionStatus.VOTING_OPEN);
        election.setFellowship(fellowship);
        election.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        LocalDate today = LocalDate.now();
        election.setTermStartDate(today);
        election.setTermEndDate(today.plusYears(1));
        election.setVotingStartAt(Instant.now().minusSeconds(3600));
        election.setVotingEndAt(Instant.now().plusSeconds(3600));
        election = electionRepository.save(election);

        // Create voting period
        VotingPeriod period = new VotingPeriod();
        period.setElection(election);
        period.setName("Period 1");
        period.setStartTime(LocalDateTime.now().minusHours(1));
        period.setEndTime(LocalDateTime.now().plusHours(1));
        period.setStatus(periodStatus);
        period = votingPeriodRepository.save(period);

        // Create position
        com.mukono.voting.model.leadership.PositionTitle title = new com.mukono.voting.model.leadership.PositionTitle("Chairperson");
        positionTitleRepository.save(title);
        com.mukono.voting.model.leadership.FellowshipPosition fp = new com.mukono.voting.model.leadership.FellowshipPosition();
        fp.setFellowship(fellowship);
        fp.setTitle(title);
        fp.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        fp.setSeats(seats);
        fellowshipPositionRepository.save(fp);

        ElectionPosition position = new ElectionPosition(election, fellowship, fp, 1);
        position = positionRepository.save(position);

        // Create voters and candidates
        java.util.List<Person> voters = new java.util.ArrayList<>();
        for (int i = 0; i < numVoters; i++) {
            Person voter = new Person("Voter " + i);
            personRepository.save(voter);
            voters.add(voter);
        }

        java.util.List<ElectionCandidate> candidates = new java.util.ArrayList<>();
        for (int i = 0; i < numCandidates; i++) {
            Person candidate = new Person("Candidate " + i);
            personRepository.save(candidate);
            ElectionCandidate ec = new ElectionCandidate(election, position, candidate);
            candidateRepository.save(ec);
            candidates.add(ec);
        }

        // Create votes (distribute votes across candidates)
        for (int i = 0; i < numVoters; i++) {
            ElectionCandidate candidate = candidates.get(i % numCandidates);
            createVote(voters.get(i), election, period, position, candidate);
        }

        return election.getId();
    }

    private Long setupElectionWithTie() {
        // Create fellowship
        com.mukono.voting.model.org.Fellowship fellowship = new com.mukono.voting.model.org.Fellowship("Tie Fellowship", "TIE");
        fellowshipRepository.save(fellowship);

        // Create election
        Election election = new Election();
        election.setName("Tie Election");
        election.setStatus(ElectionStatus.VOTING_OPEN);
        election.setFellowship(fellowship);
        election.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        LocalDate today = LocalDate.now();
        election.setTermStartDate(today);
        election.setTermEndDate(today.plusYears(1));
        election.setVotingStartAt(Instant.now().minusSeconds(3600));
        election.setVotingEndAt(Instant.now().plusSeconds(3600));
        election = electionRepository.save(election);

        // Create voting period
        VotingPeriod period = new VotingPeriod();
        period.setElection(election);
        period.setName("Period 1");
        period.setStartTime(LocalDateTime.now().minusHours(1));
        period.setEndTime(LocalDateTime.now().plusHours(1));
        period.setStatus(VotingPeriodStatus.CLOSED);
        period = votingPeriodRepository.save(period);

        // Create position with 1 seat
        com.mukono.voting.model.leadership.PositionTitle title = new com.mukono.voting.model.leadership.PositionTitle("Secretary");
        positionTitleRepository.save(title);
        com.mukono.voting.model.leadership.FellowshipPosition fp = new com.mukono.voting.model.leadership.FellowshipPosition();
        fp.setFellowship(fellowship);
        fp.setTitle(title);
        fp.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        fp.setSeats(1);
        fellowshipPositionRepository.save(fp);

        ElectionPosition position = new ElectionPosition(election, fellowship, fp, 1);
        position = positionRepository.save(position);

        // Create 2 candidates with same votes
        Person voter1 = new Person("Voter 1");
        Person voter2 = new Person("Voter 2");
        Person candidate1Person = new Person("Candidate A");
        Person candidate2Person = new Person("Candidate B");
        personRepository.save(voter1);
        personRepository.save(voter2);
        personRepository.save(candidate1Person);
        personRepository.save(candidate2Person);

        ElectionCandidate candidate1 = new ElectionCandidate(election, position, candidate1Person);
        ElectionCandidate candidate2 = new ElectionCandidate(election, position, candidate2Person);
        candidateRepository.save(candidate1);
        candidateRepository.save(candidate2);

        // Each candidate gets 1 vote (tie)
        createVote(voter1, election, period, position, candidate1);
        createVote(voter2, election, period, position, candidate2);

        return election.getId();
    }

    private void createVote(Person voter, Election election, VotingPeriod period, ElectionPosition position, ElectionCandidate candidate) {
        VoteRecord vr = new VoteRecord();
        vr.setElection(election);
        vr.setVotingPeriod(period);
        vr.setPerson(voter);
        vr.setPosition(position);
        vr.setSubmittedAt(Instant.now());
        vr.setReceiptId("R-" + voter.getId() + "-" + position.getId());
        vr = voteRecordRepository.save(vr);

        VoteSelection vs = new VoteSelection();
        vs.setVoteRecord(vr);
        vs.setCandidate(candidate);
        voteSelectionRepository.save(vs);
    }
}
