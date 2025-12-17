package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.ElectionWinnerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ElectionWinnerAssignmentRepository extends JpaRepository<ElectionWinnerAssignment, Long> {

    /**
     * Find winner assignments for a tally run.
     */
    List<ElectionWinnerAssignment> findByTallyRunId(Long tallyRunId);

    /**
     * Find winner assignments for an election and voting period.
     */
    List<ElectionWinnerAssignment> findByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);

    /**
     * Count winner assignments.
     */
    long countByElectionIdAndVotingPeriodId(Long electionId, Long votingPeriodId);

    /**
     * Delete winner assignments by tally run (for rollback).
     */
    void deleteByTallyRunId(Long tallyRunId);
}
