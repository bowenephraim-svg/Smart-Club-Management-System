// routes/studentRoutes.js

const express = require('express');
const router = express.Router();

const studentController =
    require('../controllers/studentController');

const protectRoute =
    require('../middleware/authMiddleware');

const requireStudent =
    require('../middleware/studentMiddleware');
const profileUpload =
    require('../middleware/profileUploadMiddleware');
const profileController =
    require('../controllers/profileController');


// =====================================================
// STUDENT PORTAL PROTECTION
// =====================================================

router.use(
    protectRoute,
    requireStudent
);


// =====================================================
// STUDENT DASHBOARD
// =====================================================

router.get(
    '/dashboard',
    studentController.dashboard
);


// =====================================================
// STUDENT PROFILE
// =====================================================

router.get(
    '/profile',
    studentController.profile
);

router.post(
    '/profile/image',
    profileUpload.single('profile_image'),
    profileController.uploadImage
);


// =====================================================
// MY CLUBS
// =====================================================

router.get(
    '/clubs',
    studentController.myClubs
);


// =====================================================
// AVAILABLE CLUBS
// =====================================================

router.get(
    '/clubs/available',
    studentController.availableClubs
);


// =====================================================
// CLUB MEMBERSHIP PAYMENT PAGE
// =====================================================

router.get(
    '/clubs/:club_id/payment',
    studentController.clubPaymentPage
);


// =====================================================
// SUBMIT CLUB MEMBERSHIP PAYMENT
// =====================================================

router.post(
    '/clubs/:club_id/payment',
    studentController.submitClubPayment
);


// =====================================================
// MY ATTENDANCE
// =====================================================

router.get(
    '/attendance',
    studentController.myAttendance
);


// =====================================================
// MY NOTIFICATIONS
// =====================================================

router.get(
    '/notifications',
    studentController.notifications
);


router.get(
    '/notifications/read/:id',
    studentController.readNotification
);


router.get(
    '/notifications/read-all',
    studentController.readAllNotifications
);


// =====================================================
// PAYMENTS
// =====================================================

// Payment history

router.get(
    '/payments',
    studentController.payments
);


// Submit registration payment

router.get(
    '/payment',
    studentController.paymentPage
);


router.post(
    '/payment',
    studentController.submitPayment
);


// =====================================================
// EVENTS
// =====================================================

router.get(
    '/events',
    studentController.events
);


// =====================================================
// GALLERY
// =====================================================

const galleryController =
    require('../controllers/galleryController');

router.get(
    '/gallery',
    galleryController.studentGallery
);

router.get(
    '/gallery/view/:id',
    galleryController.studentView
);


// =====================================================
// MY ACHIEVEMENTS
// =====================================================

const achievementController =
    require('../controllers/achievementController');

router.get(
    '/achievements',
    achievementController.studentAchievements
);

router.get(
    '/achievements/view/:id',
    achievementController.studentView
);


module.exports = router;
