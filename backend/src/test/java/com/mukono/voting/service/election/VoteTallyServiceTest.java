package com.mukono.voting.service.election;

import com.mukono.voting.backend.integration.IntegrationTestBase;
import com.mukono.voting.model.election.*;
import com.mukono.voting.model.people.Person;
import com.mukono.voting.repository.election.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
public class VoteTallyServiceTest extends IntegrationTestBase {

    @Autowired private VoteTallyService voteTallyService;
    @Autowired private ElectionRepository electionRepository;
    @Autowired private VotingPeriodRepository votingPeriodRepository;
    @Autowired private ElectionPositionRepository positionRepository;
    @Autowired private ElectionCandidateRepository candidateRepository;
    @Autowired private VoteRecordRepository voteRecordRepository;
    @Autowired private VoteSelectionRepository voteSelectionRepository;
    @Autowired private com.mukono.voting.repository.people.PersonRepository personRepository;
    @Autowired private com.mukono.voting.repository.org.FellowshipRepository fellowshipRepository;
    @Autowired private com.mukono.voting.repository.leadership.FellowshipPositionRepository fellowshipPositionRepository;
    @Autowired private com.mukono.voting.repository.leadership.PositionTitleRepository positionTitleRepository;

    @Test
    void countsVotesAndTurnoutCorrectly() {
        // Setup election and period
        com.mukono.voting.model.org.Fellowship fellowship = new com.mukono.voting.model.org.Fellowship("Test Fellowship", "TF");
        fellowshipRepository.save(fellowship);

        Election election = new Election();
        election.setName("Test Election");
        election.setDescription("Test election");
        election.setStatus(ElectionStatus.VOTING_OPEN);
        election.setFellowship(fellowship);
        election.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        // Required term dates
        LocalDate today = LocalDate.now();
        election.setTermStartDate(today);
        election.setTermEndDate(today.plusYears(1));
        election.setVotingStartAt(Instant.now().minusSeconds(3600));
        election.setVotingEndAt(Instant.now().plusSeconds(3600));
        election = electionRepository.save(election);

        VotingPeriod period = new VotingPeriod();
        period.setElection(election);
        period.setName("P1");
        period.setStartTime(LocalDateTime.now().minusHours(1));
        period.setEndTime(LocalDateTime.now().plusHours(1));
        period.setStatus(VotingPeriodStatus.OPEN);
        period = votingPeriodRepository.save(period);

        // Position (requires PositionTitle)
        com.mukono.voting.model.leadership.PositionTitle title = new com.mukono.voting.model.leadership.PositionTitle("Chairperson");
        positionTitleRepository.save(title);
        com.mukono.voting.model.leadership.FellowshipPosition fp = new com.mukono.voting.model.leadership.FellowshipPosition();
        fp.setFellowship(fellowship);
        fp.setTitle(title);
        fp.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        fellowshipPositionRepository.save(fp);

        ElectionPosition position = new ElectionPosition(election, fp, 1);
        position = positionRepository.save(position);

        // Candidates
        Person voter1 = new Person("Voter One"); personRepository.save(voter1);
        Person voter2 = new Person("Voter Two"); personRepository.save(voter2);
        Person voter3 = new Person("Voter Three"); personRepository.save(voter3);

        ElectionCandidate candA = new ElectionCandidate(election, position, voter1); // candidate is person1
        ElectionCandidate candB = new ElectionCandidate(election, position, voter2); // candidate is person2
        candA = candidateRepository.save(candA);
        candB = candidateRepository.save(candB);

        // Votes: voter1->A, voter2->A, voter3->B
        createVote(voter1, election, period, position, candA);
        createVote(voter2, election, period, position, candA);
        createVote(voter3, election, period, position, candB);

        Map<Long, Long> counts = voteTallyService.countVotesByCandidate(election.getId(), period.getId(), position.getId());
        assertThat(counts.get(candA.getId())).isEqualTo(2L);
        assertThat(counts.get(candB.getId())).isEqualTo(1L);

        Long turnoutPos = voteTallyService.countTurnoutForPosition(election.getId(), period.getId(), position.getId());
        assertThat(turnoutPos).isEqualTo(3L);

        Long turnoutElection = voteTallyService.countElectionTurnout(election.getId(), period.getId());
        assertThat(turnoutElection).isEqualTo(3L);
    }

    @Test
    void emptyElectionReturnsZeroCounts() {
        com.mukono.voting.model.org.Fellowship fellowship = new com.mukono.voting.model.org.Fellowship("Empty Fellowship", "EF");
        fellowshipRepository.save(fellowship);

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

        VotingPeriod period = new VotingPeriod();
        period.setElection(election);
        period.setName("P1");
        period.setStartTime(LocalDateTime.now().minusHours(1));
        period.setEndTime(LocalDateTime.now().plusHours(1));
        period.setStatus(VotingPeriodStatus.OPEN);
        period = votingPeriodRepository.save(period);

        // Create a valid position but cast no votes
        com.mukono.voting.model.leadership.PositionTitle title = new com.mukono.voting.model.leadership.PositionTitle("Secretary");
        positionTitleRepository.save(title);
        com.mukono.voting.model.leadership.FellowshipPosition fp = new com.mukono.voting.model.leadership.FellowshipPosition();
        fp.setFellowship(fellowship);
        fp.setTitle(title);
        fp.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        fellowshipPositionRepository.save(fp);
        ElectionPosition position = new ElectionPosition(election, fp, 1);
        position = positionRepository.save(position);

        Map<Long, Long> counts = voteTallyService.countVotesByCandidate(election.getId(), period.getId(), position.getId());
        assertThat(counts).isEmpty();

        Long turnoutElection = voteTallyService.countElectionTurnout(election.getId(), period.getId());
        assertThat(turnoutElection).isEqualTo(0L);
    }

    @Test
    void electionTurnoutCountsUniqueVotersAcrossPositions() {
        // Arrange
        com.mukono.voting.model.org.Fellowship fellowship = new com.mukono.voting.model.org.Fellowship("MultiPos Fellowship", "MP");
        fellowshipRepository.save(fellowship);

        Election election = new Election();
        election.setName("MultiPos Election");
        election.setStatus(ElectionStatus.VOTING_OPEN);
        election.setFellowship(fellowship);
        election.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        LocalDate today = LocalDate.now();
        election.setTermStartDate(today);
        election.setTermEndDate(today.plusYears(1));
        election.setVotingStartAt(Instant.now().minusSeconds(3600));
        election.setVotingEndAt(Instant.now().plusSeconds(3600));
        election = electionRepository.save(election);

        VotingPeriod period = new VotingPeriod();
        period.setElection(election);
        period.setName("P1");
        period.setStartTime(LocalDateTime.now().minusHours(1));
        period.setEndTime(LocalDateTime.now().plusHours(1));
        period.setStatus(VotingPeriodStatus.OPEN);
        period = votingPeriodRepository.save(period);

        // Two positions
        com.mukono.voting.model.leadership.PositionTitle t1 = new com.mukono.voting.model.leadership.PositionTitle("Treasurer");
        com.mukono.voting.model.leadership.PositionTitle t2 = new com.mukono.voting.model.leadership.PositionTitle("Coordinator");
        positionTitleRepository.save(t1);
        positionTitleRepository.save(t2);

        com.mukono.voting.model.leadership.FellowshipPosition fp1 = new com.mukono.voting.model.leadership.FellowshipPosition();
        fp1.setFellowship(fellowship);
        fp1.setTitle(t1);
        fp1.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        fellowshipPositionRepository.save(fp1);
        ElectionPosition pos1 = new ElectionPosition(election, fp1, 1);
        pos1 = positionRepository.save(pos1);

        com.mukono.voting.model.leadership.FellowshipPosition fp2 = new com.mukono.voting.model.leadership.FellowshipPosition();
        fp2.setFellowship(fellowship);
        fp2.setTitle(t2);
        fp2.setScope(com.mukono.voting.model.leadership.PositionScope.CHURCH);
        fellowshipPositionRepository.save(fp2);
        ElectionPosition pos2 = new ElectionPosition(election, fp2, 1);
        pos2 = positionRepository.save(pos2);

        // Voters and candidates per position
        Person voter = new Person("Only Voter"); personRepository.save(voter);
        ElectionCandidate cand1 = candidateRepository.save(new ElectionCandidate(election, pos1, voter));
        ElectionCandidate cand2 = candidateRepository.save(new ElectionCandidate(election, pos2, voter));

        // Same voter casts votes in both positions
        createVote(voter, election, period, pos1, cand1);
        createVote(voter, election, period, pos2, cand2);

        Long turnoutPos1 = voteTallyService.countTurnoutForPosition(election.getId(), period.getId(), pos1.getId());
        Long turnoutPos2 = voteTallyService.countTurnoutForPosition(election.getId(), period.getId(), pos2.getId());
        Long turnoutElection = voteTallyService.countElectionTurnout(election.getId(), period.getId());

        assertThat(turnoutPos1).isEqualTo(1L);
        assertThat(turnoutPos2).isEqualTo(1L);
        assertThat(turnoutElection).isEqualTo(1L);
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
