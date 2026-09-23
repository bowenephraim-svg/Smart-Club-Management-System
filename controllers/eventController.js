// controllers/eventController.js
const Event = require('../models/Event');
const Club = require('../models/Club');
const Notification = require('../models/Notification');
const Patron = require('../models/Patron');
const db = require('../config/db');

exports.index = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        const filter = req.query.filter || 'all';
        const sort = req.query.sort || 'upcoming';
        const page = parseInt(req.query.page, 10) || 1;

        const patronCtx = await Patron.getPatronContext(req);
        const scopedClubIds = patronCtx.isPatron ? patronCtx.clubIds : null;

        const [summary, result] = await Promise.all([
            Event.getSummaryCounts(scopedClubIds),
            Event.getPaginated({ search, status: filter, sort, page, limit: 10, club_ids: scopedClubIds })
        ]);

        res.render('events/index', {
            events: result.events,
            summary,
            filters: { search, filter, sort },
            pagination: result.pagination
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load events: ' + err.message);
    }
};

exports.renderAddForm = async (req, res) => {
    try {
        const patronCtx = await Patron.getPatronContext(req);
        const clubs = patronCtx.isPatron ? patronCtx.clubs : await Club.getAll();

        res.render('events/add', {
            clubs,
            formData: {},
            isEdit: false,
            action: '/events/add',
            submitLabel: 'Create Event',
            pageTitle: 'Create Event'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load event form: ' + err.message);
    }
};

exports.renderEditForm = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (!eventId) {
            req.session.error_msg = 'Invalid event selection.';
            return res.redirect('/events');
        }

        const patronCtx = await Patron.getPatronContext(req);
        const event = await Event.getById(eventId);

        if (!event) {
            req.session.error_msg = 'The selected event could not be found.';
            return res.redirect('/events');
        }

        if (patronCtx.isPatron && !patronCtx.clubIds.includes(event.club_id)) {
            req.session.error_msg = 'Access denied. You can only edit events for your assigned clubs.';
            return res.redirect('/events');
        }

        const clubs = patronCtx.isPatron ? patronCtx.clubs : await Club.getAll();

        res.render('events/edit', {
            event,
            clubs,
            formData: event,
            isEdit: true,
            action: `/events/edit/${eventId}`,
            submitLabel: 'Update Event',
            pageTitle: 'Edit Event'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load event form: ' + err.message);
    }
};

const validateEventInput = async (req, formData, isEdit = false) => {
    const errors = [];
    const clubId = parseInt(formData.club_id, 10);
    const title = (formData.title || '').trim();
    const description = (formData.description || '').trim();
    const eventDate = (formData.event_date || '').trim();
    const venue = (formData.venue || '').trim();

    if (!clubId && clubId !== 0) {
        errors.push('Please select a valid club.');
    } else if (clubId) {
        const club = await Club.getById(clubId);
        if (!club) errors.push('The selected club could not be found.');
    }

    if (!title) {
        errors.push('Event title is required.');
    } else if (title.length > 150) {
        errors.push('Event title must be 150 characters or less.');
    }

    if (!eventDate) {
        errors.push('Event date is required.');
    } else if (Number.isNaN(Date.parse(eventDate))) {
        errors.push('Please enter a valid event date.');
    }

    if (venue && venue.length > 150) {
        errors.push('Venue must be 150 characters or less.');
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
            event_date: eventDate,
            venue: venue || null
        }
    };
};

exports.processAdd = async (req, res) => {
    try {
        const validation = await validateEventInput(req, req.body, false);
        if (validation.errors.length > 0) {
            const patronCtx = await Patron.getPatronContext(req);
            const clubs = patronCtx.isPatron ? patronCtx.clubs : await Club.getAll();
            req.session.error_msg = validation.errors.join(' ');
            return res.status(400).render('events/add', {
                clubs,
                formData: { ...req.body, ...validation.values },
                isEdit: false,
                action: '/events/add',
                submitLabel: 'Create Event',
                pageTitle: 'Create Event'
            });
        }

        if (!await Patron.canManageClub(req, validation.values.club_id)) {
            req.session.error_msg = 'You can only manage events for your assigned clubs.';
            return res.redirect('/events/add');
        }

        const eventId = await Event.create({
            ...validation.values,
            created_by: req.session.user.id
        });

        const club = await Club.getById(validation.values.club_id);

        await Notification.create({
            user_id: req.session.user?.id || 1,
            message: `New event "${validation.values.title}" has been created for ${club?.club_name || 'the selected club'}.`,
            type: 'event_created',
            related_id: eventId
        });

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Created event ID ${eventId}: "${validation.values.title}"`]
        );

        req.session.success_msg = 'Event created successfully.';
        res.redirect('/events');
    } catch (err) {
        console.error(err);
        req.session.error_msg = 'Unable to add event. Please try again.';
        res.redirect('/events/add');
    }
};

exports.processEdit = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (!eventId) {
            req.session.error_msg = 'Invalid event selection.';
            return res.redirect('/events');
        }

        const validation = await validateEventInput(req, req.body, true);
        if (validation.errors.length > 0) {
            const clubs = await Club.getAll();
            req.session.error_msg = validation.errors.join(' ');
            return res.status(400).render('events/edit', {
                event: { activity_id: eventId },
                clubs,
                formData: { ...req.body, ...validation.values },
                isEdit: true,
                action: `/events/edit/${eventId}`,
                submitLabel: 'Update Event',
                pageTitle: 'Edit Event'
            });
        }

        const existingEvent = await Event.getById(eventId);
        if (!existingEvent || !await Patron.canManageClub(req, validation.values.club_id)) {
            req.session.error_msg = 'You can only manage events for your assigned clubs.';
            return res.redirect('/events');
        }

        const updated = await Event.update(eventId, validation.values);
        if (!updated) {
            req.session.error_msg = 'The event could not be updated.';
            return res.redirect('/events');
        }

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Updated event ID ${eventId}: "${validation.values.title}"`]
        );

        req.session.success_msg = 'Event updated successfully.';
        res.redirect('/events');
    } catch (err) {
        console.error(err);
        req.session.error_msg = 'Unable to update event. Please try again.';
        res.redirect('/events');
    }
};

exports.processDelete = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (!eventId) {
            req.session.error_msg = 'Invalid event selection.';
            return res.redirect('/events');
        }

        const event = await Event.getById(eventId);
        if (!event) {
            req.session.error_msg = 'The event could not be found.';
            return res.redirect('/events');
        }

        const hasAttendance = await Event.hasAttendance(eventId);
        if (hasAttendance) {
            req.session.error_msg = 'Cannot delete this event because it has attendance records.';
            return res.redirect('/events');
        }

        const deleted = await Event.delete(eventId);
        if (!deleted) {
            req.session.error_msg = 'The event could not be deleted.';
            return res.redirect('/events');
        }

        await db.query(
            'INSERT INTO audit_logs (user_id, action) VALUES (?, ?)',
            [req.session.user.id, `Deleted event ID ${eventId}: "${event.title}"`]
        );

        req.session.success_msg = 'Event deleted successfully.';
        res.redirect('/events');
    } catch (err) {
        console.error(err);
        req.session.error_msg = 'Unable to delete event. Please try again.';
        res.redirect('/events');
    }
};

exports.showDetails = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        if (!eventId) {
            req.session.error_msg = 'Invalid event selection.';
            return res.redirect('/events');
        }

        const event = await Event.getById(eventId);
        if (!event) {
            req.session.error_msg = 'The selected event could not be found.';
            return res.redirect('/events');
        }

        const attendanceCount = await Event.getAttendanceCount(eventId);

        res.render('events/details', {
            event,
            attendanceCount,
            pageTitle: event.title
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load event details: ' + err.message);
    }
};
