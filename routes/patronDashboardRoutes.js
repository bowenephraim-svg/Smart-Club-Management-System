// routes/patronDashboardRoutes.js

const express = require('express');

const router =
    express.Router();

const patronController =
    require('../controllers/patronController');
const profileUpload =
    require('../middleware/profileUploadMiddleware');
const profileController =
    require('../controllers/profileController');


// =====================================================
// PATRON DASHBOARD
// =====================================================

router.get(
    '/dashboard',
    patronController.dashboard
);


// =====================================================
// PATRON MEMBERS
// =====================================================

router.get(
    '/members',
    patronController.members
);

router.get(
    '/clubs',
    patronController.clubs
);

router.get(
    '/student-registrations',
    patronController.pendingStudentRegistrations
);

router.get(
    '/invite-student',
    patronController.inviteStudentForm
);

router.post(
    '/invite-student',
    patronController.sendStudentInvite
);

router.post(
    '/student-registrations/approve/:id',
    patronController.approveStudentRegistration
);

router.post(
    '/student-registrations/reject/:id',
    patronController.rejectStudentRegistration
);

// =====================================================
// PATRON MEMBERSHIP REQUESTS
// =====================================================

router.get(
    '/membership-requests',
    patronController.membershipRequests
);

router.post(
    '/membership-requests/approve/:id',
    patronController.approveMembershipRequest
);

router.post(
    '/membership-requests/reject/:id',
    patronController.rejectMembershipRequest
);

// =====================================================
// PATRON PROFILE
// =====================================================

router.get(
    '/profile',
    patronController.profile
);

router.post(
    '/profile/image',
    profileUpload.single('profile_image'),
    profileController.uploadImage
);


// =====================================================
// PATRON NOTIFICATIONS
// =====================================================

router.get(
    '/notifications',
    patronController.notifications
);


module.exports = router;