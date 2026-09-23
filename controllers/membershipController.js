// controllers/membershipController.js

const Membership = require('../models/Membership');
const Club = require('../models/Club');
const Notification = require('../models/Notification');
const Patron = require('../models/Patron');
const db = require('../config/db');

module.exports = {

    // =====================================================
    // ADMIN: GET ALL MEMBERSHIPS
    // ADMIN CAN ONLY VIEW
    // =====================================================

    getAllMemberships: async (req, res) => {

        try {

            if (req.session?.user?.role === 'Patron') {
                return res.redirect('/patron/members');
            }

            const memberships = await Membership.getAll();

            res.render('memberships/index', {
                memberships
            });

        } catch (err) {

            console.error(
                'Get memberships error:',
                err
            );

            res.status(500).send(
                'Unable to load memberships: ' +
                err.message
            );

        }

    },


    // =====================================================
    // ADMIN: ADD MEMBERSHIP FORM
    // =====================================================

    renderAddForm: async (req, res) => {

        try {

            const [students] = await db.query(`
                SELECT
                    student_id,
                    admission_no,
                    first_name,
                    last_name
                FROM students
                ORDER BY last_name ASC
            `);

            const clubs = await Club.getAll();

            const selectedClubId =
                req.query.club_id || '';

            res.render('memberships/add', {
                students,
                clubs,
                selectedClubId,
                error: null
            });

        } catch (err) {

            console.error(
                'Membership form error:',
                err
            );

            res.status(500).send(
                'Failed to load membership form: ' +
                err.message
            );

        }

    },


    // =====================================================
    // ADMIN: ADD MEMBERSHIP
    // =====================================================

    processAdd: async (req, res) => {

        try {

            await Membership.create({

                student_id:
                    req.body.student_id,

                club_id:
                    req.body.club_id,

                role:
                    req.body.role,

                join_date:
                    req.body.join_date,

                status:
                    'Active'

            });

            res.redirect('/memberships');

        } catch (err) {

            console.error(
                'Admin membership creation error:',
                err
            );

            res.status(500).send(
                err.message
            );

        }

    },


    // =====================================================
    // STUDENT: AVAILABLE CLUBS
    // =====================================================

    availableClubs: async (req, res) => {

        try {

            if (!req.session.user) {
                return res.redirect('/auth/login');
            }

            const userId =
                req.session.user.id;

            const [students] = await db.query(
                `
                SELECT *
                FROM students
                WHERE user_id = ?
                `,
                [userId]
            );

            if (students.length === 0) {

                return res.status(404).send(
                    'Student profile not found.'
                );

            }

            const student = students[0];

            const clubs =
                await Membership.getAvailableClubs(
                    student.student_id
                );

            res.render(
                'students/available-clubs',
                {
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
                'Unable to load available clubs: ' +
                err.message
            );

        }

    },


    // =====================================================
    // STUDENT: JOIN CLUB
    // =====================================================

    joinClub: async (req, res) => {

        try {

            if (!req.session.user) {
                return res.redirect('/auth/login');
            }

            const userId =
                req.session.user.id;

            const clubId =
                parseInt(
                    req.params.clubId,
                    10
                );

            if (!clubId) {

                req.session.error_msg =
                    'Invalid club selection.';

                return res.redirect(
                    '/student/clubs/available'
                );

            }


            // ==========================================
            // GET STUDENT
            // ==========================================

            const [students] =
                await db.query(
                    `
                    SELECT *
                    FROM students
                    WHERE user_id = ?
                    `,
                    [userId]
                );

            if (students.length === 0) {

                return res.status(404).send(
                    'Student profile not found.'
                );

            }

            const student =
                students[0];


            // ==========================================
            // GET CLUB
            // ==========================================

            const [clubs] =
                await db.query(
                    `
                    SELECT
                        c.*,
                        p.patron_id,
                        p.user_id AS patron_user_id,
                        p.full_name AS patron_name
                    FROM clubs c
                    LEFT JOIN patrons p
                        ON c.patron_id = p.patron_id
                    WHERE c.club_id = ?
                    `,
                    [clubId]
                );

            if (clubs.length === 0) {

                req.session.error_msg =
                    'The selected club does not exist.';

                return res.redirect(
                    '/student/clubs/available'
                );

            }

            const club = clubs[0];


            // ==========================================
            // CHECK EXISTING MEMBERSHIP
            // ==========================================

            const exists =
                await Membership.alreadyJoined(
                    student.student_id,
                    clubId
                );

            if (exists) {

                req.session.error_msg =
                    'You already have a membership request for this club.';

                return res.redirect(
                    '/student/clubs'
                );

            }


            // ==========================================
            // CREATE PENDING MEMBERSHIP
            // ==========================================

            const membershipId =
                await Membership.create({

                    student_id:
                        student.student_id,

                    club_id:
                        clubId,

                    join_date:
                        new Date(),

                    status:
                        'Pending'

                });


            // ==========================================
            // NOTIFY ONLY THE CLUB'S PATRON
            // ==========================================

            if (club.patron_user_id) {

                await Notification.create({

                    user_id:
                        club.patron_user_id,

                    message:
                        `${student.first_name} ${student.last_name} (${student.admission_no}) has requested to join ${club.club_name}.`,

                    type:
                        'membership_pending',

                    related_id:
                        membershipId

                });

            } else {

                console.warn(
                    `Club ${club.club_name} has no assigned patron.`
                );

            }


            // ==========================================
            // STUDENT SUCCESS MESSAGE
            // ==========================================

            req.session.success_msg =
                `Your request to join ${club.club_name} has been submitted. The club patron will review your request.`;


            return res.redirect(
                '/student/clubs'
            );


        } catch (err) {

            console.error(
                'Join club error:',
                err
            );

            req.session.error_msg =
                err.message ||
                'Unable to submit club membership request.';

            return res.redirect(
                '/student/clubs/available'
            );

        }

    },


    // =====================================================
    // STUDENT: MY CLUBS
    // =====================================================

    myClubs: async (req, res) => {

        try {

            if (!req.session.user) {
                return res.redirect('/auth/login');
            }

            const userId =
                req.session.user.id;

            const [students] =
                await db.query(
                    `
                    SELECT *
                    FROM students
                    WHERE user_id = ?
                    `,
                    [userId]
                );

            if (students.length === 0) {

                return res.status(404).send(
                    'Student profile not found.'
                );

            }

            const student =
                students[0];

            const memberships =
                await Membership.getByStudent(
                    student.student_id
                );

            res.render(
                'students/my-clubs',
                {
                    student,
                    memberships
                }
            );

        } catch (err) {

            console.error(
                'My clubs error:',
                err
            );

            res.status(500).send(
                'Unable to load your clubs: ' +
                err.message
            );

        }

    },


    // =====================================================
    // PATRON: PENDING REQUESTS
    // ONLY REQUESTS FROM PATRON'S CLUBS
    // =====================================================

    pendingRequests: async (req, res) => {

        try {

            const patron = req.patron;

            if (!patron || !patron.patron_id) {

                return res.status(403).send(
                    'Patron profile not found.'
                );

            }

            const requests =
                await Membership.getPendingForPatron(
                    patron.patron_id
                );

            res.render(
                'memberships/requests',
                {
                    requests
                }
            );

        } catch (err) {

            console.error(
                'Patron pending memberships error:',
                err
            );

            res.status(500).send(
                'Unable to load membership requests: ' +
                err.message
            );

        }

    },


    // =====================================================
    // PATRON: APPROVE MEMBERSHIP
    // =====================================================

    approveMembership: async (req, res) => {

        try {

            const membershipId =
                req.params.id;

            const patron =
                req.patron;

            if (!patron || !patron.patron_id) {

                return res.status(403).send(
                    'Patron profile not found.'
                );

            }


            // ==========================================
            // VERIFY REQUEST BELONGS TO PATRON'S CLUB
            // ==========================================

            const membership =
                await Membership.getPendingForPatronById(
                    membershipId,
                    patron.patron_id
                );

            if (!membership) {

                return res.status(403).send(
                    'You are not authorized to approve this membership request.'
                );

            }


            // ==========================================
            // APPROVE
            // ==========================================

            const approved =
                await Membership.approve(
                    membershipId,
                    req.session.user.id
                );

            if (!approved) {

                req.session.error_msg =
                    'Membership request could not be approved.';

                return res.redirect(
                    '/patron/members'
                );

            }


            // ==========================================
            // NOTIFY STUDENT
            // ==========================================

            await Notification.create({

                user_id:
                    membership.student_user_id,

                message:
                    `Your membership request for ${membership.club_name} has been approved by the club patron.`,

                type:
                    'membership_approved',

                related_id:
                    membership.membership_id

            });


            req.session.success_msg =
                `${membership.student_name} has been approved to join ${membership.club_name}.`;

            return res.redirect(
                '/patron/members'
            );


        } catch (err) {

            console.error(
                'Approve membership error:',
                err
            );

            res.status(500).send(
                err.message
            );

        }

    },


    // =====================================================
    // PATRON: REJECT MEMBERSHIP
    // =====================================================

    rejectMembership: async (req, res) => {

        try {

            const membershipId =
                req.params.id;

            const patron =
                req.patron;

            if (!patron || !patron.patron_id) {

                return res.status(403).send(
                    'Patron profile not found.'
                );

            }


            // ==========================================
            // VERIFY REQUEST BELONGS TO PATRON'S CLUB
            // ==========================================

            const membership =
                await Membership.getPendingForPatronById(
                    membershipId,
                    patron.patron_id
                );

            if (!membership) {

                return res.status(403).send(
                    'You are not authorized to reject this membership request.'
                );

            }


            // ==========================================
            // REJECT
            // ==========================================

            const rejected =
                await Membership.reject(
                    membershipId,
                    req.session.user.id
                );

            if (!rejected) {

                req.session.error_msg =
                    'Membership request could not be rejected.';

                return res.redirect(
                    '/patron/members'
                );

            }


            // ==========================================
            // NOTIFY STUDENT
            // ==========================================

            await Notification.create({

                user_id:
                    membership.student_user_id,

                message:
                    `Your membership request for ${membership.club_name} was not approved by the club patron.`,

                type:
                    'membership_rejected',

                related_id:
                    membership.membership_id

            });


            req.session.success_msg =
                `Membership request for ${membership.club_name} has been rejected.`;

            return res.redirect(
                '/patron/members'
            );


        } catch (err) {

            console.error(
                'Reject membership error:',
                err
            );

            res.status(500).send(
                err.message
            );

        }

    },


    // =====================================================
    // ADMIN: UPDATE ROLE
    // =====================================================

    processUpdateRole: async (req, res) => {

        try {

            const { role } =
                req.body;

            await Membership.updateRole(
                req.params.id,
                role
            );

            res.redirect(
                '/memberships'
            );

        } catch (err) {

            res.status(500).send(
                err.message
            );

        }

    },


    // =====================================================
    // ADMIN: DELETE
    // =====================================================

    processDelete: async (req, res) => {

        try {

            await Membership.delete(
                req.params.id
            );

            res.redirect(
                '/memberships'
            );

        } catch (err) {

            res.status(500).send(
                err.message
            );

        }

    }

};