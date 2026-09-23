-- =========================================================
-- SETTINGS TABLE UPGRADE
-- Adds School Profile & System Preferences columns
-- Run once:  mysql -u root -p victory_school_membership_system < database/settings_upgrade.sql
-- =========================================================

USE victory_school_membership_system;

-- School Profile fields
ALTER TABLE settings
    ADD COLUMN school_motto VARCHAR(255) DEFAULT NULL AFTER school_name,
    ADD COLUMN school_address VARCHAR(255) DEFAULT NULL AFTER school_motto,
    ADD COLUMN school_phone VARCHAR(50) DEFAULT NULL AFTER school_address,
    ADD COLUMN school_email VARCHAR(150) DEFAULT NULL AFTER school_phone,
    ADD COLUMN school_website VARCHAR(150) DEFAULT NULL AFTER school_email;

-- System Preferences fields
ALTER TABLE settings
    ADD COLUMN currency VARCHAR(10) DEFAULT 'KES' AFTER theme;

-- Update existing seed row with profile info
UPDATE settings
SET
    school_motto = 'Excellence, Integrity, Service',
    school_address = 'P.O. Box 123, Nairobi, Kenya',
    school_phone = '+254 700 000 000',
    school_email = 'info@victoryschool.ac.ke',
    school_website = 'https://victoryschool.ac.ke',
    currency = 'KES'
WHERE setting_id = 1;