const express = require('express');
const router = express.Router();

const controller = require('../controllers/adminApprovalController');
const verifyAdmin = require('../middleware/adminMiddleware');

router.get('/', verifyAdmin, controller.index);

router.get('/approve/:id', verifyAdmin, controller.approve);

router.get('/reject/:id', verifyAdmin, controller.reject);

module.exports = router;