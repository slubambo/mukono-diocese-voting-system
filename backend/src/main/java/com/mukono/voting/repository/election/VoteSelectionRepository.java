package com.mukono.voting.repository.election;

import com.mukono.voting.model.election.VoteSelection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteSelectionRepository extends JpaRepository<VoteSelection, Long> {
}
