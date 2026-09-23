const express = require('express');
const router = express.Router();

const registrationController = require('../controllers/studentRegistrationController');
const paymentController = require('../controllers/studentPaymentController');

// Registration
router.get('/register', registrationController.renderRegisterForm);
router.post('/verify', registrationController.verifyAdmission);
router.post('/register', registrationController.processRegistration);

// Payment
router.get('/payment', paymentController.showPaymentPage);
router.post('/payment', paymentController.processPayment);

module.exports = router;