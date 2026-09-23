// routes/galleryRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const galleryController = require('../controllers/galleryController');
const verifyAdmin = require('../middleware/adminMiddleware');

// =============================================
// MULTER CONFIGURATION FOR GALLERY UPLOADS
// =============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'public', 'uploads', 'gallery');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Safe, unique timestamped filename with sanitized extension
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
// PUBLIC (AUTHENTICATED) ROUTES
// =============================================

// View gallery grid (admin sees all, student sees published)
router.get('/', galleryController.index);

// View a single gallery item
router.get('/view/:id', galleryController.view);

// =============================================
// ADMIN-ONLY ROUTES
// =============================================

// Show create form
router.get('/add', verifyAdmin, galleryController.createForm);

// Store new gallery item (with optional image upload)
router.post('/add', verifyAdmin, upload.single('image'), galleryController.store);

// Show edit form
router.get('/edit/:id', verifyAdmin, galleryController.editForm);

// Update gallery item
router.post('/edit/:id', verifyAdmin, upload.single('image'), galleryController.update);

// Delete gallery item
router.get('/delete/:id', verifyAdmin, galleryController.destroy);

// Delete individual image
router.get('/delete-image/:id', verifyAdmin, galleryController.deleteImage);

module.exports = router;