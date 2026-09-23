// controllers/studentController.js

const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Activity = require('../models/Activity');

const db = require('../config/db');


// =====================================================
// HELPER: GET CURRENT STUDENT
// =====================================================

async function getCurrentStudent(req) {

    const userId =
        req.session.user.user_id ??
        req.session.user.id;

    return await Student.getByUserId(userId);
}


// =====================================================
// STUDENT DASHBOARD
// =====================================================

exports.dashboard = async (req, res) => {

    let userId;

    try {

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        userId =
            req.session.user.user_id ??
            req.session.user.id;

        const student = await Student.getByUserId(userId);

        if (!student) {

            console.error(
                `Student dashboard: no profile for user_id ${userId}`
            );

            return res.status(404).send(
                'Student profile could not be found.'
            );
        }

        student.full_name =
            `${student.first_name} ${student.last_name}`;


        // -------------------------------------------------
        // TOTAL ACTIVE CLUBS
        // -------------------------------------------------

        const [clubResult] = await db.query(
            `
            SELECT COUNT(*) AS totalClubs
            FROM memberships
            WHERE student_id = ?
            AND status = 'Active'
            `,
            [student.student_id]
        );


        // -------------------------------------------------
        // ATTENDANCE
        // -------------------------------------------------

        const [attendanceResult] = await db.query(
            `
            SELECT
                COUNT(*) AS totalAttendance,
                COALESCE(
                    SUM(status = 'Present'),
                    0
                ) AS presentDays
            FROM attendance
            WHERE student_id = ?
            `,
            [student.student_id]
        );

        let attendanceRate = 0;

        if (
            attendanceResult[0].totalAttendance > 0
        ) {

            attendanceRate = Math.round(
                (
                    attendanceResult[0].presentDays /
                    attendanceResult[0].totalAttendance
                ) * 100
            );

        }


        // -------------------------------------------------
        // NOTIFICATIONS
        // -------------------------------------------------

        const [notificationResult] = await db.query(
            `
            SELECT COUNT(*) AS totalNotifications
            FROM notifications
            WHERE user_id = ?
            AND status = 'Unread'
            `,
            [userId]
        );


        // -------------------------------------------------
        // UPCOMING ACTIVITIES
        // -------------------------------------------------

        const activities =
            await Activity.getUpcoming(5);


        res.render(
            'students/dashboard',
            {

                user: req.session.user,

                student,

                totalClubs:
                    clubResult[0].totalClubs,

                attendanceRate,

                notifications:
                    notificationResult[0].totalNotifications,

                upcomingEvents:
                    activities.length,

                activities

            }
        );

    } catch (err) {

        console.error(
            'Student dashboard error:',
            err
        );

        res.status(500).send(
            'Unable to load your dashboard.'
        );

    }

};


// =====================================================
// STUDENT PROFILE
// =====================================================

// ==========================================
// STUDENT PROFILE
// ==========================================
exports.profile = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        // Get student
        const student = await Student.getByUserId(userId);

        if (!student) {
            return res.status(404).send('Student profile not found.');
        }

        // Get memberships
        const [memberships] = await db.query(
            `
            SELECT
                m.membership_id,
                m.join_date,
                m.status,
                c.club_name,
                c.description
            FROM memberships m
            INNER JOIN clubs c
                ON m.club_id = c.club_id
            WHERE m.student_id = ?
            ORDER BY m.join_date DESC
            `,
            [student.student_id]
        );

        // Get attendance
        const [attendance] = await db.query(
            `
            SELECT
                a.status,
                a.attendance_date AS meeting_date,
                act.activity_name AS title,
                act.venue
            FROM attendance a
            LEFT JOIN activities act
                ON a.activity_id = act.activity_id
            WHERE a.student_id = ?
            ORDER BY a.attendance_date DESC
            LIMIT 20
            `,
            [student.student_id]
        );

        res.render('students/profile', {

            user: req.session.user,

            student,

            memberships,

            attendance

        });

    } catch (err) {

        console.error('Student profile error:', err);

        res.status(500).send('Profile Error');

    }

};


// =====================================================
// MY CLUBS
// =====================================================

// ==========================================
// MY CLUBS
// ==========================================
exports.myClubs = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        const student = await Student.getByUserId(userId);

        if (!student) {
            return res.status(404).send('Student profile not found.');
        }

        const [memberships] = await db.query(
            `
            SELECT
                m.membership_id,
                m.join_date,
                m.status,
                c.club_name,
                c.description
            FROM memberships m
            INNER JOIN clubs c
                ON m.club_id = c.club_id
            WHERE m.student_id = ?
            ORDER BY m.join_date DESC
            `,
            [student.student_id]
        );

        res.render('students/my-clubs', {
            user: req.session.user,
            student,
            memberships
        });

    } catch (err) {

        console.error('Student clubs error:', err);

        res.status(500).send('Unable to load your clubs.');

    }

};


// =====================================================
// MY ATTENDANCE
// =====================================================

// ==========================================
// MY ATTENDANCE
// ==========================================
exports.myAttendance = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        // Find student
        const [students] = await db.query(
            `
            SELECT *
            FROM students
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );

        if (students.length === 0) {
            return res.status(404).send('Student profile not found.');
        }

        const student = students[0];

        // Get attendance
        const [attendance] = await db.query(
            `
            SELECT
                a.attendance_id,
                a.status,
                a.attendance_date,
                a.activity_id,
                act.activity_name AS activity_name,
                act.venue
            FROM attendance a
            LEFT JOIN activities act
                ON a.activity_id = act.activity_id
            WHERE a.student_id = ?
            ORDER BY a.attendance_date DESC
            `,
            [student.student_id]
        );

        res.render('students/attendance', {

            user: req.session.user,

            student,

            attendance

        });

    } catch (err) {

        console.error('Student attendance error:', err);

        res.status(500).send(
            'Unable to load your attendance. Please try again later.'
        );

    }

};


// =====================================================
// STUDENT NOTIFICATIONS
// =====================================================

exports.notifications = async (req, res) => {

    try {

        const userId =
            req.session.user.user_id ??
            req.session.user.id;


        const [notifications] =
            await db.query(
                `
                SELECT *
                FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                `,
                [userId]
            );


        res.render(
            'students/notifications',
            {

                user: req.session.user,

                notifications

            }
        );

    } catch (err) {

        console.error(
            'Student notification error:',
            err
        );

        res.status(500).send(
            'Unable to load notifications.'
        );

    }

};


// =====================================================
// MARK NOTIFICATION AS READ
// =====================================================

exports.readNotification = async (req, res) => {

    try {

        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        await Notification.markRead(
            req.params.id,
            userId
        );

        res.redirect(
            '/student/notifications'
        );

    } catch (err) {

        console.error(err);

        res.status(500).send(
            'Unable to update notification.'
        );

    }

};


// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

exports.readAllNotifications = async (req, res) => {

    try {

        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        await Notification.markAllRead(
            userId
        );

        res.redirect(
            '/student/notifications'
        );

    } catch (err) {

        console.error(err);

        res.status(500).send(
            'Unable to update notifications.'
        );

    }

};


// =====================================================
// PAYMENT HISTORY
// =====================================================

// ==========================================
// MY PAYMENTS
// ==========================================
exports.payments = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        // Get logged-in student's profile
        const student = await Student.getByUserId(userId);

        if (!student) {
            return res.status(404).send('Student profile not found.');
        }

        // Get payment history
        const payments = await Payment.getByStudent(
            student.student_id
        );

        // Get payment totals
        const totals = await Payment.getStudentTotals(
            student.student_id
        );

        res.render('students/payments', {

            user: req.session.user,

            student,

            payments: payments || [],

            totals: totals || {}

        });

    } catch (err) {

        console.error('Student payments error:', err);

        res.status(500).send(
            'Unable to load your payment history.'
        );

    }

};


// =====================================================
// PAYMENT FORM
// =====================================================

exports.paymentPage = async (req, res) => {

    try {

        const student =
            await getCurrentStudent(req);

        if (!student) {

            return res.status(404).send(
                'Student profile not found.'
            );

        }


        res.render(
            'students/payment',
            {

                user: req.session.user,

                student

            }
        );

    } catch (err) {

        console.error(err);

        res.status(500).send(
            'Unable to load payment page.'
        );

    }

};


// =====================================================
// SUBMIT PAYMENT
// =====================================================

exports.submitPayment = async (req, res) => {

    try {

        const {

            student_id,
            payment_method,
            transaction_code

        } = req.body;


        await db.query(
            `
            INSERT INTO payments
            (
                student_id,
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
                500,
                CURDATE(),
                ?,
                'Registration',
                ?,
                'Pending'
            )
            `,
            [
                student_id,
                payment_method,
                transaction_code
            ]
        );


        res.redirect(
            '/student/payments'
        );

    } catch (err) {

        console.error(
            'Payment submission error:',
            err
        );

        res.status(500).send(
            'Payment submission failed.'
        );

    }

};


// =====================================================
// STUDENT EVENTS
// =====================================================

// ==========================================
// STUDENT EVENTS / ACTIVITIES
// ==========================================
exports.events = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const activities = await Activity.getUpcoming(50);

        res.render('students/events', {

            user: req.session.user,

            activities

        });

    } catch (err) {

        console.error('Student events error:', err);

        res.status(500).send(
            'Unable to load upcoming events. Please try again later.'
        );

    }

};
// =====================================================
// STUDENT: AVAILABLE CLUBS
// =====================================================

// =====================================================
// STUDENT: AVAILABLE CLUBS
// =====================================================

// =====================================================
// STUDENT: AVAILABLE CLUBS
// =====================================================

exports.availableClubs = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        // Get logged-in user ID
        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        // Get student profile
        const student =
            await Student.getByUserId(userId);

        if (!student) {
            return res.status(404).send(
                'Student profile not found.'
            );
        }

        /*
         * Your clubs table does NOT have a status column.
         * Therefore we load all clubs.
         *
         * membership_fee comes directly from clubs.membership_fee.
         */

        const [clubs] = await db.query(
            `
            SELECT
                c.club_id,
                c.club_name,
                c.patron_id,
                c.description,
                c.meeting_day,
                c.venue,
                c.membership_fee,

                m.membership_id,
                m.status AS membership_status,
                m.join_date

            FROM clubs c

            LEFT JOIN memberships m
                ON c.club_id = m.club_id
                AND m.student_id = ?

            ORDER BY c.club_name ASC
            `,
            [student.student_id]
        );

        res.render(
            'students/available-clubs',
            {
                user: req.session.user,
                student,
                clubs
            }
        );

    } catch (err) {

        console.error(
            'Available clubs error:',
            err
        );

        res.status(500).send(
            'Unable to load available clubs.'
        );

    }

};


// =====================================================
// STUDENT: CLUB PAYMENT PAGE
// =====================================================

exports.clubPaymentPage = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        // Get student
        const student =
            await Student.getByUserId(userId);

        if (!student) {
            return res.status(404).send(
                'Student profile not found.'
            );
        }

        const clubId =
            parseInt(req.params.club_id, 10);

        if (!clubId) {

            req.session.error_msg =
                'Invalid club selected.';

            return res.redirect(
                '/student/clubs/available'
            );

        }

        // Get club
        const [clubRows] = await db.query(
            `
            SELECT
                club_id,
                club_name,
                p.full_name AS patron_name,
                description,
                meeting_day,
                venue,
                membership_fee,
                p.user_id AS patron_user_id

            FROM clubs
            LEFT JOIN patrons p
                ON p.patron_id = clubs.patron_id

            WHERE clubs.club_id = ?
            `,
            [clubId]
        );

        if (clubRows.length === 0) {

            req.session.error_msg =
                'The selected club could not be found.';

            return res.redirect(
                '/student/clubs/available'
            );

        }

        const club = clubRows[0];

        // Check whether student already has membership
        const [membershipRows] = await db.query(
            `
            SELECT
                membership_id,
                status

            FROM memberships

            WHERE student_id = ?
            AND club_id = ?

            LIMIT 1
            `,
            [
                student.student_id,
                clubId
            ]
        );

        if (membershipRows.length > 0) {

            const membership =
                membershipRows[0];

            if (membership.status === 'Active') {

                req.session.error_msg =
                    `You are already an active member of ${club.club_name}.`;

            } else if (
                membership.status === 'Pending'
            ) {

                req.session.error_msg =
                    `Your request to join ${club.club_name} is already waiting for approval.`;

            } else if (membership.status !== 'Rejected') {

                req.session.error_msg =
                    `You already have a membership record for ${club.club_name}.`;

                return res.redirect(
                    '/student/clubs/available'
                );

            }

        }

        // Render payment page
        res.render(
            'students/club-payment',
            {
                user: req.session.user,
                student,
                club
            }
        );

    } catch (err) {

        console.error(
            'Club payment page error:',
            err
        );

        res.status(500).send(
            'Unable to load club payment page.'
        );

    }

};


// =====================================================
// STUDENT: SUBMIT CLUB MEMBERSHIP PAYMENT
// =====================================================

exports.submitClubPayment = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        const student =
            await Student.getByUserId(userId);

        if (!student) {
            return res.status(404).send(
                'Student profile not found.'
            );
        }

        const clubId =
            parseInt(req.params.club_id, 10);

        const {
            payment_method,
            transaction_code
        } = req.body;

        if (!clubId) {

            req.session.error_msg =
                'Invalid club selected.';

            return res.redirect(
                '/student/clubs/available'
            );

        }

        // =================================================
        // VALIDATE PAYMENT METHOD
        // =================================================

        if (!payment_method) {

            req.session.error_msg =
                'Please select a payment method.';

            return res.redirect(
                `/student/clubs/${clubId}/payment`
            );

        }

        // =================================================
        // GET CLUB
        // =================================================

        const [clubRows] = await db.query(
            `
            SELECT
                club_id,
                club_name,
                membership_fee,
                p.user_id AS patron_user_id

            FROM clubs
            LEFT JOIN patrons p
                ON p.patron_id = clubs.patron_id

            WHERE clubs.club_id = ?
            `,
            [clubId]
        );

        if (clubRows.length === 0) {

            req.session.error_msg =
                'The selected club could not be found.';

            return res.redirect(
                '/student/clubs/available'
            );

        }

        const club = clubRows[0];

        const amount =
            Number(club.membership_fee || 0);


        // =================================================
        // CHECK EXISTING MEMBERSHIP
        // =================================================

        const [existingMembership] =
            await db.query(
                `
                SELECT
                    membership_id,
                    status

                FROM memberships

                WHERE student_id = ?
                AND club_id = ?

                LIMIT 1
                `,
                [
                    student.student_id,
                    clubId
                ]
            );

        if (existingMembership.length > 0) {

            const status =
                existingMembership[0].status;

            if (status === 'Active') {

                req.session.error_msg =
                    `You are already an active member of ${club.club_name}.`;

            } else if (status === 'Pending') {

                req.session.error_msg =
                    `Your membership request for ${club.club_name} is already pending.`;

                return res.redirect(
                    '/student/clubs/available'
                );

            } else if (status === 'Rejected') {

                req.session.error_msg =
                    `Your previous request for ${club.club_name} was rejected. Submit a new payment to try again.`;

                return res.redirect(
                    `/student/clubs/${clubId}/payment`
                );

            } else {

                req.session.error_msg =
                    `You already have a membership record for ${club.club_name}.`;

                return res.redirect(
                    '/student/clubs/available'
                );

            }

        }


        // =================================================
        // FREE CLUB
        // =================================================

        if (amount <= 0) {

            const [membershipResult] = await db.query(
                `
                INSERT INTO memberships
                (
                    student_id,
                    club_id,
                    join_date,
                    status
                )

                VALUES
                (
                    ?,
                    ?,
                    NOW(),
                    'Pending'
                )
                `,
                [
                    student.student_id,
                    clubId
                ]
            );

            if (club.patron_user_id) {
                await Notification.create({
                    user_id: club.patron_user_id,
                    message: `${student.first_name} ${student.last_name} (${student.admission_no}) has requested to join ${club.club_name}.`,
                    type: 'membership_pending',
                    related_id: membershipResult.insertId
                });
            }

            req.session.success_msg =
                `Your request to join ${club.club_name} has been submitted successfully.`;

            return res.redirect(
                '/student/clubs/available'
            );

        }


        // =================================================
        // PAID CLUB
        // =================================================

        if (!transaction_code) {

            req.session.error_msg =
                'Please enter your payment transaction code.';

            return res.redirect(
                `/student/clubs/${clubId}/payment`
            );

        }

        const cleanTransactionCode =
            transaction_code.trim();

        if (!cleanTransactionCode) {

            req.session.error_msg =
                'Please enter a valid transaction code.';

            return res.redirect(
                `/student/clubs/${clubId}/payment`
            );

        }


        // =================================================
        // CHECK DUPLICATE TRANSACTION CODE
        // =================================================

        const [existingPayment] =
            await db.query(
                `
                SELECT payment_id
                FROM payments
                WHERE transaction_code = ?
                LIMIT 1
                `,
                [cleanTransactionCode]
            );

        if (existingPayment.length > 0) {

            req.session.error_msg =
                'This transaction code has already been submitted.';

            return res.redirect(
                `/student/clubs/${clubId}/payment`
            );

        }


        // =================================================
        // CREATE PAYMENT
        // =================================================

        await Payment.createClubPayment({

            student_id:
                student.student_id,

            club_id:
                clubId,

            amount,

            payment_method,

            transaction_code:
                cleanTransactionCode

        });


        // =================================================
        // CREATE OR REOPEN MEMBERSHIP REQUEST
        // =================================================

        let membershipId;
        if (existingMembership.length > 0 && existingMembership[0].status === 'Rejected') {
            await db.query(
                `
                UPDATE memberships
                SET status = 'Pending', join_date = NOW(), approved_by = NULL, approved_at = NULL
                WHERE membership_id = ?
                `,
                [existingMembership[0].membership_id]
            );
            membershipId = existingMembership[0].membership_id;
        } else {
            const [membershipResult] = await db.query(
                `
                INSERT INTO memberships (student_id, club_id, join_date, status)
                VALUES (?, ?, NOW(), 'Pending')
                `,
                [student.student_id, clubId]
            );
            membershipId = membershipResult.insertId;
        }


        // =================================================
        // NOTIFY THE ASSIGNED CLUB PATRON
        // =================================================

        if (club.patron_user_id) {
            await Notification.create({
                user_id: club.patron_user_id,
                message: `${student.first_name} ${student.last_name} (${student.admission_no}) has requested to join ${club.club_name}.`,
                type: 'membership_pending',
                related_id: membershipId
            });
        } else {
            console.warn(`Club ${club.club_name} has no assigned patron.`);
        }


        // =================================================
        // SUCCESS
        // =================================================

        req.session.success_msg =
            `Your KES ${amount.toLocaleString()} payment for ${club.club_name} has been submitted. Your membership request is now waiting for administrator approval.`;

        res.redirect(
            '/student/clubs/available'
        );


    } catch (err) {

        console.error(
            'Submit club payment error:',
            err
        );

        req.session.error_msg =
            'Unable to submit your club membership payment. Please try again.';

        res.redirect(
            `/student/clubs/${req.params.club_id}/payment`
        );

    }

};
