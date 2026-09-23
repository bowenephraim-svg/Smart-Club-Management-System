const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Route to render the feedback form
router.get('/', feedbackController.index);

// Route to handle form submission
router.post('/submit', feedbackController.submit);

module.exports = router;
