-- =========================================================
-- EVENTS / ACTIVITIES MODULE UPGRADE
-- Creates the events table with activity_id as primary key,
-- compatible with the existing attendance.activity_id references.
--
-- Run once:
--   mysql -u root -p victory_school_membership_system < database/events_upgrade.sql
-- =========================================================

USE victory_school_membership_system;

-- 1. Create events table if it does not exist
CREATE TABLE IF NOT EXISTS events (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    event_date DATE NOT NULL,
    start_time TIME DEFAULT '08:00:00',
    end_time TIME DEFAULT '10:00:00',
    venue VARCHAR(150) DEFAULT NULL,
    status ENUM('Upcoming','Ongoing','Completed','Cancelled') DEFAULT 'Upcoming',
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(club_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 2. Add indexes for common filters (idempotent)
SET @idx_club := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND INDEX_NAME = 'idx_events_club');
SET @sql := IF(@idx_club = 0, 'ALTER TABLE events ADD INDEX idx_events_club (club_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_date := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND INDEX_NAME = 'idx_events_date');
SET @sql := IF(@idx_date = 0, 'ALTER TABLE events ADD INDEX idx_events_date (event_date)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_status := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND INDEX_NAME = 'idx_events_status');
SET @sql := IF(@idx_status = 0, 'ALTER TABLE events ADD INDEX idx_events_status (status)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_created_by := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND INDEX_NAME = 'idx_events_created_by');
SET @sql := IF(@idx_created_by = 0, 'ALTER TABLE events ADD INDEX idx_events_created_by (created_by)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
