// routes/clubRoutes.js
const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubcontroller');
const verifyAdmin = require('../middleware/adminMiddleware');

// Public directory visibility routes
router.get('/', clubController.getAllClubs);
router.get('/details/:id', clubController.getClubDetails);
router.get('/export-csv/:id', clubController.exportRosterCSV);

// Secured modification paths
router.get('/add', verifyAdmin, clubController.renderAddForm);
router.post('/add', verifyAdmin, clubController.processAdd);
router.get('/edit/:id', verifyAdmin, clubController.renderEditForm);
router.post('/edit/:id', verifyAdmin, clubController.processEdit);
router.get('/delete/:id', verifyAdmin, clubController.processDelete);

module.exports = router;