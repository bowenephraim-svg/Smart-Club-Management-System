// controllers/electionController.js
const Election = require('../models/Election');
const Club = require('../models/Club');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const db = require('../config/db');

const isAdmin = (req) => req.session?.user?.role === 'Admin';

// ==========================================
// ADMIN: LIST ALL ELECTIONS
// ==========================================
exports.index = async (req, res) => {
    try {
        if (req.session?.user?.role === 'Student') {
            return res.redirect('/elections/available');
        }

        const [elections, stats] = await Promise.all([
            Election.getAll(),
            Election.getStats()
        ]);

        res.render('elections/index', {
            elections,
            stats,
            pageTitle: 'Elections'
        });
    } catch (err) {
        console.error('Election index error:', err.message);
        req.session.error_msg = 'Unable to load elections. Please try again.';
        res.redirect('/dashboard');
    }
};

// ==========================================
// ADMIN: CREATE FORM
// ==========================================
exports.renderCreateForm = async (req, res) => {
    try {
        const clubs = await Club.getAll();
        res.render('elections/form', {
            clubs,
            formData: {},
            isEdit: false,
            action: '/elections/create',
            submitLabel: 'Create Election',
            pageTitle: 'Create Election'
        });
    } catch (err) {
        console.error('Election create form error:', err.message);
        req.session.error_msg = 'Unable to load the election form.';
        res.redirect('/elections');
    }
};

// ==========================================
// ADMIN: CREATE
// ==========================================
const validateElectionInput = async (req, formData, isEdit = false) => {
    const errors = [];
    const clubId = parseInt(formData.club_id, 10);
    const title = (formData.title || '').trim();
    const description = (formData.description || '').trim();
    const electionDate = (formData.election_date || '').trim();
    const status = (formData.status || 'Upcoming').trim();

    if (!clubId) {
        errors.push('Please select a valid club.');
    } else {
        const club = await Club.getById(clubId);
        if (!club) errors.push('The selected club could not be found.');
    }

    if (!title) {
        errors.push('Election title is required.');
    } else if (title.length > 100) {
        errors.push('Election title must be 100 characters or less.');
    }

    if (!electionDate) {
        errors.push('Election date is required.');
    } else if (Number.isNaN(Date.parse(electionDate))) {
        errors.push('Please enter a valid election date.');
    }

    const validStatuses = ['Upcoming', 'Open', 'Closed'];
    if (!validStatuses.includes(status)) {
        errors.push('Please select a valid election status.');
    }

    if (description && description.length > 1000) {
        errors.push('Description must be 1000 characters or less.');
    }

    return {
        errors,
        values: {
            club_id: clubId || null,
            title,
            description,
            election_date: electionDate,
            status
        }
    };
};

exports.processCreate = async (req, res) => {
    try {
        const validation = await validateElectionInput(req, req.body);
        if (validation.errors.length > 0) {
            const clubs = await Club.getAll();
            req.session.error_msg = validation.errors.join(' ');
            return res.status(400).render('elections/form', {
                clubs,
                formData: { ...req.body, ...validation.values },
                isEdit: false,
                action: '/elections/create',
                submitLabel: 'Create Election',
                pageTitle: 'Create Election'
            });
        }

        const electionId = await Election.create(validation.values);

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Created election "${validation.values.title}" (ID: ${electionId})`]
        );

        // Notify admin
        const club = await Club.getById(validation.values.club_id);
        await Notification.create({
            user_id: req.session.user.id,
            message: `Election "${validation.values.title}" has been created for ${club?.club_name || 'the selected club'}.`,
            type: 'election_created',
            related_id: electionId
        });

        req.session.success_msg = 'Election created successfully.';
        res.redirect('/elections');
    } catch (err) {
        console.error('Election create error:', err.message);
        req.session.error_msg = 'Unable to create election. Please try again.';
        res.redirect('/elections/create');
    }
};

// ==========================================
// ADMIN: EDIT FORM
// ==========================================
exports.renderEditForm = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        if (!electionId) {
            req.session.error_msg = 'Invalid election selection.';
            return res.redirect('/elections');
        }

        const [election, clubs] = await Promise.all([
            Election.getById(electionId),
            Club.getAll()
        ]);

        if (!election) {
            req.session.error_msg = 'The selected election could not be found.';
            return res.redirect('/elections');
        }

        res.render('elections/form', {
            clubs,
            formData: election,
            isEdit: true,
            action: `/elections/edit/${electionId}`,
            submitLabel: 'Update Election',
            pageTitle: 'Edit Election',
            election
        });
    } catch (err) {
        console.error('Election edit form error:', err.message);
        req.session.error_msg = 'Unable to load the election edit form.';
        res.redirect('/elections');
    }
};

// ==========================================
// ADMIN: UPDATE
// ==========================================
exports.processEdit = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        if (!electionId) {
            req.session.error_msg = 'Invalid election selection.';
            return res.redirect('/elections');
        }

        const validation = await validateElectionInput(req, req.body, true);
        if (validation.errors.length > 0) {
            const clubs = await Club.getAll();
            req.session.error_msg = validation.errors.join(' ');
            return res.status(400).render('elections/form', {
                clubs,
                formData: { ...req.body, ...validation.values, election_id: electionId },
                isEdit: true,
                action: `/elections/edit/${electionId}`,
                submitLabel: 'Update Election',
                pageTitle: 'Edit Election',
                election: { election_id: electionId }
            });
        }

        const updated = await Election.update(electionId, validation.values);
        if (!updated) {
            req.session.error_msg = 'The election could not be updated.';
            return res.redirect('/elections');
        }

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Updated election "${validation.values.title}" (ID: ${electionId})`]
        );

        req.session.success_msg = 'Election updated successfully.';
        res.redirect('/elections');
    } catch (err) {
        console.error('Election update error:', err.message);
        req.session.error_msg = 'Unable to update election. Please try again.';
        res.redirect('/elections');
    }
};

// ==========================================
// ADMIN: VIEW ELECTION DETAILS
// ==========================================
exports.show = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        if (!electionId) {
            req.session.error_msg = 'Invalid election selection.';
            return res.redirect('/elections');
        }

        // Fetch the election first so we can safely derive its club_id
        const election = await Election.getById(electionId);
        if (!election) {
            req.session.error_msg = 'The election could not be found.';
            return res.redirect('/elections');
        }

        // Students should be redirected to the student-facing election view
        if (!isAdmin(req)) {
            return res.redirect(`/elections/vote/${electionId}`);
        }

        const [candidates, eligibleStudents, turnout] = await Promise.all([
            Election.getCandidates(electionId),
            Election.getEligibleStudents(election.club_id),
            Election.getVoterTurnout(electionId)
        ]);

        res.render('elections/show', {
            election,
            candidates,
            eligibleStudents,
            turnout,
            isAdminView: isAdmin(req)
        });
    } catch (err) {
        console.error('Election show error:', err.message);
        req.session.error_msg = 'Unable to load election details.';
        res.redirect('/elections');
    }
};

// ==========================================
// ADMIN: DELETE ELECTION
// ==========================================
exports.processDelete = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        if (!electionId) {
            req.session.error_msg = 'Invalid election selection.';
            return res.redirect('/elections');
        }

        const election = await Election.getById(electionId);
        if (!election) {
            req.session.error_msg = 'The election could not be found.';
            return res.redirect('/elections');
        }

        // Check for existing votes - do not delete elections with votes
        if (election.vote_count > 0) {
            req.session.error_msg = 'This election has recorded votes and cannot be deleted.';
            return res.redirect('/elections');
        }

        const deleted = await Election.delete(electionId);
        if (!deleted) {
            req.session.error_msg = 'The election could not be deleted.';
            return res.redirect('/elections');
        }

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Deleted election "${election.title}" (ID: ${electionId})`]
        );

        req.session.success_msg = 'Election deleted successfully.';
        res.redirect('/elections');
    } catch (err) {
        console.error('Election delete error:', err.message);
        req.session.error_msg = 'Unable to delete election. Please try again.';
        res.redirect('/elections');
    }
};

// ==========================================
// ADMIN: ACTIVATE ELECTION
// ==========================================
exports.activate = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        if (!electionId) {
            req.session.error_msg = 'Invalid election selection.';
            return res.redirect('/elections');
        }

        const election = await Election.getById(electionId);
        if (!election) {
            req.session.error_msg = 'The election could not be found.';
            return res.redirect('/elections');
        }

        // Prevent activating an election with no candidates
        if (election.candidate_count === 0) {
            req.session.error_msg = 'Cannot activate an election with no candidates. Please add candidates first.';
            return res.redirect(`/elections/${electionId}`);
        }

        const updated = await Election.updateStatus(electionId, 'Open');
        if (!updated) {
            req.session.error_msg = 'The election could not be activated.';
            return res.redirect(`/elections/${electionId}`);
        }

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Activated election "${election.title}" (ID: ${electionId})`]
        );

        // Notify admin
        await Notification.create({
            user_id: req.session.user.id,
            message: `Election "${election.title}" is now active. Students can now vote.`,
            type: 'election_opened',
            related_id: electionId
        });

        // Notify all registered students of the club
        const eligibleStudents = await Election.getEligibleStudents(election.club_id);
        for (const student of eligibleStudents) {
            const studentUser = await Student.getUserId(student.student_id);
            if (studentUser && studentUser.user_id) {
                await Notification.create({
                    user_id: studentUser.user_id,
                    message: `Election "${election.title}" for ${election.club_name} is now open. Cast your vote!`,
                    type: 'election_opened',
                    related_id: electionId
                });
            }
        }

        req.session.success_msg = 'Election activated successfully. Students can now vote.';
        res.redirect(`/elections/${electionId}`);
    } catch (err) {
        console.error('Election activate error:', err.message);
        req.session.error_msg = 'Unable to activate election. Please try again.';
        res.redirect('/elections');
    }
};

// ==========================================
// ADMIN: CLOSE ELECTION
// ==========================================
exports.close = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        if (!electionId) {
            req.session.error_msg = 'Invalid election selection.';
            return res.redirect('/elections');
        }

        const election = await Election.getById(electionId);
        if (!election) {
            req.session.error_msg = 'The election could not be found.';
            return res.redirect('/elections');
        }

        const updated = await Election.updateStatus(electionId, 'Closed');
        if (!updated) {
            req.session.error_msg = 'The election could not be closed.';
            return res.redirect(`/elections/${electionId}`);
        }

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Closed election "${election.title}" (ID: ${electionId})`]
        );

        // Notify admin
        await Notification.create({
            user_id: req.session.user.id,
            message: `Election "${election.title}" has been closed. Voting is no longer available.`,
            type: 'election_closed',
            related_id: electionId
        });

        // Notify eligible club members that results are available
        const eligibleStudents = await Election.getEligibleStudents(election.club_id);
        for (const student of eligibleStudents) {
            const studentUser = await Student.getUserId(student.student_id);
            if (studentUser && studentUser.user_id) {
                await Notification.create({
                    user_id: studentUser.user_id,
                    message: `Election "${election.title}" for ${election.club_name} has closed. Results are now available.`,
                    type: 'election_results',
                    related_id: electionId
                });
            }
        }

        req.session.success_msg = 'Election closed successfully. Voting is no longer available.';
        res.redirect(`/elections/${electionId}`);
    } catch (err) {
        console.error('Election close error:', err.message);
        req.session.error_msg = 'Unable to close election. Please try again.';
        res.redirect('/elections');
    }
};

// ==========================================
// ADMIN: RESULTS
// ==========================================
exports.results = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        if (!electionId) {
            req.session.error_msg = 'Invalid election selection.';
            return res.redirect('/elections');
        }

        const [election, results, turnout] = await Promise.all([
            Election.getById(electionId),
            Election.getResults(electionId),
            Election.getVoterTurnout(electionId)
        ]);

        if (!election) {
            req.session.error_msg = 'The election could not be found.';
            return res.redirect('/elections');
        }

        // Students may only view results for closed elections
        if (!isAdmin(req) && election.status !== 'Closed') {
            req.session.error_msg = 'Results are only available after the election has closed.';
            return res.redirect('/elections/available');
        }

        res.render('elections/results', {
            election,
            results,
            turnout,
            isAdminView: isAdmin(req)
        });
    } catch (err) {
        console.error('Election results error:', err.message);
        req.session.error_msg = 'Unable to load election results.';
        res.redirect('/elections');
    }
};

// ==========================================
// ADMIN: CANDIDATE MANAGEMENT
// ==========================================
exports.renderAddCandidate = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        if (!electionId) {
            req.session.error_msg = 'Invalid election selection.';
            return res.redirect('/elections');
        }

        const election = await Election.getById(electionId);
        if (!election) {
            req.session.error_msg = 'The election could not be found.';
            return res.redirect('/elections');
        }

        const eligibleStudents = await Election.getEligibleStudents(election.club_id || 0);

        res.render('elections/candidate_form', {
            election,
            eligibleStudents,
            formData: {},
            isEdit: false,
            action: `/elections/${electionId}/candidates/add`,
            submitLabel: 'Add Candidate',
            pageTitle: `Add Candidate | ${election.title}`
        });
    } catch (err) {
        console.error('Add candidate form error:', err.message);
        req.session.error_msg = 'Unable to load the candidate form.';
        res.redirect('/elections');
    }
};

exports.processAddCandidate = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        const studentId = parseInt(req.body.student_id, 10);
        const position = (req.body.position || '').trim();

        if (!electionId || !studentId) {
            req.session.error_msg = 'Please select a valid student.';
            return res.redirect(`/elections/${electionId || ''}/candidates/add`);
        }

        if (!position) {
            req.session.error_msg = 'Candidate position is required.';
            return res.redirect(`/elections/${electionId}/candidates/add`);
        }

        if (position.length > 50) {
            req.session.error_msg = 'Position must be 50 characters or less.';
            return res.redirect(`/elections/${electionId}/candidates/add`);
        }

        const result = await Election.addCandidate(electionId, studentId, position);
        if (!result.success) {
            req.session.error_msg = result.message;
            return res.redirect(`/elections/${electionId}/candidates/add`);
        }

        // Audit log
        const candidate = await Election.getCandidateById(result.candidateId);
        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Added candidate "${candidate?.candidate_name || 'Unknown'}" for position "${position}" to election ID ${electionId}`]
        );

        const election = await Election.getById(electionId);
        await Notification.create({
            user_id: req.session.user.id,
            message: `Candidate "${candidate?.candidate_name || 'Unknown'}" added for "${position}" in election "${election?.title || ''}".`,
            type: 'candidate_added',
            related_id: electionId
        });

        req.session.success_msg = 'Candidate added successfully.';
        res.redirect(`/elections/${electionId}`);
    } catch (err) {
        console.error('Add candidate error:', err.message);
        req.session.error_msg = 'Unable to add candidate. Please try again.';
        res.redirect(`/elections`);
    }
};

exports.renderEditCandidate = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        const candidateId = parseInt(req.params.candidate_id, 10);
        if (!electionId || !candidateId) {
            req.session.error_msg = 'Invalid candidate selection.';
            return res.redirect('/elections');
        }

        const [election, candidate] = await Promise.all([
            Election.getById(electionId),
            Election.getCandidateById(candidateId)
        ]);

        if (!election || !candidate) {
            req.session.error_msg = 'The election or candidate could not be found.';
            return res.redirect('/elections');
        }

        const eligibleStudents = await Election.getEligibleStudents(election.club_id || 0);

        res.render('elections/candidate_form', {
            election,
            eligibleStudents,
            formData: candidate,
            isEdit: true,
            action: `/elections/${electionId}/candidates/${candidateId}/edit`,
            submitLabel: 'Update Candidate',
            pageTitle: `Edit Candidate | ${election.title}`
        });
    } catch (err) {
        console.error('Edit candidate form error:', err.message);
        req.session.error_msg = 'Unable to load the candidate edit form.';
        res.redirect('/elections');
    }
};

exports.processEditCandidate = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        const candidateId = parseInt(req.params.candidate_id, 10);
        const studentId = parseInt(req.body.student_id, 10);
        const position = (req.body.position || '').trim();

        if (!electionId || !candidateId || !studentId) {
            req.session.error_msg = 'Invalid candidate selection.';
            return res.redirect(`/elections/${electionId || ''}`);
        }

        if (!position) {
            req.session.error_msg = 'Candidate position is required.';
            return res.redirect(`/elections/${electionId}/candidates/${candidateId}/edit`);
        }

        const updated = await Election.updateCandidate(candidateId, { student_id: studentId, position });
        if (!updated) {
            req.session.error_msg = 'The candidate could not be updated.';
            return res.redirect(`/elections/${electionId}`);
        }

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Updated candidate ID ${candidateId} in election ID ${electionId}`]
        );

        req.session.success_msg = 'Candidate updated successfully.';
        res.redirect(`/elections/${electionId}`);
    } catch (err) {
        console.error('Edit candidate error:', err.message);
        req.session.error_msg = 'Unable to update candidate. Please try again.';
        res.redirect('/elections');
    }
};

exports.processRemoveCandidate = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        const candidateId = parseInt(req.params.candidate_id, 10);
        if (!electionId || !candidateId) {
            req.session.error_msg = 'Invalid candidate selection.';
            return res.redirect('/elections');
        }

        const candidate = await Election.getCandidateById(candidateId);
        const removed = await Election.removeCandidate(candidateId);
        if (!removed) {
            req.session.error_msg = 'The candidate could not be removed.';
            return res.redirect(`/elections/${electionId}`);
        }

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Removed candidate "${candidate?.candidate_name || 'Unknown'}" from election ID ${electionId}`]
        );

        req.session.success_msg = 'Candidate removed successfully.';
        res.redirect(`/elections/${electionId}`);
    } catch (err) {
        console.error('Remove candidate error:', err.message);
        req.session.error_msg = 'Unable to remove candidate. Please try again.';
        res.redirect('/elections');
    }
};

// ==========================================
// STUDENT: AVAILABLE ELECTIONS
// ==========================================
exports.studentElections = async (req, res) => {
    try {
        const userId =
            req.session.user.user_id ??
            req.session.user.id;

        const student = await Student.getByUserId(userId);

        // Non-student roles should see a graceful empty state
        if (!student) {
            return res.render('elections/student_elections', {
                activeElections: [],
                allElections: [],
                student: null,
                votedElectionIds: [],
                notStudent: true,
                pageTitle: 'Student Elections'
            });
        }

        const [
            activeElections,
            allElections,
            votedElectionIds
        ] = await Promise.all([
            Election.getActiveElectionsForStudent(
                student.student_id
            ),
            Election.getElectionsForStudent(
                student.student_id
            ),
            Election.getVotedElectionIds(
                student.student_id
            )
        ]);

        res.render('elections/student_elections', {
            activeElections,
            allElections,
            student,
            votedElectionIds,
            notStudent: false,
            pageTitle: 'Student Elections'
        });

    } catch (err) {
        console.error(
            'Student elections error:',
            err
        );

        res.status(500).send(
            'Unable to load elections: ' +
            err.message
        );
    }
};
// ==========================================
// STUDENT: VOTE PAGE
// ==========================================
exports.studentVote = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        if (!electionId) {
            req.session.error_msg = 'Invalid election selection.';
            return res.redirect('/elections/available');
        }

        const userId =
          req.session.user.user_id ??
          req.session.user.id;

         const student = await Student.getByUserId(userId);

        if (!student) {
            req.session.error_msg = 'Student profile not found.';
            return res.redirect('/elections/available');
        }

        const [election, candidates] = await Promise.all([
            Election.getById(electionId),
            Election.getCandidates(electionId)
        ]);

        if (!election) {
            req.session.error_msg = 'The election could not be found.';
            return res.redirect('/elections/available');
        }

        if (election.status !== 'Open') {
            req.session.error_msg = 'Voting is not currently open for this election.';
            return res.redirect('/elections/available');
        }

        const eligible = await Election.isEligibleVoter(student.student_id, election.club_id);
        if (!eligible) {
            req.session.error_msg = 'You are not eligible to vote in this election. Active club membership is required.';
            return res.redirect('/elections/available');
        }

        // Check if student already voted
        const hasVoted = await Election.hasStudentVoted(electionId, student.student_id);
        if (hasVoted) {
            req.session.error_msg = 'You have already voted in this election.';
            return res.redirect('/elections/available');
        }

        res.render('elections/vote', {
            election,
            candidates,
            student,
            pageTitle: `Vote | ${election.title}`
        });
    } catch (err) {
        console.error('Student vote page error:', err.message);
        res.status(500).send('Unable to load the voting page: ' + err.message);
    }
};

// ==========================================
// STUDENT: SUBMIT VOTE
// ==========================================
exports.processStudentVote = async (req, res) => {
    try {
        const electionId = parseInt(req.params.id, 10);
        const candidateId = parseInt(req.body.candidate_id, 10);
        if (!electionId || !candidateId) {
            req.session.error_msg = 'Please select a candidate to vote for.';
            return res.redirect('/elections/available');
        }

        const userId =
    req.session.user.user_id ??
    req.session.user.id;

              const student = await Student.getByUserId(userId);

        if (!student) {
            req.session.error_msg = 'Student profile not found.';
            return res.redirect('/elections/available');
        }

        // Use the authenticated student_id from session — never trust client input
        const result = await Election.castVote(electionId, candidateId, student.student_id);

        if (!result.success) {
            req.session.error_msg = result.message;
            return res.redirect(`/elections/vote/${electionId}`);
        }

        // Audit log for the vote
        const election = await Election.getById(electionId);
        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [userId, `Cast vote in election "${election?.title || electionId}" (ID: ${electionId})`]
        );

        // Notify the student that their vote was recorded
        await Notification.create({
            user_id: userId,
            message: `Your vote in "${election?.title || 'the election'}" has been recorded successfully.`,
            type: 'vote_cast',
            related_id: electionId
        });

        // Fetch the candidate for the confirmation page
        const candidate = await Election.getCandidateById(candidateId);

        req.session.success_msg = 'Your vote has been cast successfully. Thank you for participating!';
        res.render('elections/vote_confirmation', {
            election,
            candidate,
            pageTitle: 'Vote Confirmation'
        });
    } catch (err) {
        console.error('Submit vote error:', err.message);
        req.session.error_msg = 'Unable to cast your vote. Please try again.';
        res.redirect('/elections/available');
    }
};

module.exports = exports;