const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDirectory = path.join(__dirname, '..', 'public', 'uploads', 'profiles');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `profile-${req.session.user.id}-${Date.now()}${extension}`);
    }
});

module.exports = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extension = path.extname(file.originalname).toLowerCase();
        const mimeType = allowedTypes.test(file.mimetype);

        if (mimeType && allowedTypes.test(extension)) {
            return callback(null, true);
        }

        return callback(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
});
