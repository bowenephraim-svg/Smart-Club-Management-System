// routes/patronRoutes.js

const express = require('express');
const router = express.Router();

const patronController = require('../controllers/patronController');

const verifyAdmin = require('../middleware/adminMiddleware');
const patronMiddleware = require('../middleware/patronMiddleware');

// =========================================================
// ADMIN — PATRON MANAGEMENT
// =========================================================

router.get('/', verifyAdmin, patronController.getAllPatrons);

router.get(
    '/add',
    verifyAdmin,
    patronController.renderAddForm
);

router.post(
    '/add',
    verifyAdmin,
    patronController.processAdd
);

router.get(
    '/edit/:id',
    verifyAdmin,
    patronController.renderEditForm
);

router.post(
    '/edit/:id',
    verifyAdmin,
    patronController.processEdit
);

router.get(
    '/delete/:id',
    verifyAdmin,
    patronController.processDelete
);


// =========================================================
// PATRON — SELF SERVICE
// =========================================================

// My Clubs
router.get(
    '/clubs',
    patronMiddleware,
    patronController.clubs
);

module.exports = router;