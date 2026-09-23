
const Settings = require('../models/Settings');

// ==========================================
// SETTINGS INDEX
// ==========================================

exports.index = async (req, res) => {

    try {

        const settings = await Settings.getAll();

        res.render('settings/index', {

            pageTitle: 'Settings',

            settings: settings || {}

        });

    } catch (err) {

        console.error('Settings Index Error:', err);

        res.status(500).render('500', {
            error: err
        });

    }

};

// ==========================================
// UPDATE SCHOOL PROFILE
// ==========================================

exports.updateProfile = async (req, res) => {

    try {

        const {
            school_name,
            school_motto,
            school_address,
            school_phone,
            school_email,
            school_website
        } = req.body;

        // Basic validation
        if (!school_name || !school_name.trim()) {

            req.session.error_msg =
                'School name is required.';

            return res.redirect('/settings');

        }

        await Settings.updateProfile({

            school_name: school_name.trim(),

            school_motto:
                school_motto?.trim() || null,

            school_address:
                school_address?.trim() || null,

            school_phone:
                school_phone?.trim() || null,

            school_email:
                school_email?.trim() || null,

            school_website:
                school_website?.trim() || null

        });

        req.session.success_msg =
            'School profile updated successfully.';

        return res.redirect('/settings');

    } catch (err) {

        console.error(
            'School Profile Update Error:',
            err
        );

        req.session.error_msg =
            'Failed to update school profile: ' +
            err.message;

        return res.redirect('/settings');

    }

};

// ==========================================
// UPDATE SYSTEM PREFERENCES
// ==========================================

exports.updatePreferences = async (req, res) => {

    try {

        const {
            currency,
            academic_year,
            theme
        } = req.body;

        await Settings.updatePreferences({

            currency:
                currency?.trim() || 'KES',

            academic_year:
                academic_year?.trim() ||
                new Date().getFullYear().toString(),

            theme:
                theme?.trim() || 'Professional'

        });

        req.session.success_msg =
            'System preferences updated successfully.';

        return res.redirect('/settings');

    } catch (err) {

        console.error(
            'Settings Preferences Update Error:',
            err
        );

        req.session.error_msg =
            'Failed to update preferences: ' +
            err.message;

        return res.redirect('/settings');

    }

};

// ==========================================
// UPDATE SCHOOL LOGO
// ==========================================

exports.updateLogo = async (req, res) => {

    try {

        if (!req.file) {

            req.session.error_msg =
                'Please select a logo image to upload.';

            return res.redirect('/settings');

        }

        const filePath =
            '/uploads/' + req.file.filename;

        await Settings.updateLogo(filePath);

        req.session.success_msg =
            'School logo updated successfully.';

        return res.redirect('/settings');

    } catch (err) {

        console.error(
            'Logo Upload Error:',
            err
        );

        req.session.error_msg =
            'Failed to upload logo: ' +
            err.message;

        return res.redirect('/settings');

    }

};

