package com.mukono.voting.service.election;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mukono.voting.payload.response.common.CountResponse;
import com.mukono.voting.payload.response.election.EligibleVoterResponse;
import com.mukono.voting.payload.response.election.EligibleVoterResponse.PositionSummary;
import com.mukono.voting.payload.response.election.EligibleVoterResponse.VotingCodeHistory;
import com.mukono.voting.repository.election.VoteRecordRepository;
import com.mukono.voting.repository.election.VotingCodeRepository;
import com.mukono.voting.repository.election.projection.EligibleVoterProjection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class EligibleVoterService {

    private static final Logger logger = LoggerFactory.getLogger(EligibleVoterService.class);

    private final VotingCodeRepository votingCodeRepository;
    private final VoteRecordRepository voteRecordRepository;
    private final ObjectMapper objectMapper;

    public EligibleVoterService(VotingCodeRepository votingCodeRepository,
                                VoteRecordRepository voteRecordRepository,
                                ObjectMapper objectMapper) {
        this.votingCodeRepository = votingCodeRepository;
        this.voteRecordRepository = voteRecordRepository;
        this.objectMapper = objectMapper;
    }

    public Page<EligibleVoterResponse> listEligibleVoters(Long electionId,
                                                          Long votingPeriodId,
                                                          String status,
                                                          String q,
                                                          Long fellowshipId,
                                                          Long electionPositionId,
                                                          Pageable pageable) {
        logger.info("========== ELIGIBLE VOTERS REQUEST ==========");
        logger.info("Election ID: {}", electionId);
        logger.info("Voting Period ID: {}", votingPeriodId);
        logger.info("Status Filter: {}", status);
        logger.info("Search Query: {}", q);
        logger.info("Fellowship ID Filter: {}", fellowshipId);
        logger.info("Election Position ID Filter: {}", electionPositionId);
        logger.info("Pageable: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());

        String effectiveStatus = status == null ? "ALL" : status.toUpperCase();
        
        // Step 1: Fetch all eligible voters from database (NO filtering in query)
        logger.info("\n--- STEP 1: Fetching ALL potential eligible voters from database ---");
        Page<EligibleVoterProjection> unfilteredPage = votingCodeRepository.searchEligibleVoters(
                electionId,
                votingPeriodId,
                "ALL",  // Don't filter by status in query yet
                null,   // Don't filter by search in query yet
                null,   // Don't filter by fellowship in query yet
                null,   // Don't filter by position in query yet
                PageRequest.of(0, Integer.MAX_VALUE)  // Get all records
        );
        
        logger.info("Total unfiltered voters from database: {}", unfilteredPage.getTotalElements());
        List<EligibleVoterProjection> allProjections = unfilteredPage.getContent();
        
        // Step 2: Map to response objects and log each
        logger.info("\n--- STEP 2: Mapping to EligibleVoterResponse objects ---");
        List<EligibleVoterResponse> allResponses = new ArrayList<>();
        for (EligibleVoterProjection p : allProjections) {
            logger.debug("  Mapping: {} (ID: {})", p.getFullName(), p.getPersonId());
            EligibleVoterResponse response = map(p);
            allResponses.add(response);
        }
        logger.info("Total mapped responses: {}", allResponses.size());
        
        // Step 3: Apply status filter in Java
        logger.info("\n--- STEP 3: Applying status filter: {} ---", effectiveStatus);
        List<EligibleVoterResponse> statusFiltered = allResponses;
        if (!"ALL".equals(effectiveStatus)) {
            logger.info("  Before status filter: {}", statusFiltered.size());
            statusFiltered = statusFiltered.stream()
                .filter(voter -> {
                    boolean matches = false;
                    if ("VOTED".equals(effectiveStatus)) {
                        matches = voter.isVoted();
                    } else if ("NOT_VOTED".equals(effectiveStatus)) {
                        matches = !voter.isVoted();
                    }
                    if (matches) {
                        logger.debug("    ✓ {} - voted: {}", voter.getFullName(), voter.isVoted());
                    }
                    return matches;
                })
                .collect(Collectors.toList());
            logger.info("  After status filter: {}", statusFiltered.size());
        }
        
        // Step 4: Apply fellowship filter in Java
        logger.info("\n--- STEP 4: Applying fellowship filter: {} ---", fellowshipId);
        List<EligibleVoterResponse> fellowshipFiltered = statusFiltered;
        if (fellowshipId != null) {
            logger.info("  Before fellowship filter: {}", fellowshipFiltered.size());
            fellowshipFiltered = fellowshipFiltered.stream()
                .filter(voter -> {
                    boolean matches = voter.getFellowshipName() != null;
                    if (matches) {
                        logger.debug("    ✓ {} has fellowship: {}", voter.getFullName(), voter.getFellowshipName());
                    } else {
                        logger.debug("    ✗ {} has no fellowship", voter.getFullName());
                    }
                    return matches;
                })
                .collect(Collectors.toList());
            logger.info("  After fellowship filter: {}", fellowshipFiltered.size());
        }
        
        // Step 5: Apply election position filter in Java
        logger.info("\n--- STEP 5: Applying election position filter: {} ---", electionPositionId);
        List<EligibleVoterResponse> positionFiltered = fellowshipFiltered;
        if (electionPositionId != null) {
            logger.info("  Before position filter: {}", positionFiltered.size());
            positionFiltered = positionFiltered.stream()
                .filter(voter -> {
                    boolean matches = voter.getPosition() != null;
                    if (matches) {
                        logger.debug("    ✓ {} has position: {}", voter.getFullName(), voter.getPosition());
                    } else {
                        logger.debug("    ✗ {} has no position", voter.getFullName());
                    }
                    return matches;
                })
                .collect(Collectors.toList());
            logger.info("  After position filter: {}", positionFiltered.size());
        }
        
        // Step 6: Apply search query filter in Java
        logger.info("\n--- STEP 6: Applying search query filter: {} ---", q);
        List<EligibleVoterResponse> queryFiltered = positionFiltered;
        if (q != null && !q.isBlank()) {
            String queryLower = q.toLowerCase().trim();
            logger.info("  Before search filter: {}", queryFiltered.size());
            queryFiltered = queryFiltered.stream()
                .filter(voter -> {
                    boolean matches = (voter.getFullName() != null && voter.getFullName().toLowerCase().contains(queryLower))
                        || (voter.getPhoneNumber() != null && voter.getPhoneNumber().contains(q))
                        || (voter.getEmail() != null && voter.getEmail().toLowerCase().contains(queryLower));
                    if (matches) {
                        logger.debug("    ✓ {} matches search", voter.getFullName());
                    }
                    return matches;
                })
                .collect(Collectors.toList());
            logger.info("  After search filter: {}", queryFiltered.size());
        }
        
        // Step 7: Apply pagination
        logger.info("\n--- STEP 7: Applying pagination ---");
        int pageNum = pageable.getPageNumber();
        int pageSize = pageable.getPageSize();
        int total = queryFiltered.size();
        
        int fromIndex = pageNum * pageSize;
        int toIndex = Math.min(fromIndex + pageSize, total);
        
        logger.info("  Total results: {}", total);
        logger.info("  Requested page: {}, size: {}", pageNum, pageSize);
        logger.info("  Returning records {} to {} (of {})", fromIndex, toIndex, total);
        
        List<EligibleVoterResponse> paginated;
        if (fromIndex >= total) {
            logger.warn("  Page number exceeds total results!");
            paginated = new ArrayList<>();
        } else {
            paginated = queryFiltered.subList(fromIndex, toIndex);
        }
        
        logger.info("  Records in this page: {}", paginated.size());
        
        // Step 8: Create pageable response
        logger.info("\n--- STEP 8: Creating pageable response ---");
        Page<EligibleVoterResponse> result = new PageImpl<>(
            paginated,
            pageable,
            total
        );
        
        logger.info("========== ELIGIBLE VOTERS RESPONSE ==========");
        logger.info("Total eligible voters: {}", result.getTotalElements());
        logger.info("Total pages: {}", result.getTotalPages());
        logger.info("Current page: {}", result.getNumber());
        logger.info("Records in this page: {}", result.getContent().size());
        logger.info("Voters in response:");
        for (EligibleVoterResponse voter : result.getContent()) {
            logger.info("  - {} (ID: {}) [Position: {}, Location: {}, Override: {}]",
                voter.getFullName(),
                voter.getPersonId(),
                voter.getPosition(),
                voter.getLocation(),
                voter.getIsOverride());
        }
        logger.info("===========================================\n");
        
        return result;
    }

    public CountResponse countEligibleVoters(Long electionId,
                                             Long votingPeriodId,
                                             String status,
                                             Long fellowshipId,
                                             Long electionPositionId) {
        logger.info("Counting eligible voters - Election: {}, Period: {}", electionId, votingPeriodId);
        
        // Reuse the list method with minimal pagination
        Page<EligibleVoterResponse> page = listEligibleVoters(
                electionId,
                votingPeriodId,
                status,
                null,
                fellowshipId,
                electionPositionId,
                PageRequest.of(0, 1)
        );
        
        logger.info("Total count: {}", page.getTotalElements());
        return new CountResponse(page.getTotalElements());
    }

    private EligibleVoterResponse map(EligibleVoterProjection p) {
        List<VotingCodeHistory> history = null;
        List<PositionSummary> positions = null;
        try {
            if (p.getCodeHistoryJson() != null) {
                history = objectMapper.readValue(p.getCodeHistoryJson(), new TypeReference<List<VotingCodeHistory>>() {});
            }
            if (p.getPositionsSummaryJson() != null) {
                positions = objectMapper.readValue(p.getPositionsSummaryJson(), new TypeReference<List<PositionSummary>>() {});
            }
        } catch (Exception e) {
            logger.warn("Error parsing JSON for person {}: {}", p.getPersonId(), e.getMessage());
        }

        return new EligibleVoterResponse(
                p.getPersonId(),
                p.getFullName(),
                p.getPhoneNumber(),
                p.getEmail(),
                p.getFellowshipName(),
                p.getScope(),
                p.getScopeName(),
                p.getVoted() != null && p.getVoted() != 0,
                p.getVoteCastAt(),
                p.getLastCodeStatus(),
                p.getLastCodeIssuedAt(),
                p.getLastCodeUsedAt(),
                p.getCode(),
                p.getIsOverride() != null && p.getIsOverride() != 0,
                p.getOverrideReason(),
                p.getLeadershipAssignmentId(),
                history,
                p.getPositionAndLocation(),
                positions,
                p.getPosition(),
                p.getLocation(),
                p.getFellowship()
        );
    }

    private String normalizeQuery(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        return q.trim();
    }
}