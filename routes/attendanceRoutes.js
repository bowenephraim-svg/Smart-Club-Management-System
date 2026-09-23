// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const verifyAdmin = require('../middleware/adminMiddleware');
const protectRoute = require('../middleware/authMiddleware');

// ==========================================
// DASHBOARD
// ==========================================
router.get('/', attendanceController.index);

// ==========================================
// MARK ATTENDANCE
// ==========================================
router.get('/mark', attendanceController.renderMarkForm);
router.post('/mark', attendanceController.processMark);

// ==========================================
// EDIT ATTENDANCE
// ==========================================
router.get('/edit/:id', attendanceController.renderEditForm);
router.post('/edit/:id', attendanceController.processEdit);

// ==========================================
// DELETE ATTENDANCE
// ==========================================
router.post('/delete/:id', verifyAdmin, attendanceController.processDelete);

// ==========================================
// STUDENT ATTENDANCE
// ==========================================
router.get('/student', attendanceController.studentAttendance);

// ==========================================
// CLUB ATTENDANCE
// ==========================================
router.get('/club/:id', attendanceController.clubAttendance);

// ==========================================
// EVENT ATTENDANCE DETAIL
// ==========================================
router.get('/event/:id', attendanceController.eventAttendance);

// ==========================================
// REPORTS
// ==========================================
router.get('/reports', attendanceController.reports);

// ==========================================
// GET ROSTER JSON (for mark attendance form)
// ==========================================
router.get('/mark/roster', async (req, res) => {
    try {
        const clubId = parseInt(req.query.club_id, 10);
        const activityId = parseInt(req.query.activity_id, 10);

        if (!clubId || !activityId) {
            return res.json({ success: false, students: [] });
        }

        const Patron = require('../models/Patron');
        const patronCtx = await Patron.getPatronContext(req);
        if (patronCtx.isPatron && !patronCtx.clubIds.includes(clubId)) {
            return res.json({ success: false, students: [], error: 'Access denied to this club roster.' });
        }

        const Activity = require('../models/Activity');
        const students = await Activity.getEligibleStudentsForClub(clubId);
        res.json({ success: true, students });
    } catch (err) {
        console.error('Roster fetch error:', err.message);
        res.json({ success: false, students: [] });
    }
});

// ==========================================
// EXPORT CSV
// ==========================================
router.get('/export/csv', attendanceController.exportCsv);

// ==========================================
// LEGACY ROUTES (keep existing working)
// ==========================================
router.get('/qr', (req, res) => {
    res.render('attendance/qr', { pageTitle: 'Attendance QR' });
});

router.get('/track/:activity_id', async (req, res) => {
    try {
        const Activity = require('../models/Activity');
        const activityId = req.params.activity_id;
        const activity = await Activity.getById(activityId);
        if (!activity) return res.status(404).send("Target activity profile missing.");

        const Patron = require('../models/Patron');
        const patronCtx = await Patron.getPatronContext(req);
        if (patronCtx.isPatron && !patronCtx.clubIds.includes(activity.club_id)) {
            req.session.error_msg = 'Access denied. You can only view attendance for your assigned clubs.';
            return res.redirect('/attendance');
        }

        await require('../models/Attendance').initializeRosterForActivity(activityId, activity.club_id);

        const roster = await require('../models/Attendance').getSheetByActivity(activityId);
        res.render('attendance/track', { activity, roster });
    } catch (err) {
        res.status(500).send("Attendance track initialization error: " + err.message);
    }
});

router.post('/update', verifyAdmin, async (req, res) => {
    try {
        const { activity_id, student_id, status } = req.body;
        const markedBy = req.session.user.id;
        await require('../models/Attendance').updateStatus(activity_id, student_id, status, markedBy);
        res.json({ success: true, message: "Attendance updated." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
