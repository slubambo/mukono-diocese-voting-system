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

    @Autowired
    public ElectionVoterEligibilityService(
            ElectionRepository electionRepository,
            ElectionVoterRollRepository electionVoterRollRepository,
            PersonRepository personRepository,
            LeadershipAssignmentRepository leadershipAssignmentRepository,
            DioceseRepository dioceseRepository,
            ArchdeaconryRepository archdeaconryRepository,
            ChurchRepository churchRepository) {
        this.electionRepository = electionRepository;
        this.electionVoterRollRepository = electionVoterRollRepository;
        this.personRepository = personRepository;
        this.leadershipAssignmentRepository = leadershipAssignmentRepository;
        this.dioceseRepository = dioceseRepository;
        this.archdeaconryRepository = archdeaconryRepository;
        this.churchRepository = churchRepository;
    }

    /**
     * Simple boolean check for voter eligibility.
     * 
     * @param electionId the election ID
     * @param voterPersonId the voter's person ID
     * @return true if eligible, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isEligible(Long electionId, Long voterPersonId) {
        return checkEligibility(electionId, voterPersonId).isEligible();
    }

    /**
     * Comprehensive eligibility check with detailed reasoning.
     * 
     * Tier 1 — Voter Roll Override (highest priority)
     * Tier 2 — Fellowship Membership Check
     * Tier 3 — Scope-Target Membership Check
     * 
     * @param electionId the election ID
     * @param voterPersonId the voter's person ID
     * @return EligibilityDecision with detailed reason and rule
     */
    @Transactional(readOnly = true)
    public EligibilityDecision checkEligibility(Long electionId, Long voterPersonId) {
        // Validate inputs
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));
        
        Person voter = personRepository.findById(voterPersonId)
                .orElseThrow(() -> new IllegalArgumentException("Voter not found: " + voterPersonId));

        // === TIER 1: VOTER ROLL OVERRIDE ===
        Optional<ElectionVoterRoll> rollEntry = electionVoterRollRepository
                .findByElectionIdAndPersonId(electionId, voterPersonId);
        
        if (rollEntry.isPresent()) {
            ElectionVoterRoll entry = rollEntry.get();
            if (entry.getEligible()) {
                return new EligibilityDecision(true, "VOTER_ROLL_ALLOW",
                        "Whitelisted voter: " + (entry.getReason() != null ? entry.getReason() : "Special voter"));
            } else {
                return new EligibilityDecision(false, "VOTER_ROLL_BLOCK",
                        "Blacklisted voter: " + (entry.getReason() != null ? entry.getReason() : "Ineligible per override"));
            }
        }

        // === TIER 2: FELLOWSHIP MEMBERSHIP CHECK ===
        // Check if voter belongs to the election's fellowship via active leadership assignment
        Long fellowshipId = election.getFellowship().getId();
        List<LeadershipAssignment> fellowshipAssignments = leadershipAssignmentRepository
                .findByFellowshipPositionFellowshipIdAndFellowshipPositionScopeAndStatus(
                        fellowshipId,
                        election.getScope(),
                        RecordStatus.ACTIVE);
        
        boolean isFellowshipMember = fellowshipAssignments.stream()
                .anyMatch(la -> la.getPerson().getId().equals(voterPersonId));
        
        if (!isFellowshipMember) {
            return new EligibilityDecision(false, "FELLOWSHIP_CHECK",
                    "Not a member of the required fellowship: " + election.getFellowship().getName());
        }

        // === TIER 3: SCOPE-TARGET MEMBERSHIP CHECK ===
        // Verify voter is eligible within the election's scope
        return checkScopeEligibility(election, voter, fellowshipAssignments, voterPersonId);
    }

    /**
     * Check scope-based eligibility (Diocese, Archdeaconry, or Church).
     * 
     * @param election the election
     * @param voter the voter person
     * @param fellowshipAssignments all fellowship assignments at this scope
     * @param voterPersonId voter person ID
     * @return EligibilityDecision based on scope check
     */
    private EligibilityDecision checkScopeEligibility(Election election, Person voter,
                                                       List<LeadershipAssignment> fellowshipAssignments,
                                                       Long voterPersonId) {
        PositionScope scope = election.getScope();

        switch (scope) {
            case DIOCESE:
                if (election.getDiocese() == null) {
                    return new EligibilityDecision(false, "SCOPE_CHECK",
                            "Election scope is DIOCESE but no target diocese specified");
                }
                // Voter must have an active assignment at this diocese
                boolean dioceseEligible = fellowshipAssignments.stream()
                        .anyMatch(la -> la.getPerson().getId().equals(voterPersonId) &&
                                la.getDiocese() != null &&
                                la.getDiocese().getId().equals(election.getDiocese().getId()));
                
                if (!dioceseEligible) {
                    return new EligibilityDecision(false, "SCOPE_CHECK",
                            "Not eligible for diocese: " + election.getDiocese().getName());
                }
                return new EligibilityDecision(true, "SCOPE_CHECK",
                        "Eligible within diocese: " + election.getDiocese().getName());

            case ARCHDEACONRY:
                if (election.getArchdeaconry() == null) {
                    return new EligibilityDecision(false, "SCOPE_CHECK",
                            "Election scope is ARCHDEACONRY but no target archdeaconry specified");
                }
                // Voter must have an active assignment at this archdeaconry
                boolean archdeaconryEligible = fellowshipAssignments.stream()
                        .anyMatch(la -> la.getPerson().getId().equals(voterPersonId) &&
                                la.getArchdeaconry() != null &&
                                la.getArchdeaconry().getId().equals(election.getArchdeaconry().getId()));
                
                if (!archdeaconryEligible) {
                    return new EligibilityDecision(false, "SCOPE_CHECK",
                            "Not eligible for archdeaconry: " + election.getArchdeaconry().getName());
                }
                return new EligibilityDecision(true, "SCOPE_CHECK",
                        "Eligible within archdeaconry: " + election.getArchdeaconry().getName());

            case CHURCH:
                if (election.getChurch() == null) {
                    return new EligibilityDecision(false, "SCOPE_CHECK",
                            "Election scope is CHURCH but no target church specified");
                }
                // Voter must have an active assignment at this church
                boolean churchEligible = fellowshipAssignments.stream()
                        .anyMatch(la -> la.getPerson().getId().equals(voterPersonId) &&
                                la.getChurch() != null &&
                                la.getChurch().getId().equals(election.getChurch().getId()));
                
                if (!churchEligible) {
                    return new EligibilityDecision(false, "SCOPE_CHECK",
                            "Not eligible for church: " + election.getChurch().getName());
                }
                return new EligibilityDecision(true, "SCOPE_CHECK",
                        "Eligible within church: " + election.getChurch().getName());

            default:
                return new EligibilityDecision(false, "SCOPE_CHECK",
                        "Unknown election scope: " + scope);
        }
    }

    /**
     * Add or update a voter roll override entry.
     * 
     * @param electionId the election ID
     * @param personId the person ID
     * @param eligible whether to whitelist (true) or blacklist (false)
     * @param addedBy username/email of administrator
     * @param reason explanation for override
     * @return the saved ElectionVoterRoll entry
     */
    public ElectionVoterRoll addOrUpdateOverride(Long electionId, Long personId, boolean eligible,
                                                  String addedBy, String reason) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Election not found: " + electionId));
        
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new IllegalArgumentException("Person not found: " + personId));

        ElectionVoterRoll entry = electionVoterRollRepository.findByElectionIdAndPersonId(electionId, personId)
                .orElse(new ElectionVoterRoll());

        entry.setElection(election);
        entry.setPerson(person);
        entry.setEligible(eligible);
        entry.setReason(reason);
        entry.setAddedBy(addedBy);
        entry.setAddedAt(Instant.now());

        return electionVoterRollRepository.save(entry);
    }

    /**
     * Remove a voter roll override entry.
     * 
     * @param electionId the election ID
     * @param personId the person ID
     */
    public void removeOverride(Long electionId, Long personId) {
        Optional<ElectionVoterRoll> entry = electionVoterRollRepository
                .findByElectionIdAndPersonId(electionId, personId);
        
        if (entry.isPresent()) {
            electionVoterRollRepository.delete(entry.get());
        }
    }

    /**
     * List voter roll overrides for an election (paginated).
     * 
     * @param electionId the election ID
     * @param eligible filter by eligibility (null = all)
     * @param pageable pagination info
     * @return page of voter roll entries
     */
    @Transactional(readOnly = true)
    public Page<ElectionVoterRoll> listOverrides(Long electionId, Boolean eligible, Pageable pageable) {
        if (eligible == null) {
            return electionVoterRollRepository.findByElectionId(electionId, pageable);
        }
        return electionVoterRollRepository.findByElectionIdAndEligible(electionId, eligible, pageable);
    }

    /**
     * Count voter roll overrides for an election.
     * 
     * @param electionId the election ID
     * @param eligible filter by eligibility (null = all)
     * @return count of entries
     */
    @Transactional(readOnly = true)
    public long countOverrides(Long electionId, Boolean eligible) {
        if (eligible == null) {
            return electionVoterRollRepository.findByElectionId(electionId, Pageable.unpaged()).getTotalElements();
        }
        return electionVoterRollRepository.countByElectionIdAndEligible(electionId, eligible);
    }
}
