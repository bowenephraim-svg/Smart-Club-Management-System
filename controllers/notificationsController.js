const Notification = require('../models/Notification');
const User = require('../models/User');

// ==========================================
// LIST ALL NOTIFICATIONS (ADMIN)
// ==========================================
exports.index = async (req, res) => {
    try {

        const notifications = await Notification.getAll();

        res.render('notifications/index', {
            notifications
        });

    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// ==========================================
// USER NOTIFICATIONS (NOTIFICATION CENTER)
// ==========================================
exports.myNotifications = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const notifications = await Notification.getByUser(userId);

        const unread = await Notification.unreadCount(userId);

        res.render('notifications/my-notifications', {
            notifications,
            unread
        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// ==========================================
// CREATE PAGE
// ==========================================
exports.renderCreate = async (req, res) => {

    try {

        const users = await User.getAll();

        res.render('notifications/create', {
            users
        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// ==========================================
// CREATE
// ==========================================
exports.create = async (req, res) => {

    try {

        await Notification.create(req.body);

        res.redirect('/notifications');

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// ==========================================
// VIEW
// ==========================================
exports.view = async (req, res) => {

    try {

        const notification = await Notification.getById(req.params.id);

        if (!notification) {

            return res.status(404).send("Notification not found");

        }

        res.render('notifications/view', {

            notification

        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// ==========================================
// EDIT PAGE
// ==========================================
exports.renderEdit = async (req, res) => {

    try {

        const notification = await Notification.getById(req.params.id);

        const users = await User.getAll();

        if (!notification) {

            return res.status(404).send("Notification not found");

        }

        res.render('notifications/edit', {

            notification,

            users

        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// ==========================================
// UPDATE
// ==========================================
exports.update = async (req, res) => {

    try {

        await Notification.update(req.params.id, req.body);

        res.redirect('/notifications');

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// ==========================================
// MARK READ (scoped to the authenticated user)
// ==========================================
exports.markRead = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const updated = await Notification.markRead(req.params.id, userId);

        // If the notification doesn't belong to this user, treat as not found
        if (!updated) {
            return res.status(404).send("Notification not found.");
        }

        // Support AJAX requests
        const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
        if (req.xhr || acceptsJson) {
            return res.json({ success: true });
        }

        res.redirect('/notifications/my');

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// ==========================================
// MARK ALL READ
// ==========================================
exports.markAllRead = async (req, res) => {

    try {

        const userId = req.session.user.id;

        await Notification.markAllRead(userId);

        // Support AJAX requests
        const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
        if (req.xhr || acceptsJson) {
            return res.json({ success: true });
        }

        res.redirect('/notifications/my');

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// ==========================================
// DELETE
// ==========================================
exports.delete = async (req, res) => {

    try {

        await Notification.delete(req.params.id);

        res.redirect('/notifications');

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};