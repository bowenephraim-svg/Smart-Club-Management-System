// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const verifyAdmin = require('../middleware/adminMiddleware');
const adminOrPatron = require('../middleware/adminOrPatronMiddleware');
const protectRoute = require('../middleware/authMiddleware');

// ==========================================
// EVENTS LIST
// ==========================================
router.get('/', eventController.index);

// ==========================================
// CREATE EVENT
// ==========================================
router.get('/add', protectRoute, adminOrPatron, eventController.renderAddForm);
router.post('/add', protectRoute, adminOrPatron, eventController.processAdd);

// ==========================================
// EDIT EVENT
// ==========================================
router.get('/edit/:id', protectRoute, adminOrPatron, eventController.renderEditForm);
router.post('/edit/:id', protectRoute, adminOrPatron, eventController.processEdit);

// ==========================================
// DELETE EVENT
// ==========================================
router.post('/delete/:id', protectRoute, verifyAdmin, eventController.processDelete);

// ==========================================
// VIEW EVENT DETAILS
// ==========================================
router.get('/:id', eventController.showDetails);

module.exports = router;
