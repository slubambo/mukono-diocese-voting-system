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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
        String effectiveStatus = status == null ? "ALL" : status.toUpperCase();
        
        Page<EligibleVoterProjection> page = votingCodeRepository.searchEligibleVoters(
                electionId,
                votingPeriodId,
                effectiveStatus,
                normalizeQuery(q),
                fellowshipId,
                electionPositionId,
                pageable
        );
        
        return page.map(this::map);
    }

    public CountResponse countEligibleVoters(Long electionId,
                                             Long votingPeriodId,
                                             String status,
                                             Long fellowshipId,
                                             Long electionPositionId) {
        // Reuse pageable query with size 1 to leverage count query
        Page<EligibleVoterProjection> page = votingCodeRepository.searchEligibleVoters(
                electionId,
                votingPeriodId,
                status == null ? "ALL" : status.toUpperCase(),
                null,
                fellowshipId,
                electionPositionId,
                PageRequest.of(0, 1)
        );
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
            logger.error("Error parsing JSON for person {}: {}", p.getPersonId(), e.getMessage());
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