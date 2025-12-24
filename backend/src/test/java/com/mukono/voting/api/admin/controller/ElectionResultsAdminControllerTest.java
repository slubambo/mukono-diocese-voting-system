package com.mukono.voting.api.admin.controller;

import com.mukono.voting.payload.response.tally.*;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Transactional
public class ElectionResultsAdminControllerTest extends IntegrationTestBase {

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

    @Test
    @WithMockUser(roles = "ADMIN")
    void summaryReturnsCorrectTotals() throws Exception {
        // Setup
        Long electionId = setupElectionWithVotes(3, 2);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        // Act
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results/summary",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.electionId").value(electionId))
                .andExpect(jsonPath("$.votingPeriodId").value(period.getId()))
                .andExpect(jsonPath("$.totalPositions").value(1))
                .andExpect(jsonPath("$.totalBallotsCast").value(3))
                .andExpect(jsonPath("$.totalSelectionsCast").value(3))
                .andExpect(jsonPath("$.totalDistinctVoters").value(3))
                .andExpect(jsonPath("$.serverTime").isNotEmpty());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void positionsEndpointReturnsDeterministicOrderingAndCounts() throws Exception {
        // Setup
        Long electionId = setupElectionWithVotes(3, 2);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        // Act
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results/positions",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].positionId").isNotEmpty())
                .andExpect(jsonPath("$[0].turnoutForPosition").value(3))
                .andExpect(jsonPath("$[0].totalBallotsForPosition").value(3))
                .andExpect(jsonPath("$[0].candidates", org.hamcrest.Matchers.hasSize(2)))
                // Candidates sorted by voteCount DESC, then fullName ASC
                .andExpect(jsonPath("$[0].candidates[0].voteCount").value(2))
                .andExpect(jsonPath("$[0].candidates[1].voteCount").value(1))
                .andExpect(jsonPath("$[0].candidates[0].voteSharePercent").value(org.hamcrest.Matchers.closeTo(66.7, 1.0)))
                .andExpect(jsonPath("$[0].candidates[1].voteSharePercent").value(org.hamcrest.Matchers.closeTo(33.3, 1.0)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void singlePositionEndpointReturnsSameAsPositionsSubset() throws Exception {
        // Setup
        Long electionId = setupElectionWithVotes(3, 2);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);
        ElectionPosition position = positionRepository.findAll().get(0);

        // Act & Assert
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results/positions/{positionId}",
                electionId, period.getId(), position.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.positionId").value(position.getId()))
                .andExpect(jsonPath("$.turnoutForPosition").value(3))
                .andExpect(jsonPath("$.totalBallotsForPosition").value(3));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void emptyVotesReturnsZeros() throws Exception {
        // Setup: election with position but no votes
        Long electionId = setupElectionWithoutVotes();
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        // Act & Assert
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results/summary",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBallotsCast").value(0))
                .andExpect(jsonPath("$.totalSelectionsCast").value(0))
                .andExpect(jsonPath("$.totalDistinctVoters").value(0));

        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results/positions",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].turnoutForPosition").value(0))
                .andExpect(jsonPath("$[0].totalBallotsForPosition").value(0))
                // Candidates exist but with zero votes
                .andExpect(jsonPath("$[0].candidates", org.hamcrest.Matchers.hasSize(2)))
                .andExpect(jsonPath("$[0].candidates[0].voteCount").value(0))
                .andExpect(jsonPath("$[0].candidates[1].voteCount").value(0))
                .andExpect(jsonPath("$[0].candidates[0].voteSharePercent").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "USER")
    void unauthorizedUserReturns403() throws Exception {
        // Setup
        Long electionId = setupElectionWithVotes(1, 1);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        // Act & Assert
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results/summary",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void exportReturnsCorrectFlatFormat() throws Exception {
        // Setup
        Long electionId = setupElectionWithVotes(2, 2);
        VotingPeriod period = votingPeriodRepository.findAll().get(0);

        // Act & Assert
        mockMvc.perform(get("/api/v1/admin/elections/{electionId}/voting-periods/{votingPeriodId}/results/export",
                electionId, period.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(2))) // 2 candidates
                .andExpect(jsonPath("$[0].electionId").value(electionId))
                .andExpect(jsonPath("$[0].votingPeriodId").value(period.getId()))
                .andExpect(jsonPath("$[0].positionId").isNotEmpty())
                .andExpect(jsonPath("$[0].candidateId").isNotEmpty())
                .andExpect(jsonPath("$[0].voteCount").isNumber())
                .andExpect(jsonPath("$[0].turnoutForPosition").value(2))
                .andExpect(jsonPath("$[0].totalBallotsForPosition").value(2));
    }

    // Helper methods

    private Long setupElectionWithVotes(int numVoters, int numCandidates) {
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
        period.setStatus(VotingPeriodStatus.OPEN);
        period = votingPeriodRepository.save(period);

        // Create position
        com.mukono.voting.model.leadership.PositionTitle title = new com.mukono.voting.model.leadership.PositionTitle("Chairperson");
        positionTitleRepository.save(title);
        com.mukono.voting.model.leadership.FellowshipPosition fp = new com.mukono.voting.model.leadership.FellowshipPosition();
        fp.setFellowship(fellowship);
        fp.setTitle(title);
        fp.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        fellowshipPositionRepository.save(fp);

        ElectionPosition position = new ElectionPosition(election, fellowship, fp, 1);
        position = positionRepository.save(position);

        // Create voters and candidates
        List<Person> voters = new java.util.ArrayList<>();
        for (int i = 0; i < numVoters; i++) {
            Person voter = new Person("Voter " + i);
            personRepository.save(voter);
            voters.add(voter);
        }

        List<ElectionCandidate> candidates = new java.util.ArrayList<>();
        for (int i = 0; i < numCandidates; i++) {
            Person candidate = new Person("Candidate " + i);
            personRepository.save(candidate);
            ElectionCandidate ec = new ElectionCandidate(election, position, candidate);
            candidateRepository.save(ec);
            candidates.add(ec);
        }

        // Create votes
        // First voter votes for candidate 0 (occurs numVoters - numCandidates + 1 times if numCandidates <= numVoters)
        // Remaining voters vote for different candidates
        for (int i = 0; i < numVoters; i++) {
            ElectionCandidate candidate = candidates.get(i % numCandidates);
            createVote(voters.get(i), election, period, position, candidate);
        }

        return election.getId();
    }

    private Long setupElectionWithoutVotes() {
        // Create fellowship
        com.mukono.voting.model.org.Fellowship fellowship = new com.mukono.voting.model.org.Fellowship("Empty Fellowship", "EF");
        fellowshipRepository.save(fellowship);

        // Create election
        Election election = new Election();
        election.setName("Empty Election");
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
        period.setStatus(VotingPeriodStatus.OPEN);
        period = votingPeriodRepository.save(period);

        // Create position
        com.mukono.voting.model.leadership.PositionTitle title = new com.mukono.voting.model.leadership.PositionTitle("Secretary");
        positionTitleRepository.save(title);
        com.mukono.voting.model.leadership.FellowshipPosition fp = new com.mukono.voting.model.leadership.FellowshipPosition();
        fp.setFellowship(fellowship);
        fp.setTitle(title);
        fp.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        fellowshipPositionRepository.save(fp);

        ElectionPosition position = new ElectionPosition(election, fellowship, fp, 1);
        positionRepository.save(position);

        // Create candidates but no votes
        Person candidate1 = new Person("Candidate A");
        Person candidate2 = new Person("Candidate B");
        personRepository.save(candidate1);
        personRepository.save(candidate2);

        candidateRepository.save(new ElectionCandidate(election, position, candidate1));
        candidateRepository.save(new ElectionCandidate(election, position, candidate2));

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
