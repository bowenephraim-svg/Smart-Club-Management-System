const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const settingsController = require('../controllers/settingsController');
const verifyAdmin = require('../middleware/adminMiddleware');

// ==========================================
// MULTER — SCHOOL LOGO UPLOAD
// ==========================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'school-logo-' + Date.now() + ext);
    }

});

const upload = multer({

    storage,

    limits: {
        fileSize: 2 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowed = [
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.webp'
        ];

        const ext = path.extname(file.originalname).toLowerCase();

        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'));
        }

    }

});

// ==========================================
// SETTINGS PAGE
// ==========================================

router.get(
    '/',
    verifyAdmin,
    settingsController.index
);

// ==========================================
// SCHOOL PROFILE
// ==========================================

router.post(
    '/profile',
    verifyAdmin,
    settingsController.updateProfile
);

// ==========================================
// SYSTEM PREFERENCES
// ==========================================

router.post(
    '/preferences',
    verifyAdmin,
    settingsController.updatePreferences
);

// ==========================================
// SCHOOL LOGO
// ==========================================

router.post(
    '/logo',
    verifyAdmin,
    upload.single('school_logo'),
    settingsController.updateLogo
);

module.exports = router;