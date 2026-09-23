const db = require('../config/db');

const renderProfile = (req, res, data = {}) => {
    const role = req.session.user.role;

    if (role === 'Patron') {
        return res.render('patron/profile', data);
    }

    if (role === 'Student') {
        return res.render('students/profile', data);
    }

    return res.render('admin/profile', data);
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            req.session.error_msg = 'Please choose a JPG, PNG, or WebP image under 2 MB.';
            return res.redirect(req.get('Referrer') || '/dashboard');
        }

        const imagePath = `/uploads/profiles/${req.file.filename}`;
        await db.query(
            'UPDATE users SET profile_image = ? WHERE user_id = ?',
            [imagePath, req.session.user.id]
        );

        req.session.user.profile_image = imagePath;
        req.session.success_msg = 'Your profile image has been updated.';
        return res.redirect(req.get('Referrer') || '/dashboard');
    } catch (err) {
        console.error('Profile image upload error:', err);
        req.session.error_msg = err.message || 'Unable to update your profile image.';
        return res.redirect(req.get('Referrer') || '/dashboard');
    }
};

exports.adminProfile = async (req, res) => {
    const [[user]] = await db.query(
        'SELECT user_id, full_name, email, role, profile_image FROM users WHERE user_id = ?',
        [req.session.user.id]
    );

    return renderProfile(req, res, { userProfile: user || req.session.user });
};

exports.renderProfile = renderProfile;
