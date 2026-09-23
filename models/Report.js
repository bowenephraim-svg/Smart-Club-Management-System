const db = require('../config/db');

class Report {

    // Students
    static async totalStudents() {

        const [[row]] = await db.query(`
            SELECT COUNT(*) total
            FROM students
        `);

        return row.total;
    }

    // Clubs
    static async totalClubs() {

        const [[row]] = await db.query(`
            SELECT COUNT(*) total
            FROM clubs
        `);

        return row.total;
    }

    // Memberships
    static async totalMemberships() {

        const [[row]] = await db.query(`
            SELECT COUNT(*) total
            FROM memberships
            WHERE status='Active'
        `);

        return row.total;
    }

    // Activities
    static async totalActivities() {

        const [[row]] = await db.query(`
            SELECT COUNT(*) total
            FROM activities
        `);

        return row.total;
    }

    // Income
    static async totalIncome() {

        const [[row]] = await db.query(`
            SELECT IFNULL(SUM(amount),0) total
            FROM payments
            WHERE status='Paid'
        `);

        return row.total;
    }

    // Expenses
    static async totalExpenses() {

        const [[row]] = await db.query(`
            SELECT IFNULL(SUM(amount),0) total
            FROM expenses
        `);

        return row.total;
    }

    // Total Patrons
    static async totalPatrons() {

        const [[row]] = await db.query(`
            SELECT COUNT(*) total
            FROM patrons
        `);

        return row.total;
    }

    // Active Clubs with member counts
    static async getActiveClubs() {

        const [rows] = await db.query(`
            SELECT
                c.club_id,
                c.club_name,
                c.description,
                c.venue,
                c.meeting_day,
                COUNT(CASE WHEN m.status = 'Active' THEN m.membership_id END) AS active_members,
                COUNT(CASE WHEN m.status = 'Pending' THEN m.membership_id END) AS pending_members
            FROM clubs c
            LEFT JOIN memberships m ON c.club_id = m.club_id
            GROUP BY c.club_id
            ORDER BY c.club_name ASC
        `);

        return rows;
    }

    // Club Finances Summary
    static async getClubFinances() {

        const [rows] = await db.query(`
            SELECT
                c.club_id,
                c.club_name,
                COALESCE((
                    SELECT SUM(p.amount)
                    FROM payments p
                    WHERE p.club_id = c.club_id
                    AND p.status = 'Paid'
                ), 0) AS income,
                COALESCE((
                    SELECT SUM(e.amount)
                    FROM expenses e
                    WHERE e.club_id = c.club_id
                ), 0) AS expenses,
                COALESCE((
                    SELECT SUM(p.amount)
                    FROM payments p
                    WHERE p.club_id = c.club_id
                    AND p.status = 'Paid'
                ), 0) - COALESCE((
                    SELECT SUM(e.amount)
                    FROM expenses e
                    WHERE e.club_id = c.club_id
                ), 0) AS balance
            FROM clubs c
            ORDER BY c.club_name ASC
        `);

        return rows;
    }

    // Monthly Finance
    static async getMonthlyFinance() {

        const [rows] = await db.query(`
            SELECT
                months.month,
                COALESCE(p.income, 0) AS income,
                COALESCE(e.expenses, 0) AS expenses,
                COALESCE(p.income, 0) - COALESCE(e.expenses, 0) AS net
            FROM (
                SELECT DISTINCT DATE_FORMAT(payment_date, '%Y-%m') AS month
                FROM payments
                WHERE payment_date IS NOT NULL
                UNION
                SELECT DISTINCT DATE_FORMAT(expense_date, '%Y-%m') AS month
                FROM expenses
                WHERE expense_date IS NOT NULL
            ) months
            LEFT JOIN (
                SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month, SUM(amount) AS income
                FROM payments
                WHERE status = 'Paid' AND payment_date IS NOT NULL
                GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
            ) p ON months.month = p.month
            LEFT JOIN (
                SELECT DATE_FORMAT(expense_date, '%Y-%m') AS month, SUM(amount) AS expenses
                FROM expenses
                WHERE expense_date IS NOT NULL
                GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
            ) e ON months.month = e.month
            ORDER BY months.month ASC
        `);

        return rows;
    }
    // ==========================================
// STUDENT REPORT
// ==========================================
static async getStudents() {

    const [rows] = await db.query(`
        SELECT
            student_id,
            admission_no,
            first_name,
            last_name,
            class,
            gender
        FROM students
        ORDER BY student_id DESC
    `);

    return rows;
}


// ==========================================
// CLUB REPORT
// ==========================================
static async getClubs() {

    const [rows] = await db.query(`
        SELECT
            c.club_id,
            c.club_name,
            p.full_name AS patron_name,
            c.created_at AS date_created
        FROM clubs c
        LEFT JOIN patrons p
            ON c.patron_id = p.patron_id
        ORDER BY c.club_name
    `);

    return rows;
}


// ==========================================
// ATTENDANCE REPORT
// ==========================================
static async getAttendance() {
    const [rows] = await db.query(`
        SELECT
            a.activity_id,
            act.activity_name,
            c.club_name,
            COUNT(DISTINCT a.student_id) AS registrations
        FROM attendance a
        LEFT JOIN activities act
            ON a.activity_id = act.activity_id
        LEFT JOIN clubs c
            ON act.club_id = c.club_id
        GROUP BY
            a.activity_id,
            act.activity_name,
            c.club_name
        ORDER BY MAX(a.attendance_date) DESC
    `);

    return rows;
}


// ==========================================
// FINANCE REPORT
// ==========================================
static async getFinance() {

    // Total income
    const [[income]] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) AS totalIncome
        FROM payments
        WHERE status = 'Paid'
    `);

    // Total expenses
    const [[expenses]] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) AS totalExpenses
        FROM expenses
    `);

    // Finance by club
    const [clubFinances] = await db.query(`
        SELECT
            c.club_name,

            COALESCE((
                SELECT SUM(p.amount)
                FROM payments p
                WHERE p.club_id = c.club_id
                AND p.status = 'Paid'
            ), 0) AS income,

            COALESCE((
                SELECT SUM(e.amount)
                FROM expenses e
                WHERE e.club_id = c.club_id
            ), 0) AS expenses

        FROM clubs c

        ORDER BY income DESC
    `);

    // Monthly finance
    const [monthlyFinance] = await db.query(`
        SELECT
            months.month,
            COALESCE(p.income, 0) AS income,
            COALESCE(e.expenses, 0) AS expenses

        FROM (
            SELECT DISTINCT
                DATE_FORMAT(payment_date, '%Y-%m') AS month
            FROM payments
            WHERE payment_date IS NOT NULL

            UNION

            SELECT DISTINCT
                DATE_FORMAT(expense_date, '%Y-%m') AS month
            FROM expenses
            WHERE expense_date IS NOT NULL
        ) months

        LEFT JOIN (
            SELECT
                DATE_FORMAT(payment_date, '%Y-%m') AS month,
                SUM(amount) AS income
            FROM payments
            WHERE status = 'Paid'
            AND payment_date IS NOT NULL
            GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
        ) p
            ON months.month = p.month

        LEFT JOIN (
            SELECT
                DATE_FORMAT(expense_date, '%Y-%m') AS month,
                SUM(amount) AS expenses
            FROM expenses
            WHERE expense_date IS NOT NULL
            GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
        ) e
            ON months.month = e.month

        ORDER BY months.month ASC
    `);

    return {
        totalIncome: Number(income.totalIncome),
        totalExpenses: Number(expenses.totalExpenses),

        balance:
            Number(income.totalIncome) -
            Number(expenses.totalExpenses),

        clubFinances,
        monthlyFinance
    };
}


// ==========================================
// ANALYTICS REPORT
// ==========================================
static async getAnalytics() {

    // Summary numbers
    const [[studentCount]] = await db.query(`
        SELECT COUNT(*) AS total
        FROM students
    `);

    const [[clubCount]] = await db.query(`
        SELECT COUNT(*) AS total
        FROM clubs
    `);

    const [[membershipCount]] = await db.query(`
        SELECT COUNT(*) AS total
        FROM memberships
        WHERE status='Active'
    `);


    const [[paymentTotal]] = await db.query(`
        SELECT COALESCE(SUM(amount),0) AS total
        FROM payments
        WHERE status='Paid'
    `);


    const [[expenseTotal]] = await db.query(`
        SELECT COALESCE(SUM(amount),0) AS total
        FROM expenses
    `);



    // ==========================================
    // MEMBERS PER CLUB
    // ==========================================

    const [clubMemberships] = await db.query(`
        SELECT
            c.club_name,
            COUNT(m.membership_id) AS members
        FROM clubs c
        LEFT JOIN memberships m
            ON c.club_id = m.club_id
            AND m.status='Active'
        GROUP BY c.club_id
        ORDER BY members DESC
    `);



   // ==========================================
// MONTHLY PAYMENTS
// ==========================================
const [monthlyPayments] = await db.query(`
    SELECT
        DATE_FORMAT(payment_date, '%Y-%m') AS month_key,
        DATE_FORMAT(payment_date, '%b %Y') AS month,
        SUM(amount) AS total
    FROM payments
    WHERE status = 'Paid'
      AND payment_date IS NOT NULL
        GROUP BY
                DATE_FORMAT(payment_date, '%Y-%m'),
                DATE_FORMAT(payment_date, '%b %Y')
    ORDER BY month_key
`);



   // ==========================================
// MONTHLY EXPENSES
// ==========================================
const [monthlyExpenses] = await db.query(`
    SELECT
        DATE_FORMAT(expense_date, '%Y-%m') AS month_key,
        DATE_FORMAT(expense_date, '%b %Y') AS month,
        SUM(amount) AS total
    FROM expenses
    WHERE expense_date IS NOT NULL
    GROUP BY
        DATE_FORMAT(expense_date, '%Y-%m'),
        DATE_FORMAT(expense_date, '%b %Y')
    ORDER BY month_key
`);


// ==========================================
// ACTIVITY ATTENDANCE
// ==========================================
const [activityAttendance] = await db.query(`
    SELECT
        a.activity_id,
        a.activity_name,

        COUNT(DISTINCT er.student_id) AS registered,

        COUNT(
            DISTINCT CASE
                WHEN att.status = 'Present'
                THEN att.student_id
            END
        ) AS present

    FROM activities a

    LEFT JOIN event_registrations er
        ON a.activity_id = er.activity_id

    LEFT JOIN attendance att
        ON a.activity_id = att.activity_id

    GROUP BY
        a.activity_id,
        a.activity_name

    ORDER BY a.activity_id DESC
`);



    return {

        studentCount: studentCount.total,

        clubCount: clubCount.total,

        membershipCount: membershipCount.total,


        paymentTotal: Number(paymentTotal.total),

        expenseTotal: Number(expenseTotal.total),


        balance:
            Number(paymentTotal.total) -
            Number(expenseTotal.total),


        clubMemberships,

        monthlyPayments,

        monthlyExpenses,

        activityAttendance

    };

}


}

module.exports = Report;