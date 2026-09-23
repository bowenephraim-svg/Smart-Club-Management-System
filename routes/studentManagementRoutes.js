const express = require('express');
const router = express.Router();
const studentManagementController = require('../controllers/studentManagementController');

router.get('/', studentManagementController.getAllStudents);

module.exports = router;
