const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const verifyAdmin = require('../middleware/adminMiddleware');
const reportExportController = require('../controllers/reportExportController');

// ==========================================
// REPORTS DASHBOARD
// ==========================================
router.get('/', verifyAdmin, reportController.index);

// ==========================================
// STUDENT REPORT
// ==========================================
router.get('/students', verifyAdmin, reportController.studentsReport);

// ==========================================
// CLUB REPORT
// ==========================================
router.get('/clubs', verifyAdmin, reportController.clubsReport);

// ==========================================
// ATTENDANCE REPORT
// ==========================================
router.get('/attendance', verifyAdmin, reportController.attendanceReport);

// ==========================================
// FINANCE REPORT
// ==========================================
router.get('/finance', verifyAdmin, reportController.financeReport);

// ==========================================
// ANALYTICS REPORT
// ==========================================
router.get('/analytics', verifyAdmin, reportController.analyticsReport);

// ==========================================
// REPORT EXPORTS
// ==========================================

// Student Report
router.get(
    '/students/pdf',
    verifyAdmin,
    reportExportController.studentsPDF
);

router.get(
    '/students/excel',
    verifyAdmin,
    reportExportController.studentsExcel
);


// Club Report
router.get(
    '/clubs/pdf',
    verifyAdmin,
    reportExportController.clubsPDF
);

router.get(
    '/clubs/excel',
    verifyAdmin,
    reportExportController.clubsExcel
);


// Finance Report
router.get(
    '/finance/pdf',
    verifyAdmin,
    reportExportController.financePDF
);

router.get(
    '/finance/excel',
    verifyAdmin,
    reportExportController.financeExcel
);
// Attendance
router.get(
    '/attendance/pdf',
    verifyAdmin,
    reportController.attendancePDF
);

router.get(
    '/attendance/excel',
    verifyAdmin,
    reportController.attendanceExcel
);

// Analytics
router.get(
    '/analytics/pdf',
    verifyAdmin,
    reportController.analyticsPDF
);

router.get(
    '/analytics/excel',
    verifyAdmin,
    reportController.analyticsExcel
);

module.exports = router;