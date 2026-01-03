package com.mukono.voting.service.election;

import com.mukono.voting.payload.response.common.CountResponse;
import com.mukono.voting.payload.response.election.EligibleVoterResponse;
import com.mukono.voting.repository.election.VoteRecordRepository;
import com.mukono.voting.repository.election.VotingCodeRepository;
import com.mukono.voting.repository.election.projection.EligibleVoterProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EligibleVoterService {

    private final VotingCodeRepository votingCodeRepository;
    private final VoteRecordRepository voteRecordRepository;

    public EligibleVoterService(VotingCodeRepository votingCodeRepository,
                                VoteRecordRepository voteRecordRepository) {
        this.votingCodeRepository = votingCodeRepository;
        this.voteRecordRepository = voteRecordRepository;
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
        return new EligibleVoterResponse(
                p.getPersonId(),
                p.getFullName(),
                p.getPhoneNumber(),
                p.getEmail(),
                p.getFellowshipName(),
                p.getScope(),
                p.getScopeName(),
                p.getVoted() != null && p.getVoted() != 0, // Convert Integer (1/0) to boolean
                p.getVoteCastAt(),
                p.getLastCodeStatus(),
                p.getLastCodeIssuedAt(),
                p.getLastCodeUsedAt(),
                p.getCode(), // voting code
                p.getIsOverride() != null && p.getIsOverride() != 0, // Convert Integer (1/0) to boolean
                p.getOverrideReason(),
                p.getLeadershipAssignmentId()
        );
    }

    private String normalizeQuery(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        return q.trim();
    }
}