const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const verifyAdmin = require('../middleware/adminMiddleware');
const protectRoute = require('../middleware/authMiddleware');

// ==========================================
// FINANCE DASHBOARD
// ==========================================
router.get('/', financeController.dashboard);

// ==========================================
// PAYMENTS / INCOME
// ==========================================
router.get('/payments', financeController.payments);
router.get('/payments/add', financeController.renderAddPaymentForm);
router.post('/payments/add', financeController.addPayment);
router.get('/payments/edit/:id', financeController.renderEditPaymentForm);
router.post('/payments/edit/:id', financeController.editPayment);
router.post('/payments/delete/:id', verifyAdmin, financeController.deletePayment);
router.get('/payments/approve/:id', financeController.approvePayment);
router.get('/payments/reject/:id', financeController.rejectPayment);

// ==========================================
// EXPENSES
// ==========================================
router.get('/expenses', financeController.expenses);
router.get('/expenses/add', financeController.renderAddExpenseForm);
router.post('/expenses/add', financeController.addExpense);
router.get('/expenses/edit/:id', financeController.renderEditExpenseForm);
router.post('/expenses/edit/:id', financeController.editExpense);
router.post('/expenses/delete/:id', verifyAdmin, financeController.deleteExpense);

// ==========================================
// TRANSACTIONS (unified)
// ==========================================
router.get('/transactions', financeController.transactions);

// ==========================================
// SUMMARY
// ==========================================
router.get('/summary', financeController.summary);

// ==========================================
// CLUB FINANCES
// ==========================================
router.get('/club/:id', financeController.clubFinances);

// ==========================================
// REPORTS
// ==========================================
router.get('/reports', financeController.reports);

// ==========================================
// EXPORT
// ==========================================
router.get('/export/csv', financeController.exportCsv);

module.exports = router;
