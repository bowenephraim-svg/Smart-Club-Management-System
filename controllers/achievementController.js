const Achievement = require('../models/Achievement');
const Club = require('../models/Club');
const Student = require('../models/Student');
const Patron = require('../models/Patron');
const fs = require('fs');
const path = require('path');

// =============================================
// HELPER: GET CURRENT USER ID
// =============================================
function getUserId(req) {
    return req.session.user.user_id ?? req.session.user.id;
}

// =============================================
// ADMIN: LIST ALL ACHIEVEMENTS
// =============================================
exports.index = async (req, res) => {
    try {
        const patronCtx = await Patron.getPatronContext(req);
        const filter = patronCtx.isPatron ? { club_ids: patronCtx.clubIds } : {};
        const achievements = await Achievement.getAll(filter);
        res.render('achievements/index', {
            achievements,
            pageTitle: 'Achievements Management'
        });
    } catch (err) {
        console.error('Achievement index error:', err);
        req.session.error_msg = 'Failed to load achievements.';
        res.redirect('/dashboard');
    }
};

// =============================================
// ADMIN: SHOW CREATE FORM
// =============================================
exports.createForm = async (req, res) => {
    try {
        const patronCtx = await Patron.getPatronContext(req);
        const clubs = patronCtx.isPatron ? patronCtx.clubs : await Club.getAll();
        const students = await Student.getAll();
        res.render('achievements/add', {
            clubs,
            students,
            pageTitle: 'Add Achievement'
        });
    } catch (err) {
        console.error('Achievement create form error:', err);
        req.session.error_msg = 'Failed to load the achievement form.';
        res.redirect('/achievements');
    }
};

// =============================================
// ADMIN: STORE NEW ACHIEVEMENT
// =============================================
exports.store = async (req, res) => {
    try {
        const {
            student_id, club_id, title, description, category,
            achievement_date, position, award, status
        } = req.body;

        if (!title || !title.trim()) {
            req.session.error_msg = 'A title is required.';
            return res.redirect('/achievements/add');
        }

        if (club_id && !await Patron.canManageClub(req, club_id)) {
            req.session.error_msg = 'You can only manage achievements for your assigned clubs.';
            return res.redirect('/achievements/add');
        }

        let image = null;
        if (req.file) {
            image = '/uploads/achievements/' + req.file.filename;
        }

        const achievementId = await Achievement.create({
            student_id: student_id || null,
            club_id: club_id || null,
            title: title.trim(),
            description: description || null,
            category: category || null,
            achievement_date: achievement_date || null,
            position: position || null,
            award: award || null,
            image,
            created_by: getUserId(req),
            status
        });

        req.session.success_msg = 'Achievement created successfully.';
        res.redirect('/achievements/view/' + achievementId);
    } catch (err) {
        console.error('Achievement store error:', err);
        req.session.error_msg = 'Failed to create the achievement.';
        res.redirect('/achievements/add');
    }
};

// =============================================
// VIEW A SINGLE ACHIEVEMENT
// =============================================
exports.view = async (req, res) => {
    try {
        const achievement = await Achievement.getById(req.params.id);
        if (!achievement) {
            req.session.error_msg = 'Achievement not found.';
            return res.redirect('/achievements');
        }
        res.render('achievements/view', {
            achievement,
            pageTitle: achievement.title
        });
    } catch (err) {
        console.error('Achievement view error:', err);
        req.session.error_msg = 'Failed to load the achievement.';
        res.redirect('/achievements');
    }
};

// =============================================
// ADMIN: SHOW EDIT FORM
// =============================================
exports.editForm = async (req, res) => {
    try {
        const achievement = await Achievement.getById(req.params.id);
        if (!achievement) {
            req.session.error_msg = 'Achievement not found.';
            return res.redirect('/achievements');
        }
        const patronCtx = await Patron.getPatronContext(req);
        if (patronCtx.isPatron && achievement.club_id && !patronCtx.clubIds.includes(achievement.club_id)) {
            req.session.error_msg = 'Access denied. You can only edit achievements for your assigned clubs.';
            return res.redirect('/achievements');
        }
        const clubs = patronCtx.isPatron ? patronCtx.clubs : await Club.getAll();
        const students = await Student.getAll();
        res.render('achievements/edit', {
            achievement,
            clubs,
            students,
            pageTitle: 'Edit Achievement'
        });
    } catch (err) {
        console.error('Achievement edit form error:', err);
        req.session.error_msg = 'Failed to load the achievement.';
        res.redirect('/achievements');
    }
};

// =============================================
// ADMIN: UPDATE ACHIEVEMENT
// =============================================
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            student_id, club_id, title, description, category,
            achievement_date, position, award, status
        } = req.body;

        const existing = await Achievement.getById(id);
        if (!existing) {
            req.session.error_msg = 'Achievement not found.';
            return res.redirect('/achievements');
        }

        if (!title || !title.trim()) {
            req.session.error_msg = 'A title is required.';
            return res.redirect('/achievements/edit/' + id);
        }

        if (club_id && !await Patron.canManageClub(req, club_id)) {
            req.session.error_msg = 'You can only manage achievements for your assigned clubs.';
            return res.redirect('/achievements/edit/' + id);
        }

        let image = existing.image;
        if (req.file) {
            image = '/uploads/achievements/' + req.file.filename;
            // Remove old image if it exists
            if (existing.image) {
                const oldPath = path.join(__dirname, '..', 'public', existing.image);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
        }

        await Achievement.update(id, {
            student_id: student_id || null,
            club_id: club_id || null,
            title: title.trim(),
            description: description || null,
            category: category || null,
            achievement_date: achievement_date || null,
            position: position || null,
            award: award || null,
            image,
            status
        });

        req.session.success_msg = 'Achievement updated successfully.';
        res.redirect('/achievements/view/' + id);
    } catch (err) {
        console.error('Achievement update error:', err);
        req.session.error_msg = 'Failed to update the achievement.';
        res.redirect('/achievements/edit/' + req.params.id);
    }
};

// =============================================
// ADMIN: DELETE ACHIEVEMENT
// =============================================
exports.destroy = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await Achievement.getById(id);
        if (existing && existing.image) {
            const fullPath = path.join(__dirname, '..', 'public', existing.image);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        await Achievement.delete(id);
        req.session.success_msg = 'Achievement deleted successfully.';
        res.redirect('/achievements');
    } catch (err) {
        console.error('Achievement delete error:', err);
        req.session.error_msg = 'Failed to delete the achievement.';
        res.redirect('/achievements');
    }
};

// =============================================
// STUDENT: VIEW OWN ACHIEVEMENTS
// =============================================
exports.studentAchievements = async (req, res) => {
    try {
        const userId = getUserId(req);
        const student = await Student.getByUserId(userId);
        if (!student) {
            return res.status(404).send('Student profile not found.');
        }
        const achievements = await Achievement.getByStudent(student.student_id, true);
        res.render('students/achievements', {
            student,
            achievements,
            pageTitle: 'My Achievements'
        });
    } catch (err) {
        console.error('Student achievements error:', err);
        res.status(500).send('Unable to load your achievements.');
    }
};

// =============================================
// STUDENT: VIEW A SINGLE ACHIEVEMENT (OWN ONLY)
// =============================================
exports.studentView = async (req, res) => {
    try {
        const userId = getUserId(req);
        const student = await Student.getByUserId(userId);
        if (!student) {
            return res.status(404).send('Student profile not found.');
        }
        const achievement = await Achievement.getById(req.params.id);
        // Security: students can only view their own published achievements
        if (!achievement || achievement.student_id !== student.student_id || achievement.status !== 'Published') {
            return res.status(404).send('Achievement not found.');
        }
        res.render('students/achievement-view', {
            student,
            achievement,
            pageTitle: achievement.title
        });
    } catch (err) {
        console.error('Student achievement view error:', err);
        res.status(500).send('Unable to load the achievement.');
    }
};