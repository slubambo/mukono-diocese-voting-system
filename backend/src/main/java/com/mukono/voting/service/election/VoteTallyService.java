package com.mukono.voting.service.election;

import com.mukono.voting.model.election.Election;
import com.mukono.voting.model.election.ElectionPosition;
import com.mukono.voting.model.election.VotingPeriod;
import com.mukono.voting.repository.election.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class VoteTallyService {

    private final VoteSelectionRepository voteSelectionRepository;
    private final VoteRecordRepository voteRecordRepository;
    private final ElectionRepository electionRepository;
    private final VotingPeriodRepository votingPeriodRepository;
    private final ElectionPositionRepository electionPositionRepository;

    public VoteTallyService(VoteSelectionRepository voteSelectionRepository,
                            VoteRecordRepository voteRecordRepository,
                            ElectionRepository electionRepository,
                            VotingPeriodRepository votingPeriodRepository,
                            ElectionPositionRepository electionPositionRepository) {
        this.voteSelectionRepository = voteSelectionRepository;
        this.voteRecordRepository = voteRecordRepository;
        this.electionRepository = electionRepository;
        this.votingPeriodRepository = votingPeriodRepository;
        this.electionPositionRepository = electionPositionRepository;
    }

    public Map<Long, Long> countVotesByCandidate(Long electionId, Long votingPeriodId, Long positionId) {
        validateElectionAndPeriod(electionId, votingPeriodId);
        validatePositionBelongsToElection(electionId, positionId);

        List<CandidateVoteCount> counts = voteSelectionRepository.countVotesByCandidate(electionId, votingPeriodId, positionId);
        Map<Long, Long> result = new HashMap<>();
        for (CandidateVoteCount cvc : counts) {
            result.put(cvc.getCandidateId(), cvc.getVotes());
        }
        return result;
    }

    public Long countTurnoutForPosition(Long electionId, Long votingPeriodId, Long positionId) {
        validateElectionAndPeriod(electionId, votingPeriodId);
        validatePositionBelongsToElection(electionId, positionId);
        Long count = voteRecordRepository.countDistinctVotersForPosition(electionId, votingPeriodId, positionId);
        return count != null ? count : 0L;
    }

    public Long countElectionTurnout(Long electionId, Long votingPeriodId) {
        validateElectionAndPeriod(electionId, votingPeriodId);
        Long count = voteRecordRepository.countDistinctVotersForElection(electionId, votingPeriodId);
        return count != null ? count : 0L;
    }

    private void validateElectionAndPeriod(Long electionId, Long votingPeriodId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid electionId"));
        VotingPeriod period = votingPeriodRepository.findById(votingPeriodId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid votingPeriodId"));
        if (!period.getElection().getId().equals(election.getId())) {
            throw new IllegalArgumentException("VotingPeriod does not belong to election");
        }
    }

    private void validatePositionBelongsToElection(Long electionId, Long positionId) {
        ElectionPosition position = electionPositionRepository.findById(positionId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid positionId"));
        if (!position.getElection().getId().equals(electionId)) {
            throw new IllegalArgumentException("Position does not belong to election");
        }
    }
}
