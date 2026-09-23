-- ============================================================
-- VICTORY SCHOOL MEMBERSHIP SYSTEM V2
-- FINAL MASTER DATABASE SCHEMA
-- Updated through:
--   Students
--   Clubs
--   Membership Approval
--   Activities
--   Attendance
--   Payments
--   Expenses
--   Unified Finance
--   Reports & Analytics
--   Notifications
--   Elections & Voting
--   Student Interests
--   Achievements
--   Resources
--   Audit Logs
--   Settings
-- ============================================================

CREATE DATABASE IF NOT EXISTS victory_school_membership_system;

USE victory_school_membership_system;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

   role ENUM(
    'Admin',
    'Patron',
    'Student'
) NOT NULL

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. PATRONS
-- ============================================================

CREATE TABLE IF NOT EXISTS patrons (
    patron_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNIQUE,

    full_name VARCHAR(100) NOT NULL,

    phone VARCHAR(20),

    email VARCHAR(100),

    department VARCHAR(100),

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- ============================================================
-- 3. STUDENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNIQUE,

    admission_no VARCHAR(50) UNIQUE NOT NULL,

    first_name VARCHAR(50),

    last_name VARCHAR(50),

    gender ENUM('Male','Female'),

    class VARCHAR(50),

    stream VARCHAR(20),

    phone VARCHAR(20),

    email VARCHAR(100),

    photo VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- ============================================================
-- 4. CLUBS
-- ============================================================

CREATE TABLE IF NOT EXISTS clubs (
    club_id INT AUTO_INCREMENT PRIMARY KEY,

    club_name VARCHAR(100) NOT NULL,

    patron_name VARCHAR(100) NOT NULL,

    description TEXT,

    patron_id INT,

    meeting_day VARCHAR(20),

    venue VARCHAR(100),

    membership_fee DECIMAL(10,2) DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    date_created DATE,

    FOREIGN KEY (patron_id)
        REFERENCES patrons(patron_id)
        ON DELETE SET NULL
);


-- ============================================================
-- 5. MEMBERSHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS memberships (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    club_id INT NOT NULL,

    join_date DATE NOT NULL,

    status ENUM(
        'Pending',
        'Active',
        'Rejected'
    ) DEFAULT 'Pending',

    approved_by INT NULL,

    approved_at DATETIME NULL,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE,

    FOREIGN KEY (approved_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE KEY unique_student_club (student_id, club_id),

    INDEX idx_membership_student (student_id),

    INDEX idx_membership_club (club_id),

    INDEX idx_membership_status (status)
);


-- ============================================================
-- 6. LEADERSHIP ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,

    membership_id INT NOT NULL,

    position VARCHAR(50) NOT NULL,

    start_date DATE,

    end_date DATE,

    FOREIGN KEY (membership_id)
        REFERENCES memberships(membership_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 7. ACTIVITIES / EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,

    club_id INT NOT NULL,

    activity_name VARCHAR(100),

    description TEXT,

    activity_date DATE,

    venue VARCHAR(100),

    FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE,

    INDEX idx_activity_club (club_id),

    INDEX idx_activity_date (activity_date)
);


-- ============================================================
-- 8. EVENT REGISTRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS event_registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,

    activity_id INT NOT NULL,

    student_id INT NOT NULL,

    registration_date DATE,

    FOREIGN KEY (activity_id)
        REFERENCES activities(activity_id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    UNIQUE KEY unique_event_student (activity_id, student_id),

    INDEX idx_registration_activity (activity_id),

    INDEX idx_registration_student (student_id)
);


-- ============================================================
-- 9. ATTENDANCE
-- ============================================================
-- Updated to match Attendance.js
--
-- Supports:
-- Present
-- Absent
-- Late
-- Excused
--
-- Also supports:
-- marked_by
-- notes
-- created_at
-- updated_at
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,

    activity_id INT NOT NULL,

    student_id INT NOT NULL,

    attendance_date DATE NOT NULL,

    status ENUM(
        'Present',
        'Absent',
        'Late',
        'Excused'
    ) NOT NULL DEFAULT 'Absent',

    marked_by INT NULL,

    notes TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (activity_id)
        REFERENCES activities(activity_id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    FOREIGN KEY (marked_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    UNIQUE KEY unique_activity_student (
        activity_id,
        student_id
    ),

    INDEX idx_attendance_activity (activity_id),

    INDEX idx_attendance_student (student_id),

    INDEX idx_attendance_date (attendance_date),

    INDEX idx_attendance_status (status)
);


-- ============================================================
-- 10. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT,

    club_id INT,

    amount DECIMAL(10,2),

    payment_date DATE,

    payment_method VARCHAR(50),

    payment_type ENUM(
        'Registration',
        'Club Fee',
        'Event Fee'
    ) DEFAULT 'Registration',

    transaction_code VARCHAR(100) UNIQUE,

    status ENUM(
        'Pending',
        'Paid',
        'Rejected'
    ) DEFAULT 'Pending',

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE,

    INDEX idx_payment_student (student_id),

    INDEX idx_payment_club (club_id),

    INDEX idx_payment_date (payment_date),

    INDEX idx_payment_status (status)
);


-- ============================================================
-- 11. EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,

    club_id INT,

    expense_name VARCHAR(100),

    amount DECIMAL(10,2),

    expense_date DATE,

    description TEXT,

    FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE,

    INDEX idx_expense_club (club_id),

    INDEX idx_expense_date (expense_date)
);


-- ============================================================
-- 12. UNIFIED FINANCE LEDGER
-- ============================================================
-- Updated to match Finance.js
--
-- type
-- category
-- reference
-- recorded_by
-- deleted_at
-- ============================================================

CREATE TABLE IF NOT EXISTS finance (
    finance_id INT AUTO_INCREMENT PRIMARY KEY,

    club_id INT NULL,

    type ENUM(
        'Income',
        'Expense'
    ) NOT NULL DEFAULT 'Income',

    amount DECIMAL(10,2) NOT NULL,

    date DATE NOT NULL,

    category VARCHAR(100),

    reference VARCHAR(100),

    description TEXT,

    recorded_by INT NULL,

    deleted_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE SET NULL,

    FOREIGN KEY (recorded_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    INDEX idx_finance_club (club_id),

    INDEX idx_finance_type (type),

    INDEX idx_finance_date (date),

    INDEX idx_finance_category (category),

    INDEX idx_finance_deleted (deleted_at),

    INDEX idx_finance_recorded_by (recorded_by)
);


-- ============================================================
-- 13. ANNOUNCEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(150) NOT NULL,

    message TEXT NOT NULL,

    posted_by INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (posted_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- ============================================================
-- 14. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    message TEXT NOT NULL,

    status ENUM(
        'Unread',
        'Read'
    ) DEFAULT 'Unread',

    type VARCHAR(50),

    related_id INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    INDEX idx_notification_user (user_id),

    INDEX idx_notification_status (status)
);


-- ============================================================
-- 15. GALLERY
-- ============================================================

CREATE TABLE IF NOT EXISTS gallery (
    gallery_id INT AUTO_INCREMENT PRIMARY KEY,

    club_id INT NOT NULL,

    title VARCHAR(100),

    image_path VARCHAR(255) NOT NULL,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 16. GALLERY IMAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS gallery_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,

    gallery_id INT NOT NULL,

    image_path VARCHAR(255) NOT NULL,

    caption VARCHAR(255),

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (gallery_id)
        REFERENCES gallery(gallery_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 17. CERTIFICATES
-- ============================================================

CREATE TABLE IF NOT EXISTS certificates (
    certificate_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    activity_id INT NOT NULL,

    certificate_no VARCHAR(50) UNIQUE NOT NULL,

    issued_date DATE NOT NULL,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    FOREIGN KEY (activity_id)
        REFERENCES activities(activity_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 18. ELECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS elections (
    election_id INT AUTO_INCREMENT PRIMARY KEY,

    club_id INT NOT NULL,

    title VARCHAR(100) NOT NULL,

    election_date DATE NOT NULL,

    status ENUM(
        'Upcoming',
        'Open',
        'Closed'
    ) DEFAULT 'Upcoming',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE,

    INDEX idx_election_club (club_id),

    INDEX idx_election_date (election_date),

    INDEX idx_election_status (status)
);


-- ============================================================
-- 19. CANDIDATES
-- ============================================================

CREATE TABLE IF NOT EXISTS candidates (
    candidate_id INT AUTO_INCREMENT PRIMARY KEY,

    election_id INT NOT NULL,

    student_id INT NOT NULL,

    position VARCHAR(50) NOT NULL,

    FOREIGN KEY (election_id)
        REFERENCES elections(election_id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    UNIQUE KEY unique_candidate_position (
        election_id,
        student_id,
        position
    ),

    INDEX idx_candidate_election (election_id),

    INDEX idx_candidate_student (student_id)
);


-- ============================================================
-- 20. VOTES
-- ============================================================
-- One student can vote only once in each election.
-- ============================================================

CREATE TABLE IF NOT EXISTS votes (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,

    election_id INT NOT NULL,

    candidate_id INT NOT NULL,

    student_id INT NOT NULL,

    vote_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (election_id)
        REFERENCES elections(election_id)
        ON DELETE CASCADE,

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(candidate_id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    UNIQUE KEY unique_voter_per_election (
        election_id,
        student_id
    ),

    INDEX idx_vote_election (election_id),

    INDEX idx_vote_candidate (candidate_id),

    INDEX idx_vote_student (student_id)
);


-- ============================================================
-- 21. STUDENT INTERESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS student_interests (
    interest_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    interest VARCHAR(100) NOT NULL,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 22. ACHIEVEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
    achievement_id INT AUTO_INCREMENT PRIMARY KEY,

    club_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,

    description TEXT,

    achievement_date DATE,

    FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 23. RESOURCES
-- ============================================================

CREATE TABLE IF NOT EXISTS resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,

    club_id INT NOT NULL,

    resource_name VARCHAR(100) NOT NULL,

    quantity INT DEFAULT 1,

    condition_status VARCHAR(50),

    FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 24. AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,

    action VARCHAR(255) NOT NULL,

    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    INDEX idx_audit_user (user_id),

    INDEX idx_audit_time (log_time)
);


-- ============================================================
-- 25. SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,

    school_name VARCHAR(150) NOT NULL,

    school_logo VARCHAR(255),

    academic_year VARCHAR(20) NOT NULL,

    theme VARCHAR(20) DEFAULT 'Professional'
);


-- ============================================================
-- DEFAULT SCHOOL SETTINGS
-- ============================================================

INSERT INTO settings (
    school_name,
    academic_year,
    theme
)
SELECT
    'Victory School',
    '2026',
    'Professional'
WHERE NOT EXISTS (
    SELECT 1
    FROM settings
);


-- ============================================================
-- END OF VICTORY SCHOOL MEMBERSHIP SYSTEM V2
-- ============================================================