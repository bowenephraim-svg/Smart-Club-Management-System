// models/Finance.js
const db = require('../config/db');

const Finance = {

    // ==========================================
    // DASHBOARD STATS
    // ==========================================
    async getDashboardStats(filters = {}) {

        const paymentConditions = [
            "p.status = 'Paid'"
        ];

        const expenseConditions = [];

        const paymentValues = [];
        const expenseValues = [];

        if (filters.club_id) {

            paymentConditions.push(
                'p.club_id = ?'
            );

            paymentValues.push(
                filters.club_id
            );

            expenseConditions.push(
                'e.club_id = ?'
            );

            expenseValues.push(
                filters.club_id
            );
        }

        if (filters.date_from) {

            paymentConditions.push(
                'p.payment_date >= ?'
            );

            paymentValues.push(
                filters.date_from
            );

            expenseConditions.push(
                'e.expense_date >= ?'
            );

            expenseValues.push(
                filters.date_from
            );
        }

        if (filters.date_to) {

            paymentConditions.push(
                'p.payment_date <= ?'
            );

            paymentValues.push(
                filters.date_to
            );

            expenseConditions.push(
                'e.expense_date <= ?'
            );

            expenseValues.push(
                filters.date_to
            );
        }

        const paymentWhere =
            paymentConditions.join(' AND ');

        const expenseWhere =
            expenseConditions.length
                ? expenseConditions.join(' AND ')
                : '1=1';

        const query = `
            SELECT

                (
                    SELECT COUNT(*)
                    FROM payments p
                    WHERE ${paymentWhere}
                )
                +
                (
                    SELECT COUNT(*)
                    FROM expenses e
                    WHERE ${expenseWhere}
                )
                AS total_transactions,

                (
                    SELECT COALESCE(SUM(p.amount), 0)
                    FROM payments p
                    WHERE ${paymentWhere}
                )
                AS total_income,

                (
                    SELECT COALESCE(SUM(e.amount), 0)
                    FROM expenses e
                    WHERE ${expenseWhere}
                )
                AS total_expenses,

                (
                    SELECT COALESCE(SUM(p.amount), 0)
                    FROM payments p
                    WHERE ${paymentWhere}
                    AND p.payment_date = CURDATE()
                )
                AS today_income,

                (
                    SELECT COALESCE(SUM(e.amount), 0)
                    FROM expenses e
                    WHERE ${expenseWhere}
                    AND e.expense_date = CURDATE()
                )
                AS today_expenses,

                (
                    SELECT COALESCE(SUM(p.amount), 0)
                    FROM payments p
                    WHERE ${paymentWhere}
                    AND p.payment_date >=
                        DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                )
                AS month_income,

                (
                    SELECT COALESCE(SUM(e.amount), 0)
                    FROM expenses e
                    WHERE ${expenseWhere}
                    AND e.expense_date >=
                        DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                )
                AS month_expenses
        `;

        const values = [
            ...paymentValues,
            ...expenseValues,
            ...paymentValues,
            ...paymentValues,
            ...expenseValues,
            ...paymentValues,
            ...expenseValues
        ];

        const [rows] =
            await db.query(query, values);

        const stats = rows[0] || {};

        const totalIncome =
            Number(stats.total_income || 0);

        const totalExpenses =
            Number(stats.total_expenses || 0);

        const todayIncome =
            Number(stats.today_income || 0);

        const todayExpenses =
            Number(stats.today_expenses || 0);

        const monthIncome =
            Number(stats.month_income || 0);

        const monthExpenses =
            Number(stats.month_expenses || 0);

        return {

            totalTransactions:
                Number(
                    stats.total_transactions || 0
                ),

            totalIncome,

            totalExpenses,

            balance:
                totalIncome -
                totalExpenses,

            todayIncome,

            todayExpenses,

            todayBalance:
                todayIncome -
                todayExpenses,

            monthIncome,

            monthExpenses,

            monthBalance:
                monthIncome -
                monthExpenses
        };
    },


    // ==========================================
    // GET ALL TRANSACTIONS
    // ==========================================
    async getTransactions(filters = {}) {

        const conditions = [];

        const values = [];

        if (filters.club_id) {

            conditions.push(
                'club_id = ?'
            );

            values.push(
                filters.club_id
            );
        }

        if (filters.date_from) {

            conditions.push(
                'transaction_date >= ?'
            );

            values.push(
                filters.date_from
            );
        }

        if (filters.date_to) {

            conditions.push(
                'transaction_date <= ?'
            );

            values.push(
                filters.date_to
            );
        }

        const whereClause =
            conditions.length
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const query = `

            SELECT *
            FROM (

                SELECT

                    p.payment_id AS transaction_id,

                    p.student_id,

                    p.club_id,

                    p.amount,

                    p.payment_date AS transaction_date,

                    p.payment_method AS method,

                    p.payment_type AS category,

                    p.transaction_code AS reference,

                    'Income' AS type,

                    CONCAT(
                        'Payment - ',
                        COALESCE(p.payment_type, 'Payment')
                    ) AS description

                FROM payments p

                WHERE p.status = 'Paid'


                UNION ALL


                SELECT

                    e.expense_id AS transaction_id,

                    NULL AS student_id,

                    e.club_id,

                    e.amount,

                    e.expense_date AS transaction_date,

                    NULL AS method,

                    NULL AS category,

                    NULL AS reference,

                    'Expense' AS type,

                    e.expense_name AS description

                FROM expenses e

            ) transactions

            ${whereClause}

            ORDER BY
                transaction_date DESC,
                transaction_id DESC
        `;

        const [rows] =
            await db.query(
                query,
                values
            );

        return rows;
    },


    // ==========================================
    // GET TRANSACTION BY ID
    // ==========================================
    async getById(id, type) {

        if (type === 'Expense') {

            const [rows] =
                await db.query(
                    `
                    SELECT
                        e.*,
                        c.club_name
                    FROM expenses e
                    LEFT JOIN clubs c
                        ON e.club_id = c.club_id
                    WHERE e.expense_id = ?
                    `,
                    [id]
                );

            return rows[0] || null;
        }

        const [rows] =
            await db.query(
                `
                SELECT
                    p.*,
                    c.club_name
                FROM payments p
                LEFT JOIN clubs c
                    ON p.club_id = c.club_id
                WHERE p.payment_id = ?
                `,
                [id]
            );

        return rows[0] || null;
    },


    // ==========================================
    // CREATE INCOME
    // ==========================================
    async create(payload) {

        const {
            student_id,
            club_id,
            amount,
            date,
            payment_method,
            payment_type,
            transaction_code
        } = payload;

        const [result] =
            await db.query(
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
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Paid')
                `,
                [
                    student_id || null,
                    club_id || null,
                    amount,
                    date ||
                        new Date()
                            .toISOString()
                            .split('T')[0],
                    payment_method || null,
                    payment_type ||
                        'Registration',
                    transaction_code || null
                ]
            );

        return result.insertId;
    },


    // ==========================================
    // CREATE EXPENSE
    // ==========================================
    async createExpense(payload) {

        const {
            club_id,
            expense_name,
            amount,
            date,
            description
        } = payload;

        const [result] =
            await db.query(
                `
                INSERT INTO expenses
                (
                    club_id,
                    expense_name,
                    amount,
                    expense_date,
                    description
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    club_id || null,
                    expense_name,
                    amount,
                    date ||
                        new Date()
                            .toISOString()
                            .split('T')[0],
                    description || null
                ]
            );

        return result.insertId;
    },


    // ==========================================
    // CLUB SUMMARY
    // ==========================================
    async getClubSummary() {

        const [rows] =
            await db.query(
                `
                SELECT

                    c.club_id,

                    c.club_name,

                    COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.club_id = c.club_id
                            AND p.status = 'Paid'
                        ),
                        0
                    ) AS total_income,

                    COALESCE(
                        (
                            SELECT SUM(e.amount)
                            FROM expenses e
                            WHERE e.club_id = c.club_id
                        ),
                        0
                    ) AS total_expenses

                FROM clubs c

                ORDER BY
                    total_income DESC
                `
            );

        return rows.map(row => {

            const income =
                Number(row.total_income || 0);

            const expenses =
                Number(row.total_expenses || 0);

            return {
                ...row,

                total_income: income,

                total_expenses: expenses,

                balance:
                    income - expenses
            };
        });
    },


    // ==========================================
    // MONTHLY SUMMARY
    // ==========================================
    async getMonthlySummary(months = 12) {

        const [rows] =
            await db.query(
                `
                SELECT

                    month,

                    month_label,

                    SUM(income) AS income,

                    SUM(expenses) AS expenses,

                    SUM(transactions)
                        AS transactions

                FROM (

                    SELECT

                        DATE_FORMAT(
                            payment_date,
                            '%Y-%m'
                        ) AS month,

                        DATE_FORMAT(
                            payment_date,
                            '%b %Y'
                        ) AS month_label,

                        SUM(amount) AS income,

                        0 AS expenses,

                        COUNT(*) AS transactions

                    FROM payments

                    WHERE status = 'Paid'

                    AND payment_date >=
                        DATE_SUB(
                            CURDATE(),
                            INTERVAL ? MONTH
                        )

                    GROUP BY
                        DATE_FORMAT(
                            payment_date,
                            '%Y-%m'
                        )


                    UNION ALL


                    SELECT

                        DATE_FORMAT(
                            expense_date,
                            '%Y-%m'
                        ) AS month,

                        DATE_FORMAT(
                            expense_date,
                            '%b %Y'
                        ) AS month_label,

                        0 AS income,

                        SUM(amount) AS expenses,

                        COUNT(*) AS transactions

                    FROM expenses

                    WHERE expense_date >=
                        DATE_SUB(
                            CURDATE(),
                            INTERVAL ? MONTH
                        )

                    GROUP BY
                        DATE_FORMAT(
                            expense_date,
                            '%Y-%m'
                        )

                ) financial_data

                GROUP BY
                    month,
                    month_label

                ORDER BY month ASC
                `,
                [months, months]
            );

        return rows;
    },


    // ==========================================
    // CATEGORY SUMMARY
    // ==========================================
    async getCategorySummary(type = null) {

        if (type === 'Expense') {

            const [rows] =
                await db.query(
                    `
                    SELECT

                        expense_name AS category,

                        'Expense' AS type,

                        SUM(amount) AS total,

                        COUNT(*) AS transactions

                    FROM expenses

                    GROUP BY expense_name

                    ORDER BY total DESC
                    `
                );

            return rows;
        }

        const [rows] =
            await db.query(
                `
                SELECT

                    payment_type AS category,

                    'Income' AS type,

                    SUM(amount) AS total,

                    COUNT(*) AS transactions

                FROM payments

                WHERE status = 'Paid'

                GROUP BY payment_type

                ORDER BY total DESC
                `
            );

        return rows;
    },


    // ==========================================
    // RECENT TRANSACTIONS
    // ==========================================
    async getRecent(limit = 10) {

        const [rows] =
            await db.query(
                `
                SELECT *

                FROM (

                    SELECT

                        p.payment_id
                            AS transaction_id,

                        p.club_id,

                        p.amount,

                        p.payment_date
                            AS transaction_date,

                        p.payment_type
                            AS category,

                        p.transaction_code
                            AS reference,

                        'Income'
                            AS type,

                        CONCAT(
                            'Payment - ',
                            COALESCE(
                                p.payment_type,
                                'Payment'
                            )
                        ) AS description

                    FROM payments p

                    WHERE p.status = 'Paid'


                    UNION ALL


                    SELECT

                        e.expense_id
                            AS transaction_id,

                        e.club_id,

                        e.amount,

                        e.expense_date
                            AS transaction_date,

                        e.expense_name
                            AS category,

                        NULL
                            AS reference,

                        'Expense'
                            AS type,

                        e.expense_name
                            AS description

                    FROM expenses e

                ) transactions

                ORDER BY
                    transaction_date DESC,
                    transaction_id DESC

                LIMIT ?
                `,
                [limit]
            );

        return rows;
    },


    // ==========================================
    // DAILY SUMMARY
    // ==========================================
    async getDailySummary(days = 30) {

        const [rows] =
            await db.query(
                `
                SELECT

                    transaction_date AS date,

                    SUM(income) AS income,

                    SUM(expenses) AS expenses,

                    SUM(transactions)
                        AS transactions

                FROM (

                    SELECT

                        payment_date
                            AS transaction_date,

                        SUM(amount)
                            AS income,

                        0 AS expenses,

                        COUNT(*) AS transactions

                    FROM payments

                    WHERE status = 'Paid'

                    AND payment_date >=
                        DATE_SUB(
                            CURDATE(),
                            INTERVAL ? DAY
                        )

                    GROUP BY payment_date


                    UNION ALL


                    SELECT

                        expense_date
                            AS transaction_date,

                        0 AS income,

                        SUM(amount)
                            AS expenses,

                        COUNT(*) AS transactions

                    FROM expenses

                    WHERE expense_date >=
                        DATE_SUB(
                            CURDATE(),
                            INTERVAL ? DAY
                        )

                    GROUP BY expense_date

                ) daily_data

                GROUP BY transaction_date

                ORDER BY transaction_date ASC
                `,
                [days, days]
            );

        return rows;
    },


    // ==========================================
    // YEARLY SUMMARY
    // ==========================================
    async getYearlySummary(years = 5) {

        const [rows] =
            await db.query(
                `
                SELECT

                    year,

                    SUM(income) AS income,

                    SUM(expenses) AS expenses,

                    SUM(transactions)
                        AS transactions

                FROM (

                    SELECT

                        YEAR(payment_date)
                            AS year,

                        SUM(amount)
                            AS income,

                        0 AS expenses,

                        COUNT(*) AS transactions

                    FROM payments

                    WHERE status = 'Paid'

                    AND payment_date >=
                        DATE_SUB(
                            CURDATE(),
                            INTERVAL ? YEAR
                        )

                    GROUP BY
                        YEAR(payment_date)


                    UNION ALL


                    SELECT

                        YEAR(expense_date)
                            AS year,

                        0 AS income,

                        SUM(amount)
                            AS expenses,

                        COUNT(*) AS transactions

                    FROM expenses

                    WHERE expense_date >=
                        DATE_SUB(
                            CURDATE(),
                            INTERVAL ? YEAR
                        )

                    GROUP BY
                        YEAR(expense_date)

                ) yearly_data

                GROUP BY year

                ORDER BY year ASC
                `,
                [years, years]
            );

        return rows;
    },


    // ==========================================
    // LOW BALANCE CLUBS
    // ==========================================
    async getLowBalanceClubs(
        threshold = 0
    ) {

        const [rows] =
            await db.query(
                `
                SELECT

                    c.club_id,

                    c.club_name,

                    COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.club_id = c.club_id
                            AND p.status = 'Paid'
                        ),
                        0
                    ) AS total_income,

                    COALESCE(
                        (
                            SELECT SUM(e.amount)
                            FROM expenses e
                            WHERE e.club_id = c.club_id
                        ),
                        0
                    ) AS total_expenses

                FROM clubs c
                `
            );

        return rows
            .map(row => {

                const income =
                    Number(
                        row.total_income || 0
                    );

                const expenses =
                    Number(
                        row.total_expenses || 0
                    );

                return {
                    ...row,

                    balance:
                        income - expenses
                };
            })
            .filter(
                row =>
                    row.balance < threshold
            )
            .sort(
                (a, b) =>
                    a.balance - b.balance
            );
    }
};

module.exports = Finance;