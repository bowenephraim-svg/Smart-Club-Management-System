const Activity = require('../models/Activity');
const Club = require('../models/Club');
const Notification = require('../models/Notification');
const Patron = require('../models/Patron');

exports.index = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        const filter = req.query.filter || 'all';
        const sort = req.query.sort || 'upcoming';
        const page = parseInt(req.query.page, 10) || 1;

        const patronCtx = await Patron.getPatronContext(req);
        const scopedClubIds = patronCtx.isPatron ? patronCtx.clubIds : null;

        const [summary, result] = await Promise.all([
            Activity.getSummaryCounts(scopedClubIds),
            Activity.getPaginated({ search, status: filter, sort, page, limit: 10, club_ids: scopedClubIds })
        ]);

        res.render('activities/index', {
            activities: result.activities,
            summary,
            filters: { search, filter, sort },
            pagination: result.pagination
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load activities: ' + err.message);
    }
};

exports.renderAddForm = async (req, res) => {
    try {
        const patronCtx = await Patron.getPatronContext(req);
        const clubs = patronCtx.isPatron ? patronCtx.clubs : await Club.getAll();

        res.render('activities/add', {
            clubs,
            formData: {},
            isEdit: false,
            action: '/activities/add',
            submitLabel: 'Create Activity',
            pageTitle: 'Create Activity'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load activity form: ' + err.message);
    }
};

exports.renderEditForm = async (req, res) => {
    try {
        const activityId = parseInt(req.params.id, 10);
        if (!activityId) {
            req.session.error_msg = 'Invalid activity selection.';
            return res.redirect('/activities');
        }

        const patronCtx = await Patron.getPatronContext(req);
        const activity = await Activity.getById(activityId);

        if (!activity) {
            req.session.error_msg = 'The selected activity could not be found.';
            return res.redirect('/activities');
        }

        if (patronCtx.isPatron && !patronCtx.clubIds.includes(activity.club_id)) {
            req.session.error_msg = 'Access denied. You can only edit activities for your assigned clubs.';
            return res.redirect('/activities');
        }

        const clubs = patronCtx.isPatron ? patronCtx.clubs : await Club.getAll();

        res.render('activities/add', {
            clubs,
            formData: activity,
            isEdit: true,
            action: `/activities/edit/${activityId}`,
            submitLabel: 'Update Activity',
            pageTitle: 'Edit Activity',
            activity
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load activity form: ' + err.message);
    }
};

const validateActivityInput = async (req, formData, isEdit = false) => {
    const errors = [];
    const clubId = parseInt(formData.club_id, 10);
    const activityName = (formData.activity_name || '').trim();
    const description = (formData.description || '').trim();
    const activityDate = (formData.activity_date || '').trim();
    const venue = (formData.venue || '').trim();

    if (!clubId) {
        errors.push('Please select a valid club.');
    } else {
        const club = await Club.getById(clubId);
        if (!club) errors.push('The selected club could not be found.');
    }

    if (!activityName) {
        errors.push('Activity name is required.');
    } else if (activityName.length > 100) {
        errors.push('Activity name must be 100 characters or less.');
    }

    if (!activityDate) {
        errors.push('Activity date is required.');
    } else if (Number.isNaN(Date.parse(activityDate))) {
        errors.push('Please enter a valid activity date.');
    }

    if (!venue) {
        errors.push('Venue is required.');
    } else if (venue.length > 100) {
        errors.push('Venue must be 100 characters or less.');
    }

    if (description && description.length > 1000) {
        errors.push('Description must be 1000 characters or less.');
    }

    return { errors, values: { club_id: clubId || null, activity_name: activityName, description, activity_date: activityDate, venue } };
};

exports.processAdd = async (req, res) => {
    try {
        const validation = await validateActivityInput(req, req.body, false);
        if (validation.errors.length > 0) {
            const patronCtx = await Patron.getPatronContext(req);
            const clubs = patronCtx.isPatron ? patronCtx.clubs : await Club.getAll();
            req.session.error_msg = validation.errors.join(' ');
            return res.status(400).render('activities/add', {
                clubs,
                formData: { ...req.body, ...validation.values },
                isEdit: false,
                action: '/activities/add',
                submitLabel: 'Create Activity',
                pageTitle: 'Create Activity'
            });
        }

        if (!await Patron.canManageClub(req, validation.values.club_id)) {
            req.session.error_msg = 'You can only manage activities for your assigned clubs.';
            return res.redirect('/activities/add');
        }

        const activityId = await Activity.create(validation.values);
        const club = await Club.getById(validation.values.club_id);

        await Notification.create({
            user_id: req.session.user?.id || 1,
            message: `New activity "${validation.values.activity_name}" has been created for ${club?.club_name || 'the selected club'}.`,
            type: 'activity_created',
            related_id: activityId
        });

        req.session.success_msg = 'Activity created successfully.';
        res.redirect('/activities');
    } catch (err) {
        console.error(err);
        req.session.error_msg = 'Unable to add activity. Please try again.';
        res.redirect('/activities/add');
    }
};

exports.processEdit = async (req, res) => {
    try {
        const activityId = parseInt(req.params.id, 10);
        if (!activityId) {
            req.session.error_msg = 'Invalid activity selection.';
            return res.redirect('/activities');
        }

        const validation = await validateActivityInput(req, req.body, true);
        if (validation.errors.length > 0) {
            const clubs = await Club.getAll();
            req.session.error_msg = validation.errors.join(' ');
            return res.status(400).render('activities/add', {
                clubs,
                formData: { ...req.body, ...validation.values, activity_id: activityId },
                isEdit: true,
                action: `/activities/edit/${activityId}`,
                submitLabel: 'Update Activity',
                pageTitle: 'Edit Activity',
                activity: { activity_id: activityId }
            });
        }

        const existingActivity = await Activity.getById(activityId);
        if (!existingActivity || !await Patron.canManageClub(req, validation.values.club_id)) {
            req.session.error_msg = 'You can only manage activities for your assigned clubs.';
            return res.redirect('/activities');
        }

        const updated = await Activity.update(activityId, validation.values);
        if (!updated) {
            req.session.error_msg = 'The activity could not be updated.';
            return res.redirect('/activities');
        }

        req.session.success_msg = 'Activity updated successfully.';
        res.redirect('/activities');
    } catch (err) {
        console.error(err);
        req.session.error_msg = 'Unable to update activity. Please try again.';
        res.redirect('/activities');
    }
};

exports.processDelete = async (req, res) => {
    try {
        const activityId = parseInt(req.params.id, 10);
        if (!activityId) {
            req.session.error_msg = 'Invalid activity selection.';
            return res.redirect('/activities');
        }

        const deleted = await Activity.delete(activityId);
        if (!deleted) {
            req.session.error_msg = 'The activity could not be deleted.';
            return res.redirect('/activities');
        }

        req.session.success_msg = 'Activity deleted successfully.';
        res.redirect('/activities');
    } catch (err) {
        console.error(err);
        req.session.error_msg = 'Unable to delete activity. Please try again.';
        res.redirect('/activities');
    }
};

exports.showDetails = async (req, res) => {
    try {
        const activityId = parseInt(req.params.id, 10);
        if (!activityId) {
            req.session.error_msg = 'Invalid activity selection.';
            return res.redirect('/activities');
        }

        const [activity, registrations, attendanceSummary, eligibleStudents] = await Promise.all([
            Activity.getById(activityId),
            Activity.getRegistrations(activityId),
            Activity.getAttendanceSummary(activityId),
            activityId ? Activity.getEligibleStudentsForClub((await Activity.getById(activityId))?.club_id) : []
        ]);

        if (!activity) {
            req.session.error_msg = 'The selected activity could not be found.';
            return res.redirect('/activities');
        }

        res.render('activities/details', {
            activity,
            registrations,
            attendanceSummary,
            eligibleStudents
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load activity details: ' + err.message);
    }
};

exports.registerStudent = async (req, res) => {
    try {
        const activityId = parseInt(req.params.id, 10);
        const studentId = parseInt(req.body.student_id, 10);
        if (!activityId || !studentId) {
            req.session.error_msg = 'Please select a valid student and activity.';
            return res.redirect('/activities');
        }

        const activity = await Activity.getById(activityId);
        if (!activity) {
            req.session.error_msg = 'The selected activity could not be found.';
            return res.redirect('/activities');
        }

        const result = await Activity.registerStudent(activityId, studentId);
        if (!result.success) {
            req.session.error_msg = result.message;
        } else {
            req.session.success_msg = 'Student registered successfully.';
        }

        res.redirect(`/activities/${activityId}`);
    } catch (err) {
        console.error(err);
        req.session.error_msg = 'Unable to register the student. Please try again.';
        res.redirect('/activities');
    }
};

exports.removeRegistration = async (req, res) => {
    try {
        const activityId = parseInt(req.params.id, 10);
        const registrationId = parseInt(req.params.registration_id, 10);
        if (!activityId || !registrationId) {
            req.session.error_msg = 'Invalid registration selection.';
            return res.redirect('/activities');
        }

        const removed = await Activity.removeRegistration(registrationId);
        if (!removed) {
            req.session.error_msg = 'The registration could not be removed.';
            return res.redirect(`/activities/${activityId}`);
        }

        req.session.success_msg = 'Registration removed successfully.';
        res.redirect(`/activities/${activityId}`);
    } catch (err) {
        console.error(err);
        req.session.error_msg = 'Unable to remove the registration. Please try again.';
        res.redirect('/activities');
    }
};
