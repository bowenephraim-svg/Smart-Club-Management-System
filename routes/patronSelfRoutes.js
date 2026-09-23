const express = require('express');
const router = express.Router();

const patronController = require('../controllers/patronController');

// IMPORTANT:
// This middleware must attach req.patron
const patronMiddleware = require('../middleware/patronMiddleware');

// =========================================================
// PATRON SELF-SERVICE
// =========================================================

router.get('/dashboard',
    patronMiddleware,
    patronController.dashboard
);

router.get('/profile',
    patronMiddleware,
    patronController.profile
);

router.get('/clubs',
    patronMiddleware,
    patronController.clubs
);

router.get('/members',
    patronMiddleware,
    patronController.members
);

router.get('/notifications',
    patronMiddleware,
    patronController.notifications
);

module.exports = router;