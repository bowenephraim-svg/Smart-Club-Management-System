-- ============================================================
-- VICTORY SCHOOL MEMBERSHIP SYSTEM V2
-- MASTER DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS victory_school_membership_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE victory_school_membership_system;

-- ============================================================
-- 1. USERS / AUTHENTICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin','Patron','Teacher','Student','Staff') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


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

    CONSTRAINT fk_patron_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 3. STUDENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    admission_no VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    gender ENUM('Male','Female'),
    class VARCHAR(50),
    stream VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


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

    CONSTRAINT fk_club_patron
        FOREIGN KEY (patron_id)
        REFERENCES patrons(patron_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 5. MEMBERSHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS memberships (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    club_id INT NOT NULL,
    join_date DATE NOT NULL,

    status ENUM('Pending','Active','Rejected')
        DEFAULT 'Pending',

    approved_by INT NULL,
    approved_at DATETIME NULL,

    CONSTRAINT fk_membership_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_membership_club
        FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_membership_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    UNIQUE KEY unique_student_club (student_id, club_id),

    INDEX idx_membership_status (status),
    INDEX idx_membership_student (student_id),
    INDEX idx_membership_club (club_id)
) ENGINE=InnoDB;


-- ============================================================
-- 6. CLUB LEADERSHIP ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    membership_id INT NOT NULL,
    position VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,

    CONSTRAINT fk_role_membership
        FOREIGN KEY (membership_id)
        REFERENCES memberships(membership_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 7. ACTIVITIES / EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NULL,
    activity_name VARCHAR(100),
    description TEXT,
    activity_date DATE,
    venue VARCHAR(100),

    CONSTRAINT fk_activity_club
        FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_activity_club (club_id),
    INDEX idx_activity_date (activity_date)
) ENGINE=InnoDB;


-- ============================================================
-- 8. EVENT REGISTRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS event_registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    student_id INT NOT NULL,
    registration_date DATE DEFAULT (CURRENT_DATE),

    CONSTRAINT fk_registration_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(activity_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_registration_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_event_student (activity_id, student_id)
) ENGINE=InnoDB;


-- ============================================================
-- 9. ATTENDANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    student_id INT NOT NULL,
    attendance_date DATE NOT NULL,

    status ENUM('Present','Absent') NOT NULL,

    CONSTRAINT fk_attendance_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(activity_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_attendance (activity_id, student_id, attendance_date)
) ENGINE=InnoDB;


-- ============================================================
-- 10. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    club_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),

    CONSTRAINT fk_payment_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_payment_club
        FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 11. EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    expense_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,

    CONSTRAINT fk_expense_club
        FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 12. FINANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS finance (
    finance_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,

    CONSTRAINT fk_finance_club
        FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 13. ANNOUNCEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    posted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_announcement_user
        FOREIGN KEY (posted_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 14. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,

    status ENUM('Unread','Read')
        DEFAULT 'Unread',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_notification_user (user_id),
    INDEX idx_notification_status (status)
) ENGINE=InnoDB;


-- ============================================================
-- 15. GALLERY
-- ============================================================

CREATE TABLE IF NOT EXISTS gallery (
    gallery_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    title VARCHAR(100),
    image_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_gallery_club
        FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 16. GALLERY IMAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS gallery_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    gallery_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    caption VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_gallery_image_gallery
        FOREIGN KEY (gallery_id)
        REFERENCES gallery(gallery_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 17. CERTIFICATES
-- ============================================================

CREATE TABLE IF NOT EXISTS certificates (
    certificate_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    activity_id INT NOT NULL,
    certificate_no VARCHAR(50) NOT NULL UNIQUE,
    issued_date DATE NOT NULL,

    CONSTRAINT fk_certificate_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_certificate_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(activity_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 18. ELECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS elections (
    election_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    election_date DATE NOT NULL,

    status ENUM('Upcoming','Open','Closed')
        DEFAULT 'Upcoming',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_election_club
        FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_election_status (status),
    INDEX idx_election_date (election_date)
) ENGINE=InnoDB;


-- ============================================================
-- 19. ELECTION CANDIDATES
-- ============================================================

CREATE TABLE IF NOT EXISTS candidates (
    candidate_id INT AUTO_INCREMENT PRIMARY KEY,
    election_id INT NOT NULL,
    student_id INT NOT NULL,
    position VARCHAR(50) NOT NULL,

    CONSTRAINT fk_candidate_election
        FOREIGN KEY (election_id)
        REFERENCES elections(election_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_candidate_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_candidate_position (
        election_id,
        student_id,
        position
    ),

    INDEX idx_candidate_election (election_id),
    INDEX idx_candidate_student (student_id)
) ENGINE=InnoDB;


-- ============================================================
-- 20. VOTES
-- ============================================================

CREATE TABLE IF NOT EXISTS votes (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,

    election_id INT NOT NULL,
    candidate_id INT NOT NULL,
    student_id INT NOT NULL,

    vote_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vote_election
        FOREIGN KEY (election_id)
        REFERENCES elections(election_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_vote_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidates(candidate_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_vote_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- One student can vote only once in a particular election
    UNIQUE KEY unique_voter_per_election (
        election_id,
        student_id
    ),

    INDEX idx_vote_election (election_id),
    INDEX idx_vote_candidate (candidate_id)
) ENGINE=InnoDB;


-- ============================================================
-- 21. STUDENT INTERESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS student_interests (
    interest_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    interest VARCHAR(100) NOT NULL,

    CONSTRAINT fk_interest_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 22. ACHIEVEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
    achievement_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    achievement_date DATE,

    CONSTRAINT fk_achievement_club
        FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 23. RESOURCES
-- ============================================================

CREATE TABLE IF NOT EXISTS resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    resource_name VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    condition_status VARCHAR(50),

    CONSTRAINT fk_resource_club
        FOREIGN KEY (club_id)
        REFERENCES clubs(club_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 24. FEEDBACK
-- ============================================================

CREATE TABLE IF NOT EXISTS feedbacks (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    activity_id INT,
    rating INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_feedback_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(activity_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_feedback_rating
        CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;


-- ============================================================
-- 25. AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 26. SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    school_name VARCHAR(150) NOT NULL,
    school_logo VARCHAR(255),
    academic_year VARCHAR(20) NOT NULL,
    theme VARCHAR(20) DEFAULT 'Professional'
) ENGINE=InnoDB;


-- ============================================================
-- DEFAULT SYSTEM SETTINGS
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
    SELECT 1 FROM settings
);


-- ============================================================
-- END OF MASTER SCHEMA
-- ============================================================