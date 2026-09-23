-- =========================================================
-- ELECTIONS & VOTING SYSTEM UPGRADE
-- Adds description to elections, election_id to votes,
-- and a unique constraint to prevent double voting.
-- Run once:  mysql -u root -p victory_school_membership_system < database/elections_upgrade.sql
-- =========================================================

USE victory_school_membership_system;

-- 1. Add description column to elections (nullable, safe)
ALTER TABLE elections
    ADD COLUMN description TEXT DEFAULT NULL AFTER title;

-- 2. Add election_id column to votes (nullable initially, safe)
ALTER TABLE votes
    ADD COLUMN election_id INT DEFAULT NULL AFTER vote_id;

-- 3. Add foreign key from votes.election_id to elections.election_id
ALTER TABLE votes
    ADD CONSTRAINT fk_votes_election
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE;

-- 4. Add unique constraint to prevent double voting
--    (one student can only vote once per election)
ALTER TABLE votes
    ADD CONSTRAINT uq_votes_election_student
    UNIQUE KEY (election_id, student_id);