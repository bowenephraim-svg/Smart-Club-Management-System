const db = require('../config/db');

const Payment = {

    // ==========================================
    // GET ALL PAYMENTS (with filters)
    // ==========================================
    async getAll(filters = {}) {
        const conditions = [];
        const values = [];

        if (filters.club_id) {
            conditions.push('p.club_id = ?');
            values.push(filters.club_id);
        }
        if (filters.student_id) {
            conditions.push('p.student_id = ?');
            values.push(filters.student_id);
        }
        if (filters.status) {
            conditions.push('p.status = ?');
            values.push(filters.status);
        }
        if (filters.category) {
            conditions.push('p.category = ?');
            values.push(filters.category);
        }
        if (filters.payment_method) {
            conditions.push('p.payment_method = ?');
            values.push(filters.payment_method);
        }
        if (filters.date_from) {
            conditions.push('p.payment_date >= ?');
            values.push(filters.date_from);
        }
        if (filters.date_to) {
            conditions.push('p.payment_date <= ?');
            values.push(filters.date_to);
        }
        if (filters.search) {
            conditions.push('(CONCAT(s.first_name, " ", s.last_name) LIKE ? OR p.transaction_code LIKE ? OR p.reference LIKE ? OR p.description LIKE ? OR c.club_name LIKE ?)');
            const term = `%${filters.search}%`;
            values.push(term, term, term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT
                p.*,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.admission_no,
                c.club_name,
                u.full_name AS recorded_by_name
            FROM payments p
            LEFT JOIN students s ON p.student_id = s.student_id
            LEFT JOIN clubs c ON p.club_id = c.club_id
            LEFT JOIN users u ON p.recorded_by = u.user_id
            ${whereClause}
            ORDER BY p.payment_date DESC, p.payment_id DESC
        `;

        const [rows] = await db.query(sql, values);
        return rows;
    },

    // ==========================================
    // TOTAL PAYMENTS
    // ==========================================
    async getTotal(filters = {}) {
        const conditions = [];
        const values = [];

        if (filters.club_id) {
            conditions.push('club_id = ?');
            values.push(filters.club_id);
        }
        if (filters.date_from) {
            conditions.push('payment_date >= ?');
            values.push(filters.date_from);
        }
        if (filters.date_to) {
            conditions.push('payment_date <= ?');
            values.push(filters.date_to);
        }
        if (filters.status) {
            conditions.push('status = ?');
            values.push(filters.status);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const [rows] = await db.query(
            `SELECT COALESCE(SUM(amount),0) AS total FROM payments ${whereClause}`,
            values
        );
        return rows[0]?.total || 0;
    },

    // ==========================================
    // DASHBOARD TOTALS
    // ==========================================
    async getTotals(filters = {}) {
        const conditions = [];
        const values = [];

        if (filters.club_id) {
            conditions.push('club_id = ?');
            values.push(filters.club_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS transactions,
                COALESCE(SUM(amount),0) AS total_collected,
                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_date = CURDATE()
                            THEN amount
                            ELSE 0
                        END
                    ),0
                ) AS today_collected,
                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                            THEN amount
                            ELSE 0
                        END
                    ),0
                ) AS month_collected
            FROM payments
            ${whereClause}
        `, values);

        return rows[0] || {};
    },

    // ==========================================
    // GET PAYMENT BY ID
    // ==========================================
    async getById(id) {
        const [rows] = await db.query(
            `
            SELECT
                p.*,
                s.student_id,
                s.admission_no,
                s.first_name,
                s.last_name,
                u.user_id,
                u.full_name,
                u.email
            FROM payments p
            LEFT JOIN students s ON p.student_id = s.student_id
            LEFT JOIN users u ON s.user_id = u.user_id
            WHERE p.payment_id = ?
            `,
            [id]
        );
        return rows[0];
    },

    // ==========================================
    // GET PENDING PAYMENTS
    // ==========================================
    async getPending() {
        const [rows] = await db.query(`
            SELECT
                p.*,
                CONCAT(s.first_name,' ',s.last_name) AS student_name,
                c.club_name
            FROM payments p
            LEFT JOIN students s ON p.student_id = s.student_id
            LEFT JOIN clubs c ON p.club_id = c.club_id
            WHERE p.status='Pending'
            ORDER BY p.payment_date DESC
        `);
        return rows;
    },

    // ==========================================
    // GET PAYMENTS FOR ONE STUDENT
    // ==========================================
    async getByStudent(studentId) {
        const [rows] = await db.query(
            `
            SELECT
                p.*,
                c.club_name
            FROM payments p
            LEFT JOIN clubs c ON p.club_id = c.club_id
            WHERE p.student_id = ?
            ORDER BY p.payment_date DESC
            `,
            [studentId]
        );
        return rows;
    },

    // ==========================================
    // STUDENT PAYMENT SUMMARY
    // ==========================================
    async getStudentTotals(studentId) {
        const [rows] = await db.query(
            `
            SELECT
                COUNT(*) AS transactions,
                COALESCE(SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END), 0) AS paidCount,
                COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) AS pendingCount,
                COALESCE(
                    SUM(
                        CASE
                            WHEN status='Paid'
                            THEN amount
                            ELSE 0
                        END
                    ),0
                ) AS total_paid,
                COALESCE(
                    SUM(
                        CASE
                            WHEN status='Paid'
                            THEN amount
                            ELSE 0
                        END
                    ), 0
                ) AS totalPaid,
                COALESCE(
                    SUM(
                        CASE
                            WHEN status='Pending'
                            THEN amount
                            ELSE 0
                        END
                    ),0
                ) AS pending_amount,
                COALESCE(
                    SUM(
                        CASE
                            WHEN status='Rejected'
                            THEN amount
                            ELSE 0
                        END
                    ),0
                ) AS rejected_amount
            FROM payments
            WHERE student_id=?
            `,
            [studentId]
        );
        return rows[0];
    },

    // ==========================================
    // CREATE PAYMENT
    // ==========================================
    async create(payload) {
        const {
            student_id,
            club_id,
            amount,
            payment_date,
            payment_method,
            payment_type,
            transaction_code,
            status,
            category,
            reference,
            description,
            recorded_by
        } = payload;

        const [result] = await db.query(
            `
            INSERT INTO payments
            (
                student_id,
                club_id,
                amount,
                payment_date,
                payment_method,
                payment_type,
                transaction_code,
                status,
                category,
                reference,
                description,
                recorded_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                student_id,
                club_id || null,
                amount,
                payment_date,
                payment_method || null,
                payment_type || 'Registration',
                transaction_code || null,
                status || 'Pending',
                category || null,
                reference || null,
                description || null,
                recorded_by || null
            ]
        );
        return result.insertId;
    },

    // ==========================================
    // UPDATE PAYMENT
    // ==========================================
    async update(id, payload) {
        const {
            student_id,
            club_id,
            amount,
            payment_date,
            payment_method,
            payment_type,
            transaction_code,
            status,
            category,
            reference,
            description,
            recorded_by
        } = payload;

        const [result] = await db.query(
            `
            UPDATE payments
            SET
                student_id = ?,
                club_id = ?,
                amount = ?,
                payment_date = ?,
                payment_method = ?,
                payment_type = ?,
                transaction_code = ?,
                status = ?,
                category = ?,
                reference = ?,
                description = ?,
                recorded_by = ?
            WHERE payment_id = ?
            `,
            [
                student_id,
                club_id || null,
                amount,
                payment_date,
                payment_method || null,
                payment_type,
                transaction_code || null,
                status,
                category || null,
                reference || null,
                description || null,
                recorded_by || null,
                id
            ]
        );
        return result.affectedRows > 0;
    },

    // ==========================================
    // DELETE PAYMENT (soft delete)
    // ==========================================
    async delete(id) {
        const [result] = await db.query(
            'UPDATE payments SET deleted_at = NOW() WHERE payment_id = ?',
            [id]
        );
        return result.affectedRows > 0;
    },

    // ==========================================
    // APPROVE PAYMENT
    // ==========================================
    async approve(id) {
        const payment = await this.getById(id);
        if (!payment) {
            throw new Error('Payment not found.');
        }

        await db.query(
            'UPDATE payments SET status = \'Paid\' WHERE payment_id = ?',
            [id]
        );

        await db.query(
            'UPDATE users SET status = \'Approved\' WHERE user_id = ?',
            [payment.user_id]
        );

        await db.query(
            'UPDATE memberships SET status = \'Active\', admin_verified = 1 WHERE student_id = ?',
            [payment.student_id]
        );

        return true;
    },

    // ==========================================
    // REJECT PAYMENT
    // ==========================================
    async reject(id) {
        const payment = await this.getById(id);
        if (!payment) {
            throw new Error('Payment not found.');
        }

        await db.query(
            'UPDATE payments SET status = \'Rejected\' WHERE payment_id = ?',
            [id]
        );

        await db.query(
            'UPDATE users SET status = \'Pending Payment\' WHERE user_id = ?',
            [payment.user_id]
        );

        await db.query(
            'UPDATE users SET status=\'Pending Approval\' WHERE user_id = (SELECT user_id FROM students WHERE student_id = (SELECT student_id FROM payments WHERE payment_id = ?))',
            [id]
        );

        return true;
    },

    // ==========================================
    // GET CATEGORIES
    // ==========================================
    async getCategories() {
        const [rows] = await db.query(
            'SELECT DISTINCT category FROM payments WHERE category IS NOT NULL ORDER BY category ASC'
        );
        return rows.map(r => r.category);
    },

    // ==========================================
    // GET PAYMENT METHODS
    // ==========================================
    async getPaymentMethods() {
        const [rows] = await db.query(
            'SELECT DISTINCT payment_method FROM payments WHERE payment_method IS NOT NULL ORDER BY payment_method ASC'
        );
        return rows.map(r => r.payment_method);
    },

    // ==========================================
    // GET MONTHLY SUMMARY
    // ==========================================
    async getMonthlySummary(months = 12) {
        const [rows] = await db.query(
            `
            SELECT
                DATE_FORMAT(payment_date, '%Y-%m') AS month,
                DATE_FORMAT(payment_date, '%b %Y') AS month_label,
                COALESCE(SUM(amount), 0) AS total,
                COUNT(*) AS transactions
            FROM payments
            WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), DATE_FORMAT(payment_date, '%b %Y')
            ORDER BY month ASC
            `,
            [months]
        );
        return rows;
    },

    // ==========================================
    // GET CATEGORY SUMMARY
    // ==========================================
    async getCategorySummary() {
        const [rows] = await db.query(
            `
            SELECT
                category,
                COALESCE(SUM(amount), 0) AS total,
                COUNT(*) AS transactions
            FROM payments
            WHERE category IS NOT NULL
            GROUP BY category
            ORDER BY total DESC
            `
        );
        return rows;
    },
    // =====================================================
// CREATE CLUB MEMBERSHIP PAYMENT
// =====================================================

async createClubPayment({
    student_id,
    club_id,
    amount,
    payment_method,
    transaction_code
}) {

    const [result] = await db.query(
        `
        INSERT INTO payments
        (
            student_id,
            club_id,
            amount,
            payment_date,
            payment_method,
            payment_type,
            transaction_code,
            status
        )

        VALUES
        (
            ?,
            ?,
            ?,
            CURDATE(),
            ?,
            'Club Fee',
            ?,
            'Pending'
        )
        `,
        [
            student_id,
            club_id,
            amount,
            payment_method,
            transaction_code
        ]
    );

    return result.insertId;
}
    
};

module.exports = Payment;
