const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/studentPaymentController');

router.get('/payment', paymentController.showPaymentPage);

module.exports = router;