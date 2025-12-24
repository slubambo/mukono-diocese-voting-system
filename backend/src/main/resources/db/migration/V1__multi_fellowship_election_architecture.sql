-- Multi-Fellowship Election Architecture Migration
-- Date: 2025-12-22
-- Description: Updates Election model to support multiple fellowships via voting periods

-- =====================================================================
-- STEP 1: Make election.fellowship_id nullable (deprecated field)
-- =====================================================================
ALTER TABLE elections 
  MODIFY COLUMN fellowship_id BIGINT NULL 
  COMMENT 'DEPRECATED: Fellowships now inferred from election_positions';

-- =====================================================================
-- STEP 2: Add fellowship_id and max_votes_per_voter to election_positions
-- =====================================================================
ALTER TABLE election_positions 
  ADD COLUMN fellowship_id BIGINT NULL AFTER election_id,
  ADD COLUMN max_votes_per_voter INT NOT NULL DEFAULT 1 AFTER seats;

-- Add index for fellowship_id
ALTER TABLE election_positions 
  ADD INDEX idx_election_positions_fellowship (fellowship_id);

-- Add foreign key constraint
ALTER TABLE election_positions 
  ADD CONSTRAINT fk_election_positions_fellowship 
  FOREIGN KEY (fellowship_id) REFERENCES fellowships(id);

-- =====================================================================
-- STEP 3: Backfill fellowship_id for existing election_positions
-- =====================================================================
UPDATE election_positions ep
JOIN elections e ON ep.election_id = e.id
SET ep.fellowship_id = e.fellowship_id
WHERE ep.fellowship_id IS NULL AND e.fellowship_id IS NOT NULL;

-- =====================================================================
-- STEP 4: Make fellowship_id required (after backfill)
-- =====================================================================
ALTER TABLE election_positions 
  MODIFY COLUMN fellowship_id BIGINT NOT NULL;

-- =====================================================================
-- STEP 5: Update unique constraint to include fellowship_id
-- =====================================================================
ALTER TABLE election_positions 
  DROP INDEX uk_election_fellowship_position;

ALTER TABLE election_positions 
  ADD UNIQUE KEY uk_election_fellowship_position (election_id, fellowship_id, fellowship_position_id);

-- =====================================================================
-- STEP 6: Create voting_period_positions join table
-- =====================================================================
CREATE TABLE IF NOT EXISTS voting_period_positions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  election_id BIGINT NOT NULL COMMENT 'Denormalized for efficient queries',
  voting_period_id BIGINT NOT NULL,
  election_position_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE KEY uk_voting_period_position (voting_period_id, election_position_id),
  INDEX idx_vpp_voting_period (voting_period_id),
  INDEX idx_vpp_election_position (election_position_id),
  INDEX idx_vpp_election (election_id),
  
  -- Foreign keys
  CONSTRAINT fk_vpp_voting_period 
    FOREIGN KEY (voting_period_id) REFERENCES voting_periods(id) ON DELETE CASCADE,
  CONSTRAINT fk_vpp_election_position 
    FOREIGN KEY (election_position_id) REFERENCES election_positions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- STEP 7: Optional - Default mapping for existing voting periods
-- =====================================================================
-- This will assign ALL election positions to ALL existing voting periods
-- Comment out if you want to manually assign positions instead

INSERT INTO voting_period_positions (election_id, voting_period_id, election_position_id)
SELECT 
  vp.election_id,
  vp.id AS voting_period_id,
  ep.id AS election_position_id
FROM voting_periods vp
CROSS JOIN election_positions ep
WHERE vp.election_id = ep.election_id
  AND NOT EXISTS (
    SELECT 1 FROM voting_period_positions vpp 
    WHERE vpp.voting_period_id = vp.id 
      AND vpp.election_position_id = ep.id
  );

-- =====================================================================
-- VERIFICATION QUERIES (Run these to verify migration success)
-- =====================================================================

-- Check fellowship_id is populated in election_positions
-- SELECT COUNT(*) as positions_with_fellowship FROM election_positions WHERE fellowship_id IS NOT NULL;

-- Check voting_period_positions table exists and has data
-- SELECT COUNT(*) as position_mappings FROM voting_period_positions;

-- Verify unique constraint on election_positions
-- SHOW INDEX FROM election_positions WHERE Key_name = 'uk_election_fellowship_position';

-- Verify voting_period_positions has correct indexes
-- SHOW INDEX FROM voting_period_positions;

-- Sample query to see positions by fellowship for an election
-- SELECT 
--   f.name AS fellowship_name,
--   COUNT(DISTINCT ep.id) AS position_count
-- FROM election_positions ep
-- JOIN fellowships f ON ep.fellowship_id = f.id
-- WHERE ep.election_id = 364
-- GROUP BY f.id, f.name;

-- =====================================================================
-- ROLLBACK SCRIPT (Use only if needed to undo changes)
-- =====================================================================
-- CAUTION: This will delete voting_period_positions data
/*
DROP TABLE IF EXISTS voting_period_positions;

ALTER TABLE election_positions 
  DROP FOREIGN KEY IF EXISTS fk_election_positions_fellowship,
  DROP INDEX IF EXISTS idx_election_positions_fellowship,
  DROP COLUMN IF EXISTS max_votes_per_voter,
  DROP COLUMN IF EXISTS fellowship_id;

ALTER TABLE election_positions 
  DROP INDEX IF EXISTS uk_election_fellowship_position,
  ADD UNIQUE KEY uk_election_fellowship_position (election_id, fellowship_position_id);

ALTER TABLE elections 
  MODIFY COLUMN fellowship_id BIGINT NOT NULL;
*/
