// routes/electionRoutes.js
const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');
const verifyAdmin = require('../middleware/adminMiddleware');
const protectRoute = require('../middleware/authMiddleware');
const requireStudent = require('../middleware/studentMiddleware');

// ==========================================
// STUDENT ROUTES (must come before /:id)
// ==========================================
router.get(
    '/available',
    protectRoute,
    requireStudent,
    electionController.studentElections
);

router.get(
    '/vote/:id',
    protectRoute,
    requireStudent,
    electionController.studentVote
);

router.post(
    '/vote/:id',
    protectRoute,
    requireStudent,
    electionController.processStudentVote
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// List all elections (admin only)
router.get('/', protectRoute, electionController.index);

// Create election
router.get('/create', protectRoute, verifyAdmin, electionController.renderCreateForm);
router.post('/create', protectRoute, verifyAdmin, electionController.processCreate);

// Edit election
router.get('/edit/:id', protectRoute, verifyAdmin, electionController.renderEditForm);
router.post('/edit/:id', protectRoute, verifyAdmin, electionController.processEdit);

// Delete election
router.post('/delete/:id', protectRoute, verifyAdmin, electionController.processDelete);

// Activate / Close election
router.post('/:id/activate', protectRoute, verifyAdmin, electionController.activate);
router.post('/:id/close', protectRoute, verifyAdmin, electionController.close);

// Results (admin may view anytime; students only after close)
router.get('/:id/results', protectRoute, electionController.results);

// Candidate management
router.get('/:id/candidates/add', protectRoute, verifyAdmin, electionController.renderAddCandidate);
router.post('/:id/candidates/add', protectRoute, verifyAdmin, electionController.processAddCandidate);
router.get('/:id/candidates/:candidate_id/edit', protectRoute, verifyAdmin, electionController.renderEditCandidate);
router.post('/:id/candidates/:candidate_id/edit', protectRoute, verifyAdmin, electionController.processEditCandidate);
router.post('/:id/candidates/:candidate_id/remove', protectRoute, verifyAdmin, electionController.processRemoveCandidate);

// View election details (catch-all must be last)
router.get('/:id', protectRoute, electionController.show);

module.exports = router;