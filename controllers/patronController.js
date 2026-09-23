// controllers/patronController.js

const Patron = require('../models/Patron');
const AdminApproval = require('../models/AdminApproval');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const db = require('../config/db');

module.exports = {

    // =========================================================
    // ADMIN-FACING: GET /patrons
    // =========================================================
    getAllPatrons: async (req, res) => {
        try {
            const patrons = await Patron.getAll();
            res.render('patrons/index', { patrons });
        } catch (err) {
            console.error('getAllPatrons error:', err);
            res.status(500).send("Database Exception: Unable to pull patrons catalog. " + err.message);
        }
    },

    // ADMIN-FACING: GET /patrons/add
    renderAddForm: async (req, res) => {
        try {
            const clubs = await Club.getAll();
            res.render('patrons/add', {
                clubs,
                error: null,
                formData: {}
            });
        } catch (err) {
            console.error('renderAddForm error:', err);
            res.status(500).send("Unable to load patron assignment form. " + err.message);
        }
    },

    // ADMIN-FACING: POST /patrons/add
    processAdd: async (req, res) => {
        try {
            await Patron.createWithClub(req.body, req.body.club_id);
            res.redirect('/patrons');
        } catch (err) {
            console.error('processAdd error:', err);
            const clubs = await Club.getAll();
            res.status(err.code === 'CLUB_ALREADY_ASSIGNED' ? 409 : 400).render('patrons/add', {
                clubs,
                error: err.message,
                formData: req.body
            });
        }
    },

    // ADMIN-FACING: GET /patrons/edit/:id
    renderEditForm: async (req, res) => {
        try {
            const patron = await Patron.getById(req.params.id);
            if (!patron) return res.status(404).send("Target Faculty record entry missing.");
            res.render('patrons/edit', { patron });
        } catch (err) {
            console.error('renderEditForm error:', err);
            res.status(500).send("Error reading structural metadata block: " + err.message);
        }
    },

    // ADMIN-FACING: POST /patrons/edit/:id
    processEdit: async (req, res) => {
        try {
            await Patron.update(req.params.id, req.body);
            res.redirect('/patrons');
        } catch (err) {
            console.error('processEdit error:', err);
            res.status(500).send("Mutation sequence failed: Cannot apply updates. " + err.message);
        }
    },

    // ADMIN-FACING: GET /patrons/delete/:id
    processDelete: async (req, res) => {
        try {
            await Patron.delete(req.params.id);
            res.redirect('/patrons');
        } catch (err) {
            console.error('processDelete error:', err);
            res.status(500).send("Cascade processing halted: Unable to complete profile purge. " + err.message);
        }
    },

    // =========================================================
    // PATRON SELF-SERVICE: GET /patron/dashboard
    // patronMiddleware must run first – it attaches req.patron
    // =========================================================
    dashboard: async (req, res) => {
        try {
            const patron = req.patron;
            const userId  = req.session.user.id;

            if (!patron || !patron.patron_id) {
                return res.render('patron/dashboard', {
                    pageTitle: 'Patron Dashboard',
                    patron: patron || { full_name: req.session.user.full_name || 'Patron' },
                    clubs: [],
                    stats: { totalMembers: 0, pendingRequests: 0, upcomingActivities: 0, unreadNotifications: 0 },
                    members: [],
                    pendingMemberships: [],
                    upcomingActivities: [],
                    attendance: { total: 0, present: 0, absent: 0, rate: 0 },
                    achievements: [],
                    notifications: []
                });
            }

            const patronId = patron.patron_id;
            const clubs = await Patron.getAssignedClubs(patronId);
            const clubIds = clubs.map(c => c.club_id);

            const [
                members,
                pendingMemberships,
                upcomingActivities,
                upcomingEvents,
                attendance,
                achievements,
                notifications
            ] = await Promise.all([
                Patron.getClubMembers(clubIds, 10),
                Patron.getPendingMemberships(clubIds),
                Patron.getUpcomingActivities(clubIds, 8),
                Patron.getUpcomingEvents(clubIds, 6),
                Patron.getAttendanceSummary(clubIds),
                Patron.getRecentAchievements(clubIds, 6),
                Notification.getByUser(userId)
            ]);

            const recentNotifications = (notifications || []).slice(0, 8);
            const totalMembers = clubs.reduce((acc, c) => acc + Number(c.active_member_count || 0), 0);
            const pendingCount  = clubs.reduce((acc, c) => acc + Number(c.pending_member_count || 0), 0);
            const unreadCount   = (notifications || []).filter(n => n.status === 'Unread').length;

            const stats = {
                totalMembers,
                pendingRequests:      pendingCount,
                upcomingActivities:   upcomingActivities.length,
                upcomingEvents:       upcomingEvents.length,
                unreadNotifications:  unreadCount
            };

            return res.render('patron/dashboard', {
                pageTitle: 'Patron Dashboard',
                patron,
                clubs,
                stats,
                members,
                pendingMemberships,
                upcomingActivities,
                upcomingEvents,
                attendance,
                achievements,
                notifications: recentNotifications
            });

        } catch (err) {
            console.error('Patron dashboard error:', err);
            return res.status(500).render('500', { error: err });
        }
    },

    // =========================================================
    // PATRON INVITE STUDENTS
    // =========================================================
    inviteStudentForm: async (req, res) => {
        try {
            const patron = req.patron;
            const clubs = await Club.getAll();

            const [students, events] = await Promise.all([
                db.query(`
                    SELECT u.user_id, u.full_name, u.email, s.admission_no
                    FROM users u
                    INNER JOIN students s ON s.user_id = u.user_id
                    WHERE u.role = 'Student'
                    ORDER BY u.full_name ASC
                `).then(([rows]) => rows),
                Event.getAll({ date_from: new Date().toISOString().slice(0, 10) })
            ]);

            return res.render('patron/invite-student', {
                pageTitle: 'Invite a Student',
                patron,
                students,
                clubs,
                events,
                error_msg: req.session.error_msg,
                success_msg: req.session.success_msg
            });
        } catch (err) {
            console.error('Invite student form error:', err);
            return res.status(500).render('500', { error: err });
        } finally {
            delete req.session.error_msg;
            delete req.session.success_msg;
        }
    },

    sendStudentInvite: async (req, res) => {
        try {
            const patron = req.patron;
            const recipient = req.body.recipient || '';
            const clubId = Number(req.body.club_id) || null;
            const eventId = Number(req.body.event_id) || null;
            const message = (req.body.message || '').trim();

            if (!message) {
                req.session.error_msg = 'Please enter an invitation message.';
                return res.redirect('/patron/invite-student');
            }

            const clubs = await Club.getAll();
            const club = clubs.find(item => Number(item.club_id) === clubId);
            if (clubId && !club) {
                req.session.error_msg = 'The selected club could not be found.';
                return res.redirect('/patron/invite-student');
            }

            let event = null;
            if (eventId) {
                event = await Event.getById(eventId);
                if (!event) {
                    req.session.error_msg = 'The selected event could not be found.';
                    return res.redirect('/patron/invite-student');
                }
            }

            let userIds;
            if (recipient === 'all') {
                const [rows] = await db.query(`
                    SELECT u.user_id
                    FROM users u
                    INNER JOIN students s ON s.user_id = u.user_id
                    WHERE u.role = 'Student'
                `);
                userIds = rows.map(row => row.user_id);
            } else {
                const studentId = Number(recipient);
                const [rows] = await db.query(`
                    SELECT u.user_id
                    FROM users u
                    INNER JOIN students s ON s.user_id = u.user_id
                    WHERE u.user_id = ? AND u.role = 'Student'
                    LIMIT 1
                `, [studentId]);
                userIds = rows.map(row => row.user_id);
            }

            if (!userIds || userIds.length === 0) {
                req.session.error_msg = 'Please select a valid student recipient.';
                return res.redirect('/patron/invite-student');
            }

            const context = [
                club ? `Club: ${club.club_name}` : '',
                event ? `Event: ${event.title}` : ''
            ].filter(Boolean).join(' | ');
            const fullMessage = context ? `${message}\n${context}` : message;

            await Notification.createForUsers({
                userIds,
                message: fullMessage,
                type: 'student_invitation',
                related_id: eventId || clubId
            });

            req.session.success_msg = `Invitation sent to ${recipient === 'all' ? 'all students' : 'the selected student'}.`;
            return res.redirect('/patron/invite-student');
        } catch (err) {
            console.error('Send student invite error:', err);
            return res.status(500).render('500', { error: err });
        }
    },

    // =========================================================
    // PATRON PROFILE: GET /patron/profile
    // =========================================================
    profile: async (req, res) => {
        try {
            const patron = req.patron;
            const clubs  = patron && patron.patron_id
                ? await Patron.getAssignedClubs(patron.patron_id)
                : [];

            return res.render('patron/profile', {
                pageTitle: 'My Profile',
                patron,
                clubs
            });
        } catch (err) {
            console.error('Patron profile error:', err);
            return res.status(500).render('500', { error: err });
        }
    },

    // =========================================================
    // PATRON MEMBERS: GET /patron/members
    // =========================================================
    members: async (req, res) => {
        try {
            const patron = req.patron;
            if (!patron || !patron.patron_id) {
                return res.render('patron/members', {
                    pageTitle: 'My Members',
                    patron,
                    clubs: [],
                    members: [],
                    pendingMemberships: [],
                    stats: { totalMembers: 0, pendingRequests: 0 }
                });
            }

            const clubs = await Patron.getAssignedClubs(patron.patron_id);
            const clubIds = clubs.map(c => c.club_id);

            const [members, pendingMemberships] = await Promise.all([
                Patron.getClubMembers(clubIds, 100),
                Patron.getPendingMemberships(clubIds)
            ]);

            const totalMembers = clubs.reduce((acc, c) => acc + Number(c.active_member_count || 0), 0);
            const pendingCount  = clubs.reduce((acc, c) => acc + Number(c.pending_member_count || 0), 0);

            return res.render('patron/members', {
                pageTitle: 'My Members',
                patron,
                clubs,
                members,
                pendingMemberships,
                stats: { totalMembers, pendingRequests: pendingCount }
            });
        } catch (err) {
            console.error('Patron members error:', err);
            return res.status(500).render('500', { error: err });
        }
    },

    // =========================================================
    // PATRON CLUBS: GET /patron/clubs
    // Shows ONLY clubs assigned to the logged-in patron
    // =========================================================
    clubs: async (req, res) => {
        try {
            const patronCtx = await Patron.getPatronContext(req);

            if (!patronCtx.isPatron || !patronCtx.patron || !patronCtx.patron.patron_id) {
                return res.render('patron/clubs', {
                    pageTitle: 'My Clubs',
                    patron: patronCtx.patron || req.patron || { full_name: req.session?.user?.full_name || 'Patron' },
                    clubs: []
                });
            }

            return res.render('patron/clubs', {
                pageTitle: 'My Clubs',
                patron: patronCtx.patron,
                clubs: patronCtx.clubs
            });

        } catch (err) {
            console.error('Patron clubs error:', err);
            return res.status(500).render('500', { error: err });
        }
    },

    // =========================================================
    // PATRON NOTIFICATIONS
    // =========================================================

    notifications: async (req, res) => {

        try {

            const userId =
                req.session.user.id;

            const notifications =
                await Notification.getByUser(
                    userId
                );

            const unread =
                await Notification.unreadCount(
                    userId
                );

            return res.render(
                'patron/notifications',
                {
                    pageTitle: 'My Notifications',
                    notifications:
                        notifications || [],
                    unread
                }
            );

        } catch (err) {

            console.error(
                'Patron notifications error:',
                err
            );

            return res.status(500).render(
                '500',
                {
                    error: err
                }
            );

        }

    },

    // =========================================================
    // PENDING STUDENT REGISTRATIONS
    // GET /patron/student-registrations
    // =========================================================

    pendingStudentRegistrations: async (req, res) => {

        try {

            const students =
                await AdminApproval.getPendingStudents();

            return res.render(
                'patron/student-registrations',
                {
                    pageTitle:
                        'Pending Student Registrations',

                    patron:
                        req.patron,

                    students
                }
            );

        } catch (err) {

            console.error(
                'Pending student registrations error:',
                err
            );

            return res.status(500).render(
                '500',
                {
                    error: err
                }
            );

        }

    },

    // =========================================================
    // APPROVE STUDENT REGISTRATION
    // POST /patron/student-registrations/approve/:id
    // =========================================================

    approveStudentRegistration: async (
        req,
        res
    ) => {

        try {

            const userId =
                parseInt(
                    req.params.id,
                    10
                );

            if (!userId) {

                req.session.error_msg =
                    'Invalid student account.';

                return res.redirect(
                    '/patron/student-registrations'
                );

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        u.user_id,
                        u.full_name,
                        u.email,
                        s.student_id,
                        s.admission_no

                    FROM users u

                    INNER JOIN students s
                        ON u.user_id = s.user_id

                    WHERE u.user_id = ?
                    AND u.role = 'Student'
                    AND u.status = 'Pending Approval'

                    LIMIT 1
                    `,
                    [userId]
                );

            if (rows.length === 0) {

                req.session.error_msg =
                    'Student registration not found or already processed.';

                return res.redirect(
                    '/patron/student-registrations'
                );

            }

            const student =
                rows[0];

            const approved =
                await AdminApproval.approve(
                    student.student_id
                );

            if (!approved) {

                req.session.error_msg =
                    'Student could not be approved.';

                return res.redirect(
                    '/patron/student-registrations'
                );

            }

            req.session.success_msg =
                `${student.full_name} has been approved successfully.`;

            return res.redirect(
                '/patron/student-registrations'
            );

        } catch (err) {

            console.error(
                'Approve student error:',
                err
            );

            return res.status(500).render(
                '500',
                {
                    error: err
                }
            );

        }

    },

    // =========================================================
    // REJECT STUDENT REGISTRATION
    // POST /patron/student-registrations/reject/:id
    // =========================================================

    rejectStudentRegistration: async (
        req,
        res
    ) => {

        try {

            const userId =
                parseInt(
                    req.params.id,
                    10
                );

            if (!userId) {

                req.session.error_msg =
                    'Invalid student account.';

                return res.redirect(
                    '/patron/student-registrations'
                );

            }

            const [rows] =
                await db.query(
                    `
                    SELECT
                        u.user_id,
                        u.full_name,
                        s.student_id

                    FROM users u

                    INNER JOIN students s
                        ON u.user_id = s.user_id

                    WHERE u.user_id = ?
                    AND u.role = 'Student'
                    AND u.status = 'Pending Approval'

                    LIMIT 1
                    `,
                    [userId]
                );

            if (rows.length === 0) {

                req.session.error_msg =
                    'Student registration not found or already processed.';

                return res.redirect(
                    '/patron/student-registrations'
                );

            }

            const student =
                rows[0];

            const rejected =
                await AdminApproval.reject(
                    student.student_id
                );

            if (!rejected) {

                req.session.error_msg =
                    'Student could not be rejected.';

                return res.redirect(
                    '/patron/student-registrations'
                );

            }

            req.session.success_msg =
                `${student.full_name}'s registration was rejected.`;

            return res.redirect(
                '/patron/student-registrations'
            );

        } catch (err) {

            console.error(
                'Reject student error:',
                err
            );

            return res.status(500).render(
                '500',
                {
                    error: err
                }
            );

        }

    },

    // =========================================================
    // PATRON MEMBERSHIP REQUESTS
    // GET /patron/membership-requests
    // =========================================================
    membershipRequests: async (req, res) => {
        try {
            const patron = req.patron;
            if (!patron || !patron.patron_id) {
                return res.render('patron/membership-requests', {
                    pageTitle: 'Membership Requests',
                    patron,
                    requests: []
                });
            }

            const clubs = await Patron.getAssignedClubs(patron.patron_id);
            const clubIds = clubs.map(c => c.club_id);

            const requests = await Patron.getPendingMemberships(clubIds);

            return res.render('patron/membership-requests', {
                pageTitle: 'Membership Requests',
                patron,
                requests
            });
        } catch (err) {
            console.error('Patron membership requests error:', err);
            return res.status(500).render('500', { error: err });
        }
    },

    // =========================================================
    // PATRON APPROVE MEMBERSHIP REQUEST
    // POST /patron/membership-requests/approve/:id
    // =========================================================
    approveMembershipRequest: async (req, res) => {
        try {
            const membershipId = parseInt(req.params.id, 10);
            if (!membershipId) {
                req.session.error_msg = 'Invalid membership request.';
                return res.redirect('/patron/membership-requests');
            }

            const [membership] = await db.query(
                `SELECT m.membership_id, m.student_id, m.club_id, m.status,
                        s.admission_no, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                        c.club_name
                 FROM memberships m
                 JOIN students s ON m.student_id = s.student_id
                 JOIN clubs c ON m.club_id = c.club_id
                 WHERE m.membership_id = ? AND m.status = 'Pending'
                 LIMIT 1`,
                [membershipId]
            );

            if (!membership) {
                req.session.error_msg = 'Membership request not found or already processed.';
                return res.redirect('/patron/membership-requests');
            }

            await db.query(
                `UPDATE memberships SET status = 'Active', approved_by = ?, approved_at = NOW() WHERE membership_id = ?`,
                [req.session.user.id, membershipId]
            );

            await Notification.create({
                user_id: membership.student_id,
                message: `Your membership request for ${membership.club_name} has been approved.`,
                type: 'Membership Approved',
                related_id: membershipId
            });

            req.session.success_msg = 'Membership request approved successfully.';
            return res.redirect('/patron/membership-requests');
        } catch (err) {
            console.error('Approve membership request error:', err);
            return res.status(500).render('500', { error: err });
        }
    },

    // =========================================================
    // PATRON REJECT MEMBERSHIP REQUEST
    // POST /patron/membership-requests/reject/:id
    // =========================================================
    rejectMembershipRequest: async (req, res) => {
        try {
            const membershipId = parseInt(req.params.id, 10);
            if (!membershipId) {
                req.session.error_msg = 'Invalid membership request.';
                return res.redirect('/patron/membership-requests');
            }

            const [membership] = await db.query(
                `SELECT m.membership_id, m.student_id, m.club_id, m.status,
                        s.admission_no, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                        c.club_name
                 FROM memberships m
                 JOIN students s ON m.student_id = s.student_id
                 JOIN clubs c ON m.club_id = c.club_id
                 WHERE m.membership_id = ? AND m.status = 'Pending'
                 LIMIT 1`,
                [membershipId]
            );

            if (!membership) {
                req.session.error_msg = 'Membership request not found or already processed.';
                return res.redirect('/patron/membership-requests');
            }

            await db.query(
                `UPDATE memberships SET status = 'Rejected', approved_by = ?, approved_at = NOW() WHERE membership_id = ?`,
                [req.session.user.id, membershipId]
            );

            await Notification.create({
                user_id: membership.student_id,
                message: `Your membership request for ${membership.club_name} was not approved. Please contact the patron for more information.`,
                type: 'Membership Rejected',
                related_id: membershipId
            });

            req.session.success_msg = 'Membership request rejected.';
            return res.redirect('/patron/membership-requests');
        } catch (err) {
            console.error('Reject membership request error:', err);
            return res.status(500).render('500', { error: err });
        }
    },

};
