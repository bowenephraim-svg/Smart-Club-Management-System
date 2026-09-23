// routes/achievementRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const achievementController = require('../controllers/achievementController');
const verifyAdmin = require('../middleware/adminMiddleware');
const adminOrPatron = require('../middleware/adminOrPatronMiddleware');

// =============================================
// MULTER CONFIGURATION FOR ACHIEVEMENT UPLOADS
// =============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'public', 'uploads', 'achievements');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only JPG, JPEG, PNG, GIF and WEBP images are allowed.'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// =============================================
// AUTHENTICATED ROUTES
// =============================================

// View all achievements (admin) — students use /student/achievements
router.get('/', achievementController.index);

// View a single achievement
router.get('/view/:id', achievementController.view);

// =============================================
// ADMIN-ONLY ROUTES
// =============================================

// Show create form
router.get('/add', adminOrPatron, achievementController.createForm);

// Store new achievement (with optional image upload)
router.post('/add', adminOrPatron, upload.single('image'), achievementController.store);

// Show edit form
router.get('/edit/:id', adminOrPatron, achievementController.editForm);

// Update achievement
router.post('/edit/:id', adminOrPatron, upload.single('image'), achievementController.update);

// Delete achievement
router.get('/delete/:id', verifyAdmin, achievementController.destroy);

module.exports = router;