// controllers/attendanceController.js
const Attendance = require('../models/Attendance');
const Activity = require('../models/Activity');
const Club = require('../models/Club');
const Student = require('../models/Student');
const Patron = require('../models/Patron');
const db = require('../config/db');

const isAdmin = (req) => req.session?.user?.role === 'Admin';
const isAuthorized = (req) => {
    const role = req.session?.user?.role;
    return role === 'Admin' || role === 'Patron' || role === 'Teacher';
};

// ==========================================
// ATTENDANCE DASHBOARD
// ==========================================
exports.index = async (req, res) => {
    try {
        if (req.session?.user?.role === 'Student') {
            return res.redirect('/attendance/student');
        }

        if (!isAuthorized(req)) {
            return res.status(403).render('403', {
                message: 'Access denied. You do not have permission to manage attendance.'
            });
        }

        const patronCtx = await Patron.getPatronContext(req);
        let search = (req.query.search || '').trim();
        let clubId = req.query.club_id ? parseInt(req.query.club_id, 10) : null;
        const activityId = req.query.activity_id ? parseInt(req.query.activity_id, 10) : null;
        const status = req.query.status || '';
        const dateFrom = req.query.date_from || '';
        const dateTo = req.query.date_to || '';

        let clubs;
        let scopedClubIds = null;

        if (patronCtx.isPatron) {
            clubs = patronCtx.clubs;
            scopedClubIds = patronCtx.clubIds;
            if (clubId && !patronCtx.clubIds.includes(clubId)) {
                clubId = null;
            }
        } else {
            clubs = await Club.getAll();
        }

        const statsFilter = {
            club_id: clubId,
            club_ids: clubId ? null : scopedClubIds,
            activity_id: activityId,
            status,
            date_from: dateFrom,
            date_to: dateTo,
            search
        };

        const [stats, recentActivity] = await Promise.all([
            Attendance.getStats(statsFilter),
            Attendance.getRecent(8, clubId ? [clubId] : scopedClubIds)
        ]);

        const filters = { search, club_id: clubId, activity_id: activityId, status, date_from: dateFrom, date_to: dateTo };

        res.render('attendance/index', {
            stats,
            clubs,
            filters,
            recentActivity,
            pageTitle: 'Attendance Dashboard'
        });
  } catch (err) {
    console.error('========== ATTENDANCE DASHBOARD ERROR ==========');
    console.error(err);
    console.error('===============================================');

    req.session.error_msg = 'Unable to load attendance dashboard.';
    res.redirect('/dashboard');
}
};

// ==========================================
// MARK ATTENDANCE FORM
// ==========================================
exports.renderMarkForm = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/attendance');
        }

        const patronCtx = await Patron.getPatronContext(req);
        let clubs;
        let activities;

        if (patronCtx.isPatron) {
            clubs = patronCtx.clubs;
            activities = await Activity.getAll({ club_ids: patronCtx.clubIds });
        } else {
            clubs = await Club.getAll();
            activities = await Activity.getAll();
        }

        res.render('attendance/mark', {
            clubs,
            activities,
            formData: {},
            pageTitle: 'Mark Attendance'
        });
    } catch (err) {
        console.error('Mark attendance form error:', err.message);
        req.session.error_msg = 'Unable to load the attendance form.';
        res.redirect('/attendance');
    }
};

// ==========================================
// PROCESS MARK ATTENDANCE (bulk)
// ==========================================
exports.processMark = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/attendance');
        }

        const activityId = parseInt(req.body.activity_id, 10);
        const records = req.body.records || [];
        const markedBy = req.session.user.id;

        if (!activityId) {
            req.session.error_msg = 'Please select an activity.';
            return res.redirect('/attendance/mark');
        }

        const activity = await Activity.getById(activityId);
        if (!activity) {
            req.session.error_msg = 'The selected activity could not be found.';
            return res.redirect('/attendance/mark');
        }

        const patronCtx = await Patron.getPatronContext(req);
        if (patronCtx.isPatron && !patronCtx.clubIds.includes(activity.club_id)) {
            req.session.error_msg = 'Access denied. You can only mark attendance for your assigned clubs.';
            return res.redirect('/attendance/mark');
        }

        if (!records.length) {
            req.session.error_msg = 'No attendance records to save.';
            return res.redirect('/attendance/mark');
        }

        const count = await Attendance.bulkCreate(activityId, records, markedBy);

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Marked attendance for activity "${activity.activity_name}" (ID: ${activityId}) — ${count} records`]
        );

        req.session.success_msg = `Attendance saved successfully for ${count} students.`;
        res.redirect(`/attendance/event/${activityId}`);
    } catch (err) {
        console.error('Mark attendance error:', err.message);
        req.session.error_msg = 'Unable to save attendance. Please try again.';
        res.redirect('/attendance/mark');
    }
};

// ==========================================
// EDIT ATTENDANCE FORM
// ==========================================
exports.renderEditForm = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/attendance');
        }

        const attendanceId = parseInt(req.params.id, 10);
        if (!attendanceId) {
            req.session.error_msg = 'Invalid attendance selection.';
            return res.redirect('/attendance');
        }

        const record = await Attendance.getById(attendanceId);
        if (!record) {
            req.session.error_msg = 'The attendance record could not be found.';
            return res.redirect('/attendance');
        }

        res.render('attendance/edit', {
            record,
            pageTitle: 'Edit Attendance'
        });
    } catch (err) {
        console.error('Edit attendance form error:', err.message);
        req.session.error_msg = 'Unable to load the attendance edit form.';
        res.redirect('/attendance');
    }
};

// ==========================================
// PROCESS EDIT ATTENDANCE
// ==========================================
exports.processEdit = async (req, res) => {
    try {
        if (!isAuthorized(req)) {
            req.session.error_msg = 'Access denied.';
            return res.redirect('/attendance');
        }

        const attendanceId = parseInt(req.params.id, 10);
        if (!attendanceId) {
            req.session.error_msg = 'Invalid attendance selection.';
            return res.redirect('/attendance');
        }

        const record = await Attendance.getById(attendanceId);
        if (!record) {
            req.session.error_msg = 'The attendance record could not be found.';
            return res.redirect('/attendance');
        }

        const status = (req.body.status || '').trim();
        const notes = (req.body.notes || '').trim();

        if (!status) {
            req.session.error_msg = 'Status is required.';
            return res.redirect(`/attendance/edit/${attendanceId}`);
        }

        const validStatuses = ['Present', 'Absent', 'Late', 'Excused'];
        if (!validStatuses.includes(status)) {
            req.session.error_msg = 'Invalid attendance status.';
            return res.redirect(`/attendance/edit/${attendanceId}`);
        }

        const updated = await Attendance.update(attendanceId, {
            status,
            notes: notes || null,
            marked_by: req.session.user.id
        });

        if (!updated) {
            req.session.error_msg = 'The attendance record could not be updated.';
            return res.redirect(`/attendance/edit/${attendanceId}`);
        }

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Updated attendance record ID ${attendanceId} to "${status}"`]
        );

        req.session.success_msg = 'Attendance record updated successfully.';
        res.redirect('/attendance');
    } catch (err) {
        console.error('Edit attendance error:', err.message);
        req.session.error_msg = 'Unable to update attendance. Please try again.';
        res.redirect('/attendance');
    }
};

// ==========================================
// DELETE ATTENDANCE
// ==========================================
exports.processDelete = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            req.session.error_msg = 'Access denied. Only administrators can delete attendance records.';
            return res.redirect('/attendance');
        }

        const attendanceId = parseInt(req.params.id, 10);
        if (!attendanceId) {
            req.session.error_msg = 'Invalid attendance selection.';
            return res.redirect('/attendance');
        }

        const record = await Attendance.getById(attendanceId);
        if (!record) {
            req.session.error_msg = 'The attendance record could not be found.';
            return res.redirect('/attendance');
        }

        const deleted = await Attendance.delete(attendanceId);
        if (!deleted) {
            req.session.error_msg = 'The attendance record could not be deleted.';
            return res.redirect('/attendance');
        }

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Deleted attendance record ID ${attendanceId} for student ${record.first_name} ${record.last_name} in activity ${record.activity_name}`]
        );

        req.session.success_msg = 'Attendance record deleted successfully.';
        res.redirect('/attendance');
    } catch (err) {
        console.error('Delete attendance error:', err.message);
        req.session.error_msg = 'Unable to delete attendance. Please try again.';
        res.redirect('/attendance');
    }
};

// ==========================================
// STUDENT ATTENDANCE (own records)
// ==========================================
exports.studentAttendance = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const student = await Student.getByUserId(userId);

        if (!student) {
            req.session.error_msg = 'Student profile not found.';
            return res.redirect('/dashboard');
        }

        const status = req.query.status || '';
        const dateFrom = req.query.date_from || '';
        const dateTo = req.query.date_to || '';

        const [records, stats] = await Promise.all([
            Attendance.getByStudent(student.student_id, { status, date_from: dateFrom, date_to: dateTo }),
            Attendance.getStudentStats(student.student_id)
        ]);

        const filters = { status, date_from: dateFrom, date_to: dateTo };

        res.render('attendance/student', {
            student,
            records,
            stats,
            filters,
            pageTitle: 'My Attendance'
        });
    } catch (err) {
        console.error('Student attendance error:', err.message);
        req.session.error_msg = 'Unable to load your attendance.';
        res.redirect('/dashboard');
    }
};

// ==========================================
// CLUB ATTENDANCE
// ==========================================
exports.clubAttendance = async (req, res) => {
    try {
        const clubId = parseInt(req.params.id, 10);
        if (!clubId) {
            req.session.error_msg = 'Invalid club selection.';
            return res.redirect('/attendance');
        }

        const patronCtx = await Patron.getPatronContext(req);
        if (patronCtx.isPatron && !patronCtx.clubIds.includes(clubId)) {
            req.session.error_msg = 'Access denied. You can only view attendance for your assigned clubs.';
            return res.redirect('/attendance');
        }

        const club = await Club.getById(clubId);
        if (!club) {
            req.session.error_msg = 'The selected club could not be found.';
            return res.redirect('/attendance');
        }

        const [records, stats, members] = await Promise.all([
            Attendance.getByClub(clubId),
            Attendance.getClubStats(clubId),
            Club.getRoster(clubId)
        ]);

        // Build per-student summary
        const studentMap = {};
        records.forEach(record => {
            if (!studentMap[record.student_id]) {
                studentMap[record.student_id] = {
                    student_id: record.student_id,
                    admission_no: record.admission_no,
                    first_name: record.first_name,
                    last_name: record.last_name,
                    class: record.class,
                    totalSessions: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0
                };
            }
            const entry = studentMap[record.student_id];
            entry.totalSessions += 1;
            if (record.status === 'Present') entry.present += 1;
            if (record.status === 'Absent') entry.absent += 1;
            if (record.status === 'Late') entry.late += 1;
            if (record.status === 'Excused') entry.excused += 1;
        });

        const studentSummaries = Object.values(studentMap).map(s => ({
            ...s,
            attendanceRate: s.totalSessions > 0 ? Math.round((s.present / s.totalSessions) * 100) : 0
        })).sort((a, b) => a.attendanceRate - b.attendanceRate);

        res.render('attendance/club', {
            club,
            stats,
            studentSummaries,
            pageTitle: `${club.club_name} Attendance`
        });
    } catch (err) {
        console.error('Club attendance error:', err.message);
        req.session.error_msg = 'Unable to load club attendance.';
        res.redirect('/attendance');
    }
};

// ==========================================
// EVENT ATTENDANCE DETAIL
// ==========================================
exports.eventAttendance = async (req, res) => {
    try {
        const activityId = parseInt(req.params.id, 10);
        if (!activityId) {
            req.session.error_msg = 'Invalid activity selection.';
            return res.redirect('/attendance');
        }

        const [activity, records, stats] = await Promise.all([
            Activity.getById(activityId),
            Attendance.getByEvent(activityId),
            Attendance.getEventStats(activityId)
        ]);

        if (!activity) {
            req.session.error_msg = 'The selected activity could not be found.';
            return res.redirect('/attendance');
        }

        const patronCtx = await Patron.getPatronContext(req);
        if (patronCtx.isPatron && !patronCtx.clubIds.includes(activity.club_id)) {
            req.session.error_msg = 'Access denied. You can only view attendance for your assigned clubs.';
            return res.redirect('/attendance');
        }

        res.render('attendance/event', {
            activity,
            records,
            stats,
            pageTitle: `${activity.activity_name} Attendance`
        });
    } catch (err) {
        console.error('Event attendance error:', err.message);
        req.session.error_msg = 'Unable to load event attendance.';
        res.redirect('/attendance');
    }
};

// ==========================================
// ATTENDANCE REPORTS / ANALYTICS
// ==========================================
exports.reports = async (req, res) => {
    try {
        const patronCtx = await Patron.getPatronContext(req);
        let clubId = req.query.club_id ? parseInt(req.query.club_id, 10) : null;
        const months = parseInt(req.query.months, 10) || 6;

        let clubs;
        let scopedClubIds = null;

        if (patronCtx.isPatron) {
            clubs = patronCtx.clubs;
            scopedClubIds = patronCtx.clubIds;
            if (clubId && !patronCtx.clubIds.includes(clubId)) {
                clubId = null;
            }
        } else {
            clubs = await Club.getAll();
        }

        const [monthlyStats, lowAttendance] = await Promise.all([
            Attendance.getMonthlyStats(months, clubId ? [clubId] : scopedClubIds),
            clubId ? Attendance.getLowAttendance(70, clubId) : Attendance.getLowAttendance(70, null, scopedClubIds)
        ]);

        const filters = { club_id: clubId, months };

        res.render('attendance/reports', {
            clubs,
            monthlyStats,
            lowAttendance,
            filters,
            pageTitle: 'Attendance Reports'
        });
    } catch (err) {
        console.error('Attendance reports error:', err.message);
        req.session.error_msg = 'Unable to load attendance reports.';
        res.redirect('/attendance');
    }
};

// ==========================================
// EXPORT ATTENDANCE CSV
// ==========================================
exports.exportCsv = async (req, res) => {
    try {
        const patronCtx = await Patron.getPatronContext(req);
        let clubId = req.query.club_id ? parseInt(req.query.club_id, 10) : null;

        let scopedClubIds = null;
        if (patronCtx.isPatron) {
            scopedClubIds = patronCtx.clubIds;
            if (clubId && !patronCtx.clubIds.includes(clubId)) {
                clubId = null;
            }
        }

        const filters = {
            club_id: clubId,
            club_ids: clubId ? null : scopedClubIds,
            activity_id: req.query.activity_id ? parseInt(req.query.activity_id, 10) : null,
            status: req.query.status || '',
            date_from: req.query.date_from || '',
            date_to: req.query.date_to || '',
            search: req.query.search || ''
        };

        const records = await Attendance.getAll(filters);

        let csv = 'Student,Admission No,Club,Activity,Date,Status,Marked By,Notes,Created At\n';
        records.forEach(r => {
            const student = `${r.first_name} ${r.last_name}`.replace(/"/g, '""');
            const activity = (r.activity_name || '').replace(/"/g, '""');
            const club = (r.club_name || '').replace(/"/g, '""');
            const notes = (r.notes || '').replace(/"/g, '""');
            const markedBy = (r.marked_by_name || '').replace(/"/g, '""');
            csv += `"${student}","${r.admission_no}","${club}","${activity}","${r.attendance_date}","${r.status}","${markedBy}","${notes}","${r.created_at}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
        res.send(csv);
    } catch (err) {
        console.error('CSV export error:', err.message);
        req.session.error_msg = 'Unable to export attendance.';
        res.redirect('/attendance');
    }
};
