// routes/membershipRoutes.js

const express = require('express');

const router =
    express.Router();

const membershipController =
    require('../controllers/membershipController');

const protectRoute =
    require('../middleware/authMiddleware');

const adminMiddleware =
    require('../middleware/adminMiddleware');

const patronMiddleware =
    require('../middleware/patronMiddleware');


// =====================================================
// ADMIN - VIEW ONLY
// =====================================================

router.get(
    '/',
    protectRoute,
    (req, res, next) => {
        // Older Patron links used the admin memberships URL. Preserve a
        // helpful route while enforcing that Patrons only see their clubs.
        if (req.session?.user?.role === 'Patron') {
            return res.redirect('/patron/members');
        }
        return next();
    },
    adminMiddleware,
    membershipController.getAllMemberships
);


// =====================================================
// ADMIN - ADD MEMBERSHIP
// =====================================================

router.get(
    '/add',
    protectRoute,
    adminMiddleware,
    membershipController.renderAddForm
);

router.post(
    '/add',
    protectRoute,
    adminMiddleware,
    membershipController.processAdd
);


// =====================================================
// ADMIN - UPDATE ROLE
// =====================================================

router.post(
    '/role/:id',
    protectRoute,
    adminMiddleware,
    membershipController.processUpdateRole
);


// =====================================================
// ADMIN - DELETE
// =====================================================

router.post(
    '/delete/:id',
    protectRoute,
    adminMiddleware,
    membershipController.processDelete
);


// =====================================================
// PATRON - PENDING REQUESTS
// =====================================================

router.get(
    '/requests',
    protectRoute,
    patronMiddleware,
    membershipController.pendingRequests
);


// =====================================================
// PATRON - APPROVE
// =====================================================

router.post(
    '/approve/:id',
    protectRoute,
    patronMiddleware,
    membershipController.approveMembership
);


// =====================================================
// PATRON - REJECT
// =====================================================

router.post(
    '/reject/:id',
    protectRoute,
    patronMiddleware,
    membershipController.rejectMembership
);


module.exports = router;
