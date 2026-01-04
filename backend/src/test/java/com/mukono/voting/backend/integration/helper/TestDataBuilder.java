package com.mukono.voting.backend.integration.helper;

import com.mukono.voting.model.election.*;
import com.mukono.voting.model.leadership.FellowshipPosition;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.model.org.Church;
import com.mukono.voting.model.org.Fellowship;
import com.mukono.voting.model.org.Archdeaconry;
import com.mukono.voting.model.org.Diocese;
import com.mukono.voting.model.people.Person;
import com.mukono.voting.model.common.RecordStatus;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Test data builders for integration tests.
 * Creates domain objects without persisting (use in arrange phase).
 */
public class TestDataBuilder {

    /**
     * Build a test Person.
     */
    public static Person buildPerson(String name) {
        Person person = new Person(name);
        person.setEmail(name.toLowerCase().replace(" ", ".") + "@example.com");
        person.setPhoneNumber("+256700000001");
        person.setStatus(Person.Status.ACTIVE);
        return person;
    }

    /**
     * Build a test Diocese.
     */
    public static Diocese buildDiocese(String name) {
        Diocese diocese = new Diocese(name, "DIK");
        diocese.setStatus(RecordStatus.ACTIVE);
        return diocese;
    }

    /**
     * Build a test Archdeaconry.
     */
    public static Archdeaconry buildArchdeaconry(String name, Diocese diocese) {
        Archdeaconry arch = new Archdeaconry(name, "ARK", diocese);
        arch.setStatus(RecordStatus.ACTIVE);
        return arch;
    }

    /**
     * Build a test Church.
     */
    public static Church buildChurch(String name, Archdeaconry archdeaconry) {
        Church church = new Church(name, "CH", archdeaconry);
        church.setStatus(RecordStatus.ACTIVE);
        return church;
    }

    /**
     * Build a test Fellowship.
     */
    public static Fellowship buildFellowship(String name) {
        Fellowship fellowship = new Fellowship(name, "FEL");
        fellowship.setStatus(RecordStatus.ACTIVE);
        return fellowship;
    }

    /**
     * Build a test FellowshipPosition.
     * Note: Simplified version - in real tests, would need PositionTitle entity.
     */
    public static FellowshipPosition buildFellowshipPosition(String title, Fellowship fellowship, PositionScope scope) {
        FellowshipPosition position = new FellowshipPosition();
        // Note: Setting title requires PositionTitle entity - skip for now
        position.setFellowship(fellowship);
        position.setScope(scope);
        position.setStatus(RecordStatus.ACTIVE);
        return position;
    }

    /**
     * Build a test Election.
     */
    public static Election buildElection(String name, Fellowship fellowship, PositionScope scope, Diocese diocese) {
        Election election = new Election();
        election.setName(name);
        election.setDescription("Test election: " + name);
        election.setStatus(ElectionStatus.VOTING_OPEN);
        election.setFellowship(fellowship);
        election.setScope(scope);
        election.setDiocese(diocese);
        
        LocalDate today = LocalDate.now();
        election.setTermStartDate(today);
        election.setTermEndDate(today.plusYears(1));
        
        Instant now = Instant.now();
        election.setVotingStartAt(now.minusSeconds(3600));
        election.setVotingEndAt(now.plusSeconds(3600));
        
        return election;
    }

    /**
     * Build a test ElectionPosition.
     * Note: ElectionPosition requires a FellowshipPosition, not just a title.
     */
    public static ElectionPosition buildElectionPosition(String positionTitle, Election election, Fellowship fellowship, PositionScope scope) {
        FellowshipPosition fellowshipPosition = buildFellowshipPosition(positionTitle, fellowship, scope);
        ElectionPosition position = new ElectionPosition(election, fellowship, fellowshipPosition, 1);
        return position;
    }

    /**
     * Build a test ElectionCandidate.
     */
    public static ElectionCandidate buildElectionCandidate(Person person, Election election, ElectionPosition position) {
        ElectionCandidate candidate = new ElectionCandidate(election, position, person);
        return candidate;
    }

    /**
     * Build a test ElectionVote.
     */
    public static ElectionVote buildElectionVote(Person voter, Election election, ElectionPosition position, ElectionCandidate candidate) {
        ElectionVote vote = new ElectionVote(election, position, candidate, voter);
        vote.setStatus(VoteStatus.CAST);
        vote.setCastAt(Instant.now());
        vote.setSource("TEST");
        return vote;
    }

    /**
     * Build a test VotingPeriod.
     */
    public static VotingPeriod buildVotingPeriod(String name, Election election) {
        VotingPeriod period = new VotingPeriod();
        period.setName(name);
        period.setElection(election);
        period.setStatus(VotingPeriodStatus.OPEN);
        
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        period.setStartTime(now.minusHours(1));
        period.setEndTime(now.plusHours(1));
        
        return period;
    }

    /**
     * Build a test ElectionVoterRoll entry for a specific voting period.
     */
    public static ElectionVoterRoll buildElectionVoterRoll(Election election, VotingPeriod votingPeriod, Person person, boolean eligible) {
        ElectionVoterRoll entry = new ElectionVoterRoll(election, votingPeriod, person, eligible);
        entry.setReason(eligible ? "Whitelisted for testing" : "Blacklisted for testing");
        entry.setAddedBy("test@example.com");
        entry.setAddedAt(Instant.now());
        return entry;
    }
}
