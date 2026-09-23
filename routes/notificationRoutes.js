const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationsController');
const verifyAdmin = require('../middleware/adminMiddleware');

// ==========================================
// ADMIN ROUTES
// ==========================================

// All notifications
router.get('/', (req, res, next) => {
    if (req.session?.user?.role === 'Student') {
        return res.redirect('/notifications/my');
    }
    return verifyAdmin(req, res, next);
}, notificationController.index);

// Create notification
router.get('/create', verifyAdmin, notificationController.renderCreate);
router.post('/create', verifyAdmin, notificationController.create);

// View notification
router.get('/view/:id', verifyAdmin, notificationController.view);

// Edit notification
router.get('/edit/:id', verifyAdmin, notificationController.renderEdit);
router.post('/edit/:id', verifyAdmin, notificationController.update);

// Delete notification
router.get('/delete/:id', verifyAdmin, notificationController.delete);


// ==========================================
// USER / STUDENT ROUTES (authenticated)
// ==========================================

// My notifications (notification center for any logged-in user)
router.get('/my', notificationController.myNotifications);

// Mark all notifications as read (must come BEFORE /read/:id)
router.get('/read-all', notificationController.markAllRead);

// Mark all notifications as read (AJAX / JSON)
router.post('/read-all', notificationController.markAllRead);

// Mark one notification as read
router.get('/read/:id', notificationController.markRead);

// Mark one notification as read (AJAX / JSON)
router.post('/read/:id', notificationController.markRead);


module.exports = router;
