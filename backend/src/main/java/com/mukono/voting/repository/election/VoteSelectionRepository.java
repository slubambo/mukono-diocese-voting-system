package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.VoteSelection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VoteSelectionRepository extends JpaRepository<VoteSelection, Long> {
    @Query("""
        SELECT vs.candidate.id AS candidateId,
               COUNT(vs.id)        AS votes
        FROM VoteSelection vs
        JOIN vs.voteRecord vr
        WHERE vr.election.id     = :electionId
          AND vr.votingPeriod.id = :votingPeriodId
          AND vr.position.id     = :positionId
        GROUP BY vs.candidate.id
    """)
    List<CandidateVoteCount> countVotesByCandidate(@Param("electionId") Long electionId,
                                                   @Param("votingPeriodId") Long votingPeriodId,
                                                   @Param("positionId") Long positionId);

    // Count all VoteSelections for election + period
    @Query("""
        SELECT COUNT(vs.id) FROM VoteSelection vs
        JOIN vs.voteRecord vr
        WHERE vr.election.id = :electionId
          AND vr.votingPeriod.id = :votingPeriodId
    """)
    long countByElectionIdAndVotingPeriodId(@Param("electionId") Long electionId,
                                            @Param("votingPeriodId") Long votingPeriodId);
}