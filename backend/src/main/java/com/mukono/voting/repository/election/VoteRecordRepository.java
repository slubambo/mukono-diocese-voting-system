package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.VoteRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface VoteRecordRepository extends JpaRepository<VoteRecord, Long> {

    boolean existsByElectionIdAndVotingPeriodIdAndPersonIdAndPositionId(Long electionId, Long votingPeriodId, Long personId, Long positionId);

    @Query("""
        SELECT vr FROM VoteRecord vr
        WHERE vr.election.id = :electionId
          AND vr.votingPeriod.id = :votingPeriodId
          AND vr.person.id = :personId
          AND vr.position.id IN :positionIds
    """)
    List<VoteRecord> findExistingForPositions(@Param("electionId") Long electionId,
                                               @Param("votingPeriodId") Long votingPeriodId,
                                               @Param("personId") Long personId,
                                               @Param("positionIds") Collection<Long> positionIds);

    // Count distinct voters for a position (turnout for position)
    @Query("""
        SELECT COUNT(DISTINCT vr.person.id) FROM VoteRecord vr
        WHERE vr.election.id     = :electionId
          AND vr.votingPeriod.id = :votingPeriodId
          AND vr.position.id     = :positionId
    """)
    Long countDistinctVotersForPosition(@Param("electionId") Long electionId,
                                        @Param("votingPeriodId") Long votingPeriodId,
                                        @Param("positionId") Long positionId);

    // Count distinct voters across election + voting period
    @Query("""
        SELECT COUNT(DISTINCT vr.person.id) FROM VoteRecord vr
        WHERE vr.election.id     = :electionId
          AND vr.votingPeriod.id = :votingPeriodId
    """)
    Long countDistinctVotersForElection(@Param("electionId") Long electionId,
                                        @Param("votingPeriodId") Long votingPeriodId);
}