USE victory_school_membership_system;

-- ============================================================
-- 1. MAKE SURE PATRONS ARE LINKED TO USERS
-- ============================================================

ALTER TABLE patrons
ADD COLUMN IF NOT EXISTS user_id INT NULL UNIQUE AFTER patron_id;

-- Add the foreign key only if it does not already exist.
-- If your database says the constraint already exists,
-- skip this ALTER TABLE statement.
ALTER TABLE patrons
ADD CONSTRAINT fk_patrons_user
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON DELETE SET NULL;


-- ============================================================
-- 2. MAKE SURE USERS HAVE THE CORRECT ACCOUNT STATUS
-- ============================================================

ALTER TABLE users
MODIFY COLUMN status
ENUM(
    'Pending Payment',
    'Pending Approval',
    'Approved',
    'Rejected'
)
DEFAULT 'Pending Payment';


-- ============================================================
-- 3. MEMBERSHIP APPROVAL TRACKING
-- ============================================================

ALTER TABLE memberships
MODIFY COLUMN status
ENUM('Pending','Active','Rejected')
DEFAULT 'Pending';

ALTER TABLE memberships
ADD COLUMN IF NOT EXISTS approved_by INT NULL;

ALTER TABLE memberships
ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL;


-- ============================================================
-- 4. NOTIFICATIONS
-- ============================================================

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'General';

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS related_id INT NULL;


-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_status
ON notifications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_memberships_club_status
ON memberships(club_id, status);

CREATE INDEX IF NOT EXISTS idx_memberships_student_club
ON memberships(student_id, club_id);

CREATE INDEX IF NOT EXISTS idx_users_role_status
ON users(role, status);


-- ============================================================
-- 6. VERIFY CLUB-PATRON RELATIONSHIP
-- ============================================================

-- Your clubs table already uses patron_id.
-- This ensures the relationship exists.
ALTER TABLE clubs
ADD INDEX IF NOT EXISTS idx_clubs_patron
(patron_id);


-- ============================================================
-- 7. SHOW CURRENT PATRON/CLUB ASSIGNMENTS
-- ============================================================

SELECT
    c.club_id,
    c.club_name,
    c.patron_id,
    p.full_name AS patron_name,
    p.user_id AS patron_user_id
FROM clubs c
LEFT JOIN patrons p
    ON c.patron_id = p.patron_id
ORDER BY c.club_name;