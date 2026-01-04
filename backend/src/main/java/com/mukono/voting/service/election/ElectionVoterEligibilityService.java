package com.mukono.voting.service.election;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.ElectionVoterRoll;
import com.mukono.voting.model.leadership.LeadershipAssignment;
import com.mukono.voting.model.leadership.PositionScope;
import com.mukono.voting.model.org.Archdeaconry;
import com.mukono.voting.model.org.Church;
import com.mukono.voting.model.org.Diocese;
import com.mukono.voting.model.people.Person;
import com.mukono.voting.repository.election.ElectionRepository;
import com.mukono.voting.repository.election.ElectionPositionRepository;
import com.mukono.voting.repository.election.ElectionVoterRollRepository;
import com.mukono.voting.repository.leadership.LeadershipAssignmentRepository;
import com.mukono.voting.repository.org.ArchdeaconryRepository;
import com.mukono.voting.repository.org.ChurchRepository;
import com.mukono.voting.repository.org.DioceseRepository;
import com.mukono.voting.repository.people.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * ElectionVoterEligibilityService enforces voter eligibility rules for elections.
 * 
 * Eligibility tiers (in order of priority):
 * 1. VOTER ROLL OVERRIDE: If entry exists, it takes absolute precedence.
 * 2. FELLOWSHIP MEMBERSHIP: Voter must belong to the election's fellowship.
 * 3. SCOPE-TARGET MEMBERSHIP: Based on election scope, voter must be eligible within that scope.
 * 
 * This ensures: "people vote only on positions within their fellowship at a given level"
 * while still allowing special voters via whitelisting.
 */
@Service
@Transactional
public class ElectionVoterEligibilityService {

    private final ElectionRepository electionRepository;
    private final ElectionVoterRollRepository electionVoterRollRepository;
    private final PersonRepository personRepository;
    private final LeadershipAssignmentRepository leadershipAssignmentRepository;
    private final DioceseRepository dioceseRepository;
    private final ArchdeaconryRepository archdeaconryRepository;
    private final ChurchRepository churchRepository;
    private final ElectionPositionRepository electionPositionRepository;
    private final com.mukono.voting.repository.election.VotingPeriodRepository votingPeriodRepository;

    @Autowired
    public ElectionVoterEligibilityService(
            ElectionRepository electionRepository,
            ElectionVoterRollRepository electionVoterRollRepository,
            PersonRepository personRepository,
            LeadershipAssignmentRepository leadershipAssignmentRepository,
            DioceseRepository dioceseRepository,
            ArchdeaconryRepository archdeaconryRepository,
            ChurchRepository churchRepository,
            ElectionPositionRepository electionPositionRepository,
            com.mukono.voting.repository.election.VotingPeriodRepository votingPeriodRepository) {
        this.electionRepository = electionRepository;
        this.electionVoterRollRepository = electionVoterRollRepository;
        this.personRepository = personRepository;
        this.leadershipAssignmentRepository = leadershipAssignmentRepository;
        this.dioceseRepository = dioceseRepository;
        this.archdeaconryRepository = archdeaconryRepository;
        this.churchRepository = churchRepository;
        this.electionPositionRepository = electionPositionRepository;
        this.votingPeriodRepository = votingPeriodRepository;
    }

    /**
     * Simple boolean check for voter eligibility for a specific voting period.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param voterPersonId the voter's person ID
     * @return true if eligible, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isEligible(Long electionId, Long votingPeriodId, Long voterPersonId) {
        return checkEligibility(electionId, votingPeriodId, voterPersonId).isEligible();
    }

    /**
     * Comprehensive eligibility check with detailed reasoning for a specific voting period.
     * 
     * Tier 1 — Voter Roll Override (highest priority, voting-period-specific)
     * Tier 2 — Fellowship Membership Check
     * Tier 3 — Scope-Target Membership Check
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param voterPersonId the voter's person ID
     * @return EligibilityDecision with detailed reason and rule
     */
    @Transactional(readOnly = true)
    public EligibilityDecision checkEligibility(Long electionId, Long votingPeriodId, Long voterPersonId) {
        // Validate inputs
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));
        
        com.mukono.voting.model.election.VotingPeriod votingPeriod = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Voting period not found: " + votingPeriodId));
        
        Person voter = personRepository.findById(voterPersonId)
                .orElseThrow(() -> new IllegalArgumentException("Voter not found: " + voterPersonId));

        // === TIER 1: VOTER ROLL OVERRIDE (VOTING-PERIOD-SPECIFIC) ===
        Optional<ElectionVoterRoll> rollEntry = electionVoterRollRepository
                .findByElectionIdAndVotingPeriodIdAndPersonId(electionId, votingPeriodId, voterPersonId);
        
        if (rollEntry.isPresent()) {
            ElectionVoterRoll entry = rollEntry.get();
            if (entry.getEligible()) {
                return new EligibilityDecision(true, "VOTER_ROLL_ALLOW",
                        "Whitelisted voter for this voting period: " + (entry.getReason() != null ? entry.getReason() : "Special voter"));
            } else {
                return new EligibilityDecision(false, "VOTER_ROLL_BLOCK",
                        "Blacklisted voter for this voting period: " + (entry.getReason() != null ? entry.getReason() : "Ineligible per override"));
            }
        }

        // === TIER 2: FELLOWSHIP MEMBERSHIP CHECK ===
        // Get all fellowships from election positions (modern election structure)
        // Election.fellowship field is deprecated; fellowships are derived from positions
        List<com.mukono.voting.model.election.ElectionPosition> electionPositions = 
                electionPositionRepository.findByElectionId(electionId);
        
        if (electionPositions.isEmpty()) {
            return new EligibilityDecision(false, "NO_POSITIONS",
                    "Election has no assigned positions");
        }

        // Collect unique fellowships from positions
        java.util.Set<Long> fellowshipIds = electionPositions.stream()
                .map(ep -> ep.getFellowship().getId())
                .collect(java.util.stream.Collectors.toSet());

        // Check if voter is eligible for ANY of the fellowships
        List<LeadershipAssignment> voterFellowshipAssignments = new java.util.ArrayList<>();
        
        for (Long fellowshipId : fellowshipIds) {
            List<LeadershipAssignment> assignments = leadershipAssignmentRepository
                    .findByPersonIdAndFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
                            voterPersonId,
                            fellowshipId,
                            election.getScope(),
                            RecordStatus.ACTIVE);
            
            if (!assignments.isEmpty()) {
                voterFellowshipAssignments.addAll(assignments);
            }
        }
        
        if (voterFellowshipAssignments.isEmpty()) {
            return new EligibilityDecision(false, "FELLOWSHIP_CHECK",
                    "Not a member of any fellowship required by this election");
        }

        // === TIER 3: SCOPE-TARGET MEMBERSHIP CHECK ===
        // Verify voter is eligible within the election's scope
        // PERSON-SPECIFIC: Check this voter's assignment matches the scope target
        return checkScopeEligibility(election, voter, voterFellowshipAssignments, voterPersonId);
    }

    /**
     * Check scope-based eligibility (Diocese, Archdeaconry, or Church).
     * 
     * This is the PERSON-SPECIFIC final validation step:
     * Given voter's fellowship assignment(s), verify they target the election's scope.
     * 
     * @param election the election
     * @param voter the voter person
     * @param voterFellowshipAssignments this specific voter's active fellowship assignments (from Tier 2)
     * @param voterPersonId voter person ID
     * @return EligibilityDecision based on scope check
     */
    private EligibilityDecision checkScopeEligibility(Election election, Person voter,
                                                       List<LeadershipAssignment> voterFellowshipAssignments,
                                                       Long voterPersonId) {
        PositionScope scope = election.getScope();

        // Find an assignment that matches the election's scope target
        // Since voterFellowshipAssignments are PERSON-SPECIFIC, we just check if any match the target
        boolean scopeEligible = voterFellowshipAssignments.stream()
                .anyMatch(la -> matchesScopeTarget(la, election, scope));

        if (!scopeEligible) {
            return buildScopeFailureDecision(election, scope);
        }

        return buildScopeSuccessDecision(election, scope);
    }

    /**
     * Check if a leadership assignment matches the election's scope target.
     * 
     * @param assignment the voter's leadership assignment
     * @param election the election
     * @param scope the election scope
     * @return true if assignment targets the same scope as election
     */
    private boolean matchesScopeTarget(LeadershipAssignment assignment, Election election, PositionScope scope) {
        switch (scope) {
            case DIOCESE:
                return election.getDiocese() != null &&
                       assignment.getDiocese() != null &&
                       assignment.getDiocese().getId().equals(election.getDiocese().getId());

            case ARCHDEACONRY:
                return election.getArchdeaconry() != null &&
                       assignment.getArchdeaconry() != null &&
                       assignment.getArchdeaconry().getId().equals(election.getArchdeaconry().getId());

            case CHURCH:
                return election.getChurch() != null &&
                       assignment.getChurch() != null &&
                       assignment.getChurch().getId().equals(election.getChurch().getId());

            default:
                return false;
        }
    }

    /**
     * Build success decision for scope check.
     * 
     * @param election the election
     * @param scope the scope
     * @return EligibilityDecision indicating success
     */
    private EligibilityDecision buildScopeSuccessDecision(Election election, PositionScope scope) {
        switch (scope) {
            case DIOCESE:
                return new EligibilityDecision(true, "SCOPE_CHECK",
                        "Eligible within diocese: " + election.getDiocese().getName());
            case ARCHDEACONRY:
                return new EligibilityDecision(true, "SCOPE_CHECK",
                        "Eligible within archdeaconry: " + election.getArchdeaconry().getName());
            case CHURCH:
                return new EligibilityDecision(true, "SCOPE_CHECK",
                        "Eligible within church: " + election.getChurch().getName());
            default:
                return new EligibilityDecision(false, "SCOPE_CHECK",
                        "Unknown election scope: " + scope);
        }
    }

    /**
     * Build failure decision for scope check.
     * 
     * @param election the election
     * @param scope the scope
     * @return EligibilityDecision indicating failure
     */
    private EligibilityDecision buildScopeFailureDecision(Election election, PositionScope scope) {
        switch (scope) {
            case DIOCESE:
                if (election.getDiocese() == null) {
                    return new EligibilityDecision(false, "SCOPE_CHECK",
                            "Election scope is DIOCESE but no target diocese specified");
                }
                return new EligibilityDecision(false, "SCOPE_CHECK",
                        "Not eligible for diocese: " + election.getDiocese().getName());

            case ARCHDEACONRY:
                if (election.getArchdeaconry() == null) {
                    return new EligibilityDecision(false, "SCOPE_CHECK",
                            "Election scope is ARCHDEACONRY but no target archdeaconry specified");
                }
                return new EligibilityDecision(false, "SCOPE_CHECK",
                        "Not eligible for archdeaconry: " + election.getArchdeaconry().getName());

            case CHURCH:
                if (election.getChurch() == null) {
                    return new EligibilityDecision(false, "SCOPE_CHECK",
                            "Election scope is CHURCH but no target church specified");
                }
                return new EligibilityDecision(false, "SCOPE_CHECK",
                        "Not eligible for church: " + election.getChurch().getName());

            default:
                return new EligibilityDecision(false, "SCOPE_CHECK",
                        "Unknown election scope: " + scope);
        }
    }

    /**
     * Add or update a voter roll override entry for a specific voting period (whitelist or blacklist).
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param personId the person ID
     * @param eligible whether to whitelist (true) or blacklist (false)
     * @param addedBy username/email of administrator
     * @param reason explanation for override
     * @return the saved ElectionVoterRoll entry
     */
    public ElectionVoterRoll addOrUpdateOverride(Long electionId, Long votingPeriodId, Long personId, boolean eligible,
                                                  String addedBy, String reason) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));
        
        com.mukono.voting.model.election.VotingPeriod votingPeriod = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Voting period not found: " + votingPeriodId));
        
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new IllegalArgumentException("Person not found: " + personId));

        ElectionVoterRoll entry = electionVoterRollRepository
                .findByElectionIdAndVotingPeriodIdAndPersonId(electionId, votingPeriodId, personId)
                .orElse(new ElectionVoterRoll());

        entry.setElection(election);
        entry.setVotingPeriod(votingPeriod);
        entry.setPerson(person);
        entry.setEligible(eligible);
        entry.setReason(reason);
        entry.setAddedBy(addedBy);
        entry.setAddedAt(Instant.now());

        return electionVoterRollRepository.save(entry);
    }

    /**
     * Remove a voter roll override entry for a specific voting period.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param personId the person ID
     */
    public void removeOverride(Long electionId, Long votingPeriodId, Long personId) {
        Optional<ElectionVoterRoll> entry = electionVoterRollRepository
                .findByElectionIdAndVotingPeriodIdAndPersonId(electionId, votingPeriodId, personId);
        
        if (entry.isPresent()) {
            electionVoterRollRepository.delete(entry.get());
        }
    }

    /**
     * List voter roll overrides for an election and voting period (paginated).
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param eligible filter by eligibility (null = all)
     * @param pageable pagination info
     * @return page of voter roll entries
     */
    @Transactional(readOnly = true)
    public Page<ElectionVoterRoll> listOverrides(Long electionId, Long votingPeriodId, Boolean eligible, Pageable pageable) {
        if (eligible == null) {
            return electionVoterRollRepository.findByElectionIdAndVotingPeriodId(electionId, votingPeriodId, pageable);
        }
        return electionVoterRollRepository.findByElectionIdAndVotingPeriodIdAndEligible(electionId, votingPeriodId, eligible, pageable);
    }

    /**
     * Count voter roll overrides for an election and voting period.
     * 
     * @param electionId the election ID
     * @param votingPeriodId the voting period ID
     * @param eligible filter by eligibility (null = all)
     * @return count of entries
     */
    @Transactional(readOnly = true)
    public long countOverrides(Long electionId, Long votingPeriodId, Boolean eligible) {
        if (eligible == null) {
            return electionVoterRollRepository.countByElectionIdAndVotingPeriodId(electionId, votingPeriodId);
        }
        return electionVoterRollRepository.countByElectionIdAndVotingPeriodIdAndEligible(electionId, votingPeriodId, eligible);
    }
}
