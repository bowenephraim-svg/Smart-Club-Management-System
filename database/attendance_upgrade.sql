-- =========================================================
-- ATTENDANCE MANAGEMENT MODULE UPGRADE
-- Extends attendance table with notes, marked_by, timestamps,
-- additional statuses, and a unique voter constraint.
-- Run once:
--   mysql -u root -p victory_school_membership_system < database/attendance_upgrade.sql
-- =========================================================

USE victory_school_membership_system;

-- 1. Extend status to support Late and Excused
SET @sql = 'ALTER TABLE attendance MODIFY COLUMN status ENUM(''Present'',''Absent'',''Late'',''Excused'') NOT NULL DEFAULT ''Absent''';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Add metadata columns (idempotent)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = 'marked_by');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE attendance ADD COLUMN marked_by INT DEFAULT NULL AFTER status', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = 'notes');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE attendance ADD COLUMN notes TEXT DEFAULT NULL AFTER marked_by', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = 'created_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE attendance ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER notes', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = 'updated_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE attendance ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add foreign key for marked_by (idempotent)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND CONSTRAINT_NAME = 'fk_attendance_marked_by');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE attendance ADD CONSTRAINT fk_attendance_marked_by FOREIGN KEY (marked_by) REFERENCES users(user_id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Prevent duplicate attendance entries per student per activity (idempotent)
SET @uk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND CONSTRAINT_NAME = 'uq_attendance_activity_student');
SET @sql = IF(@uk_exists = 0, 'ALTER TABLE attendance ADD CONSTRAINT uq_attendance_activity_student UNIQUE KEY (activity_id, student_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Add indexes for common filters (idempotent)
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND INDEX_NAME = 'idx_attendance_activity');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE attendance ADD INDEX idx_attendance_activity (activity_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND INDEX_NAME = 'idx_attendance_student');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE attendance ADD INDEX idx_attendance_student (student_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND INDEX_NAME = 'idx_attendance_date');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE attendance ADD INDEX idx_attendance_date (attendance_date)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND INDEX_NAME = 'idx_attendance_status');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE attendance ADD INDEX idx_attendance_status (status)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
