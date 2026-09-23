const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const verifyAdmin = require('../middleware/adminMiddleware');
const adminOrPatron = require('../middleware/adminOrPatronMiddleware');

router.get('/', activityController.index);
router.get('/add', adminOrPatron, activityController.renderAddForm);
router.post('/add', adminOrPatron, activityController.processAdd);
router.get('/edit/:id', adminOrPatron, activityController.renderEditForm);
router.post('/edit/:id', adminOrPatron, activityController.processEdit);
router.post('/delete/:id', verifyAdmin, activityController.processDelete);
router.get('/:id', activityController.showDetails);
router.post('/:id/register', verifyAdmin, activityController.registerStudent);
router.post('/:id/registrations/:registration_id/remove', verifyAdmin, activityController.removeRegistration);

module.exports = router;