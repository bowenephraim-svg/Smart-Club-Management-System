const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Finance = require('../models/Finance');
const Club = require('../models/Club');
const Student = require('../models/Student');
const db = require('../config/db');

const isAdmin = (req) => req.session?.user?.role === 'Admin';
const isAuthorized = (req) => {
    const role = req.session?.user?.role;
    return role === 'Admin' || role === 'Patron' || role === 'Teacher';
};

// ==========================================
// FINANCE DASHBOARD
// ==========================================
exports.dashboard = async (req, res) => {
    try {
        const [stats, recentTransactions, clubs] = await Promise.all([
            Finance.getDashboardStats(),
            Finance.getRecent(8),
            Club.getAll()
        ]);

        res.render('finance/index', {
            stats,
            recentTransactions,
            clubs,
            pageTitle: 'Finance Dashboard'
        });
    } catch (err) {
    console.error('========== FINANCE DASHBOARD ERROR ==========');
    console.error(err);
    console.error('============================================');

    req.session.error_msg = 'Unable to load finance dashboard.';
    res.redirect('/dashboard');
}
};

// ==========================================
// PAYMENTS / INCOME
// ==========================================
exports.payments = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        const clubId = req.query.club_id ? parseInt(req.query.club_id, 10) : null;
        const status = req.query.status || '';
        const dateFrom = req.query.date_from || '';
        const dateTo = req.query.date_to || '';

        const [payments, totals, clubs] = await Promise.all([
            Payment.getAll({ club_id: clubId, status, date_from: dateFrom, date_to: dateTo, search }),
            Payment.getTotals({ club_id: clubId }),
            Club.getAll()
        ]);

        const filters = { search, club_id: clubId, status, date_from: dateFrom, date_to: dateTo };

        res.render('finance/payments', {
            payments,
            totals,
            clubs,
            filters,
            pageTitle: 'Payments & Income'
        });
    } catch (err) {
        console.error('Payments error:', err.message);
        req.session.error_msg = 'Unable to load payments.';
        res.redirect('/finance');
    }
};

exports.renderAddPaymentForm = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/finance');
        }
        const [students, clubs] = await Promise.all([
            Student.getAll(),
            Club.getAll()
        ]);
        res.render('finance/add-payment', { students, clubs, formData: {}, pageTitle: 'Add Payment' });
    } catch (err) {
        console.error('Add payment form error:', err.message);
        req.session.error_msg = 'Unable to load payment form.';
        res.redirect('/finance/payments');
    }
};

exports.addPayment = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/finance/payments');
        }

        const {
            student_id,
            club_id,
            amount,
            payment_date,
            payment_method,
            category,
            reference,
            description,
            transaction_code
        } = req.body;

        if (!amount || parseFloat(amount) <= 0) {
            req.session.error_msg = 'Please enter a valid amount greater than zero.';
            return res.redirect('/finance/payments/add');
        }

        const paymentId = await Payment.create({
            student_id,
            club_id,
            amount: parseFloat(amount),
            payment_date,
            payment_method,
            payment_type: 'Registration',
            transaction_code,
            status: 'Paid',
            category: category || 'Membership Fee',
            reference: reference || `PAY-${Date.now()}`,
            description,
            recorded_by: req.session.user.id
        });

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Recorded payment ID ${paymentId} of KES ${amount} for student ${student_id}`]
        );

        req.session.success_msg = 'Payment recorded successfully.';
        res.redirect('/finance/payments');
    } catch (err) {
        console.error('Add payment error:', err.message);
        req.session.error_msg = 'Unable to record payment. Please try again.';
        res.redirect('/finance/payments/add');
    }
};

exports.renderEditPaymentForm = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/finance/payments');
        }

        const [payment, students, clubs] = await Promise.all([
            Payment.getById(req.params.id),
            Student.getAll(),
            Club.getAll()
        ]);

        if (!payment) {
            req.session.error_msg = 'Payment record not found.';
            return res.redirect('/finance/payments');
        }

        res.render('finance/edit-payment', { payment, students, clubs, pageTitle: 'Edit Payment' });
    } catch (err) {
        console.error('Edit payment form error:', err.message);
        req.session.error_msg = 'Unable to load payment edit form.';
        res.redirect('/finance/payments');
    }
};

exports.editPayment = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/finance/payments');
        }

        const {
            student_id,
            club_id,
            amount,
            payment_date,
            payment_method,
            category,
            reference,
            description,
            transaction_code,
            status
        } = req.body;

        if (!amount || parseFloat(amount) <= 0) {
            req.session.error_msg = 'Please enter a valid amount greater than zero.';
            return res.redirect(`/finance/payments/edit/${req.params.id}`);
        }

        const updated = await Payment.update(req.params.id, {
            student_id,
            club_id,
            amount: parseFloat(amount),
            payment_date,
            payment_method,
            payment_type: 'Registration',
            transaction_code,
            status: status || 'Pending',
            category,
            reference,
            description,
            recorded_by: req.session.user.id
        });

        if (!updated) {
            req.session.error_msg = 'Payment record could not be updated.';
            return res.redirect('/finance/payments');
        }

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Updated payment ID ${req.params.id}`]
        );

        req.session.success_msg = 'Payment updated successfully.';
        res.redirect('/finance/payments');
    } catch (err) {
        console.error('Edit payment error:', err.message);
        req.session.error_msg = 'Unable to update payment. Please try again.';
        res.redirect('/finance/payments');
    }
};

exports.deletePayment = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            req.session.error_msg = 'Access denied. Only administrators can delete payments.';
            return res.redirect('/finance/payments');
        }

        const deleted = await Payment.delete(req.params.id);
        if (!deleted) {
            req.session.error_msg = 'Payment record could not be deleted.';
            return res.redirect('/finance/payments');
        }

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Deleted payment ID ${req.params.id}`]
        );

        req.session.success_msg = 'Payment deleted successfully.';
        res.redirect('/finance/payments');
    } catch (err) {
        console.error('Delete payment error:', err.message);
        req.session.error_msg = 'Unable to delete payment. Please try again.';
        res.redirect('/finance/payments');
    }
};

exports.approvePayment = async (req, res) => {
    try {
        await Payment.approve(req.params.id);
        req.session.success_msg = 'Payment approved successfully.';
        res.redirect('/finance/payments');
    } catch (err) {
        console.error('Approve payment error:', err.message);
        req.session.error_msg = 'Unable to approve payment.';
        res.redirect('/finance/payments');
    }
};

exports.rejectPayment = async (req, res) => {
    try {
        await Payment.reject(req.params.id);
        req.session.success_msg = 'Payment rejected successfully.';
        res.redirect('/finance/payments');
    } catch (err) {
        console.error('Reject payment error:', err.message);
        req.session.error_msg = 'Unable to reject payment.';
        res.redirect('/finance/payments');
    }
};

// ==========================================
// EXPENSES
// ==========================================
exports.expenses = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        const clubId = req.query.club_id ? parseInt(req.query.club_id, 10) : null;
        const category = req.query.category || '';
        const dateFrom = req.query.date_from || '';
        const dateTo = req.query.date_to || '';

        const [expenses, totals, clubs] = await Promise.all([
            Expense.getAll({ club_id: clubId, category, date_from: dateFrom, date_to: dateTo, search }),
            Expense.getTotals({ club_id: clubId }),
            Club.getAll()
        ]);

        const filters = { search, club_id: clubId, category, date_from: dateFrom, date_to: dateTo };

        res.render('finance/expenses', {
            expenses,
            totals,
            clubs,
            filters,
            pageTitle: 'Expenses'
        });
    } catch (err) {
        console.error('Expenses error:', err.message);
        req.session.error_msg = 'Unable to load expenses.';
        res.redirect('/finance');
    }
};

exports.renderAddExpenseForm = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/finance');
        }
        const clubs = await Club.getAll();
        res.render('finance/add-expense', { clubs, formData: {}, pageTitle: 'Add Expense' });
    } catch (err) {
        console.error('Add expense form error:', err.message);
        req.session.error_msg = 'Unable to load expense form.';
        res.redirect('/finance/expenses');
    }
};

exports.addExpense = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/finance/expenses');
        }

        const {
            club_id,
            expense_name,
            amount,
            expense_date,
            description,
            category,
            payment_method,
            reference
        } = req.body;

        if (!amount || parseFloat(amount) <= 0) {
            req.session.error_msg = 'Please enter a valid amount greater than zero.';
            return res.redirect('/finance/expenses/add');
        }

        const expenseId = await Expense.create({
            club_id,
            expense_name,
            amount: parseFloat(amount),
            expense_date,
            description,
            category: category || 'Other Expenses',
            payment_method,
            reference: reference || `EXP-${Date.now()}`,
            recorded_by: req.session.user.id
        });

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Recorded expense ID ${expenseId} of KES ${amount} for ${expense_name}`]
        );

        req.session.success_msg = 'Expense recorded successfully.';
        res.redirect('/finance/expenses');
    } catch (err) {
        console.error('Add expense error:', err.message);
        req.session.error_msg = 'Unable to record expense. Please try again.';
        res.redirect('/finance/expenses/add');
    }
};

exports.renderEditExpenseForm = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/finance/expenses');
        }

        const [expense, clubs] = await Promise.all([
            Expense.getById(req.params.id),
            Club.getAll()
        ]);

        if (!expense) {
            req.session.error_msg = 'Expense record not found.';
            return res.redirect('/finance/expenses');
        }

        res.render('finance/edit-expense', { expense, clubs, pageTitle: 'Edit Expense' });
    } catch (err) {
        console.error('Edit expense form error:', err.message);
        req.session.error_msg = 'Unable to load expense edit form.';
        res.redirect('/finance/expenses');
    }
};

exports.editExpense = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/finance/expenses');
        }

        const {
            club_id,
            expense_name,
            amount,
            expense_date,
            description,
            category,
            payment_method,
            reference
        } = req.body;

        if (!amount || parseFloat(amount) <= 0) {
            req.session.error_msg = 'Please enter a valid amount greater than zero.';
            return res.redirect(`/finance/expenses/edit/${req.params.id}`);
        }

        const updated = await Expense.update(req.params.id, {
            club_id,
            expense_name,
            amount: parseFloat(amount),
            expense_date,
            description,
            category,
            payment_method,
            reference,
            recorded_by: req.session.user.id
        });

        if (!updated) {
            req.session.error_msg = 'Expense record could not be updated.';
            return res.redirect('/finance/expenses');
        }

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Updated expense ID ${req.params.id}`]
        );

        req.session.success_msg = 'Expense updated successfully.';
        res.redirect('/finance/expenses');
    } catch (err) {
        console.error('Edit expense error:', err.message);
        req.session.error_msg = 'Unable to update expense. Please try again.';
        res.redirect('/finance/expenses');
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            req.session.error_msg = 'Access denied. Only administrators can delete expenses.';
            return res.redirect('/finance/expenses');
        }

        const deleted = await Expense.delete(req.params.id);
        if (!deleted) {
            req.session.error_msg = 'Expense record could not be deleted.';
            return res.redirect('/finance/expenses');
        }

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Deleted expense ID ${req.params.id}`]
        );

        req.session.success_msg = 'Expense deleted successfully.';
        res.redirect('/finance/expenses');
    } catch (err) {
        console.error('Delete expense error:', err.message);
        req.session.error_msg = 'Unable to delete expense. Please try again.';
        res.redirect('/finance/expenses');
    }
};

// ==========================================
// TRANSACTIONS (unified view)
// ==========================================
exports.transactions = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        const clubId = req.query.club_id ? parseInt(req.query.club_id, 10) : null;
        const type = req.query.type || '';
        const category = req.query.category || '';
        const dateFrom = req.query.date_from || '';
        const dateTo = req.query.date_to || '';

        const [transactions, clubs] = await Promise.all([
            Finance.getTransactions({ club_id: clubId, type, category, date_from: dateFrom, date_to: dateTo, search }),
            Club.getAll()
        ]);

        const filters = { search, club_id: clubId, type, category, date_from: dateFrom, date_to: dateTo };

        res.render('finance/transactions', {
            transactions,
            clubs,
            filters,
            pageTitle: 'Transaction History'
        });
    } catch (err) {
        console.error('Transactions error:', err.message);
        req.session.error_msg = 'Unable to load transactions.';
        res.redirect('/finance');
    }
};

// ==========================================
// FINANCIAL SUMMARY
// ==========================================
exports.summary = async (req, res) => {
    try {
        const clubId = req.query.club_id ? parseInt(req.query.club_id, 10) : null;

        const [stats, clubSummary, monthlySummary, categorySummary, dailySummary, yearlySummary] = await Promise.all([
            Finance.getDashboardStats({ club_id: clubId }),
            Finance.getClubSummary(),
            Finance.getMonthlySummary(12),
            Finance.getCategorySummary(),
            Finance.getDailySummary(30),
            Finance.getYearlySummary(5)
        ]);

        const clubs = await Club.getAll();
        const filters = { club_id: clubId };

        res.render('finance/summary', {
            stats,
            clubSummary,
            monthlySummary,
            categorySummary,
            dailySummary,
            yearlySummary,
            clubs,
            filters,
            pageTitle: 'Financial Summary'
        });
    } catch (err) {
        console.error('Finance summary error:', err.message);
        req.session.error_msg = 'Unable to load finance summary.';
        res.redirect('/finance');
    }
};

// ==========================================
// CLUB FINANCES
// ==========================================
exports.clubFinances = async (req, res) => {
    try {
        const clubId = parseInt(req.params.id, 10);
        if (!clubId) {
            req.session.error_msg = 'Invalid club selection.';
            return res.redirect('/finance');
        }

        const club = await Club.getById(clubId);
        if (!club) {
            req.session.error_msg = 'The selected club could not be found.';
            return res.redirect('/finance');
        }

        const [stats, transactions] = await Promise.all([
            Finance.getDashboardStats({ club_id: clubId }),
            Finance.getTransactions({ club_id: clubId })
        ]);

        res.render('finance/club', {
            club,
            stats,
            transactions,
            pageTitle: `${club.club_name} Finances`
        });
    } catch (err) {
        console.error('Club finances error:', err.message);
        req.session.error_msg = 'Unable to load club finances.';
        res.redirect('/finance');
    }
};

// ==========================================
// REPORTS
// ==========================================
exports.reports = async (req, res) => {
    try {
        const months = parseInt(req.query.months, 10) || 12;
        const [monthlySummary, categorySummary, clubSummary, lowBalanceClubs] = await Promise.all([
            Finance.getMonthlySummary(months),
            Finance.getCategorySummary(),
            Finance.getClubSummary(),
            Finance.getLowBalanceClubs()
        ]);

        const filters = { months };

        res.render('finance/reports', {
            monthlySummary,
            categorySummary,
            clubSummary,
            lowBalanceClubs,
            filters,
            pageTitle: 'Finance Reports'
        });
    } catch (err) {
        console.error('Finance reports error:', err.message);
        req.session.error_msg = 'Unable to load finance reports.';
        res.redirect('/finance');
    }
};

// ==========================================
// EXPORT CSV
// ==========================================
exports.exportCsv = async (req, res) => {
    try {
        const filters = {
            club_id: req.query.club_id ? parseInt(req.query.club_id, 10) : null,
            type: req.query.type || '',
            category: req.query.category || '',
            date_from: req.query.date_from || '',
            date_to: req.query.date_to || '',
            search: req.query.search || ''
        };

        const transactions = await Finance.getTransactions(filters);

        let csv = 'Date,Type,Category,Club,Amount,Reference,Description,Recorded By\n';
        transactions.forEach(t => {
            const desc = (t.description || '').replace(/"/g, '""');
            const ref = (t.reference || '').replace(/"/g, '""');
            const club = (t.club_name || '').replace(/"/g, '""');
            const recorded = (t.recorded_by_name || '').replace(/"/g, '""');
            csv += `"${t.date}","${t.type}","${t.category || ''}","${club}","${t.amount}","${ref}","${desc}","${recorded}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="finance-report.csv"');
        res.send(csv);
    } catch (err) {
        console.error('CSV export error:', err.message);
        req.session.error_msg = 'Unable to export finance data.';
        res.redirect('/finance');
    }
};
