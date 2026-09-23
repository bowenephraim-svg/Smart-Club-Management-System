const db = require('../config/db');

const Expense = {

    // ==========================================
    // GET ALL EXPENSES (with filters)
    // ==========================================
    async getAll(filters = {}) {
        const conditions = [];
        const values = [];

        if (filters.club_id) {
            conditions.push('e.club_id = ?');
            values.push(filters.club_id);
        }
        if (filters.category) {
            conditions.push('e.category = ?');
            values.push(filters.category);
        }
        if (filters.payment_method) {
            conditions.push('e.payment_method = ?');
            values.push(filters.payment_method);
        }
        if (filters.date_from) {
            conditions.push('e.expense_date >= ?');
            values.push(filters.date_from);
        }
        if (filters.date_to) {
            conditions.push('e.expense_date <= ?');
            values.push(filters.date_to);
        }
        if (filters.search) {
            conditions.push('(e.expense_name LIKE ? OR e.description LIKE ? OR c.club_name LIKE ? OR e.reference LIKE ?)');
            const term = `%${filters.search}%`;
            values.push(term, term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT
                e.*,
                c.club_name,
                u.full_name AS recorded_by_name
            FROM expenses e
            LEFT JOIN clubs c ON e.club_id = c.club_id
            LEFT JOIN users u ON e.recorded_by = u.user_id
            ${whereClause}
            ORDER BY e.expense_date DESC, e.expense_id DESC
        `;

        const [rows] = await db.query(sql, values);
        return rows;
    },

    // ==========================================
    // TOTAL EXPENSES
    // ==========================================
    async getTotal(filters = {}) {
        const conditions = [];
        const values = [];

        if (filters.club_id) {
            conditions.push('club_id = ?');
            values.push(filters.club_id);
        }
        if (filters.date_from) {
            conditions.push('expense_date >= ?');
            values.push(filters.date_from);
        }
        if (filters.date_to) {
            conditions.push('expense_date <= ?');
            values.push(filters.date_to);
        }
        if (filters.category) {
            conditions.push('category = ?');
            values.push(filters.category);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const [rows] = await db.query(
            `SELECT COALESCE(SUM(amount),0) AS total FROM expenses ${whereClause}`,
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
                COALESCE(SUM(amount), 0) AS total_expenses,
                COALESCE(
                    SUM(
                        CASE
                            WHEN expense_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                            THEN amount
                            ELSE 0
                        END
                    ), 0
                ) AS month_expenses
            FROM expenses
            ${whereClause}
        `, values);

        return rows[0] || {};
    },

    // ==========================================
    // GET EXPENSE BY ID
    // ==========================================
    async getById(id) {
        const [rows] = await db.query(
            `
            SELECT
                e.*,
                c.club_name
            FROM expenses e
            LEFT JOIN clubs c ON e.club_id = c.club_id
            WHERE e.expense_id = ?
            `,
            [id]
        );
        return rows[0];
    },

    // ==========================================
    // CREATE EXPENSE
    // ==========================================
    async create(payload) {
        const {
            club_id,
            expense_name,
            amount,
            expense_date,
            description,
            category,
            payment_method,
            reference,
            recorded_by
        } = payload;

        const [result] = await db.query(
            `
            INSERT INTO expenses
            (
                club_id,
                expense_name,
                amount,
                expense_date,
                description,
                category,
                payment_method,
                reference,
                recorded_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                club_id,
                expense_name,
                amount,
                expense_date,
                description || null,
                category || null,
                payment_method || null,
                reference || null,
                recorded_by || null
            ]
        );
        return result.insertId;
    },

    // ==========================================
    // UPDATE EXPENSE
    // ==========================================
    async update(id, payload) {
        const {
            club_id,
            expense_name,
            amount,
            expense_date,
            description,
            category,
            payment_method,
            reference,
            recorded_by
        } = payload;

        const [result] = await db.query(
            `
            UPDATE expenses
            SET
                club_id = ?,
                expense_name = ?,
                amount = ?,
                expense_date = ?,
                description = ?,
                category = ?,
                payment_method = ?,
                reference = ?,
                recorded_by = ?
            WHERE expense_id = ?
            `,
            [
                club_id,
                expense_name,
                amount,
                expense_date,
                description || null,
                category || null,
                payment_method || null,
                reference || null,
                recorded_by || null,
                id
            ]
        );
        return result.affectedRows > 0;
    },

    // ==========================================
    // DELETE EXPENSE (soft delete)
    // ==========================================
    async delete(id) {
        const [result] = await db.query(
            'UPDATE expenses SET deleted_at = NOW() WHERE expense_id = ?',
            [id]
        );
        return result.affectedRows > 0;
    },

    // ==========================================
    // GET CATEGORIES
    // ==========================================
    async getCategories() {
        const [rows] = await db.query(
            'SELECT DISTINCT category FROM expenses WHERE category IS NOT NULL ORDER BY category ASC'
        );
        return rows.map(r => r.category);
    },

    // ==========================================
    // GET PAYMENT METHODS
    // ==========================================
    async getPaymentMethods() {
        const [rows] = await db.query(
            'SELECT DISTINCT payment_method FROM expenses WHERE payment_method IS NOT NULL ORDER BY payment_method ASC'
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
                DATE_FORMAT(expense_date, '%Y-%m') AS month,
                DATE_FORMAT(expense_date, '%b %Y') AS month_label,
                COALESCE(SUM(amount), 0) AS total,
                COUNT(*) AS transactions
            FROM expenses
            WHERE expense_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(expense_date, '%Y-%m'), DATE_FORMAT(expense_date, '%b %Y')
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
            FROM expenses
            WHERE category IS NOT NULL
            GROUP BY category
            ORDER BY total DESC
            `
        );
        return rows;
    }
};

module.exports = Expense;
