-- =========================================================
-- FINANCE MANAGEMENT MODULE UPGRADE
-- Extends payments and expenses tables with additional
-- fields needed for complete finance management.
--
-- Run once:
--   mysql -u root -p victory_school_membership_system < database/finance_upgrade.sql
-- =========================================================

USE victory_school_membership_system;

-- =========================================================
-- PAYMENTS TABLE UPGRADE
-- =========================================================

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'Registration' AFTER payment_method,
    ADD COLUMN IF NOT EXISTS transaction_code VARCHAR(100) DEFAULT NULL AFTER payment_type,
    ADD COLUMN IF NOT EXISTS status ENUM('Pending','Paid','Rejected') DEFAULT 'Pending' AFTER transaction_code,
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL AFTER status,
    ADD COLUMN IF NOT EXISTS reference VARCHAR(100) DEFAULT NULL AFTER category,
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL AFTER reference,
    ADD COLUMN IF NOT EXISTS recorded_by INT DEFAULT NULL AFTER description,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER recorded_by,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL AFTER updated_at;

-- Foreign key for recorded_by
ALTER TABLE payments
    ADD CONSTRAINT IF NOT EXISTS fk_payments_recorded_by
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Indexes for common filters
ALTER TABLE payments
    ADD INDEX IF NOT EXISTS idx_payments_club (club_id),
    ADD INDEX IF NOT EXISTS idx_payments_student (student_id),
    ADD INDEX IF NOT EXISTS idx_payments_date (payment_date),
    ADD INDEX IF NOT EXISTS idx_payments_status (status),
    ADD INDEX IF NOT EXISTS idx_payments_category (category);

-- =========================================================
-- EXPENSES TABLE UPGRADE
-- =========================================================

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL AFTER expense_name,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL AFTER category,
    ADD COLUMN IF NOT EXISTS reference VARCHAR(100) DEFAULT NULL AFTER payment_method,
    ADD COLUMN IF NOT EXISTS recorded_by INT DEFAULT NULL AFTER reference,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER recorded_by,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL AFTER updated_at;

-- Foreign key for recorded_by
ALTER TABLE expenses
    ADD CONSTRAINT IF NOT EXISTS fk_expenses_recorded_by
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Indexes for common filters
ALTER TABLE expenses
    ADD INDEX IF NOT EXISTS idx_expenses_club (club_id),
    ADD INDEX IF NOT EXISTS idx_expenses_date (expense_date),
    ADD INDEX IF NOT EXISTS idx_expenses_category (category);

-- =========================================================
-- FINANCE TABLE UPGRADE (general transactions ledger)
-- =========================================================

ALTER TABLE finance
    ADD COLUMN IF NOT EXISTS type ENUM('Income','Expense') DEFAULT 'Income' AFTER club_id,
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL AFTER type,
    ADD COLUMN IF NOT EXISTS reference VARCHAR(100) DEFAULT NULL AFTER category,
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL AFTER amount,
    ADD COLUMN IF NOT EXISTS recorded_by INT DEFAULT NULL AFTER description,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER recorded_by,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL AFTER updated_at;

-- Foreign key for recorded_by
ALTER TABLE finance
    ADD CONSTRAINT IF NOT EXISTS fk_finance_recorded_by
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Indexes
ALTER TABLE finance
    ADD INDEX IF NOT EXISTS idx_finance_club (club_id),
    ADD INDEX IF NOT EXISTS idx_finance_date (date),
    ADD INDEX IF NOT EXISTS idx_finance_type (type),
    ADD INDEX IF NOT EXISTS idx_finance_category (category);
