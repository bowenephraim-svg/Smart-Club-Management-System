// controllers/galleryController.js
const Gallery = require('../models/Gallery');
const Club = require('../models/Club');
const Student = require('../models/Student');
const fs = require('fs');
const path = require('path');

// =============================================
// HELPER: GET CURRENT USER ID
// =============================================
function getUserId(req) {
    return req.session.user.user_id ?? req.session.user.id;
}

// =============================================
// ADMIN: LIST ALL GALLERY IMAGES
// =============================================
exports.index = async (req, res) => {
    try {
        const images = await Gallery.getAll();
        const clubs = await Club.getAll();
        const albums = await Gallery.getAlbums();
        res.render('gallery/index', {
            images,
            clubs,
            albums,
            pageTitle: 'Gallery Management'
        });
    } catch (err) {
        console.error('Gallery index error:', err);
        req.session.error_msg = 'Failed to load the gallery.';
        res.redirect('/dashboard');
    }
};

// =============================================
// ADMIN: SHOW CREATE FORM
// =============================================
exports.createForm = async (req, res) => {
    try {
        const clubs = await Club.getAll();
        const albums = await Gallery.getAlbums();
        res.render('gallery/add', {
            clubs,
            albums,
            pageTitle: 'Add Gallery Item'
        });
    } catch (err) {
        console.error('Gallery create form error:', err);
        req.session.error_msg = 'Failed to load the gallery form.';
        res.redirect('/gallery');
    }
};

// =============================================
// ADMIN: STORE NEW GALLERY ITEM
// =============================================
exports.store = async (req, res) => {
    try {
        const { title, description, club_id, gallery_id, status } = req.body;

        if (!title || !title.trim()) {
            req.session.error_msg = 'A title is required.';
            return res.redirect('/gallery/add');
        }

        // If an image was uploaded, save it
        let file_path = null;
        if (req.file) {
            file_path = '/uploads/gallery/' + req.file.filename;
        }

        const imageId = await Gallery.create({
            gallery_id: gallery_id || null,
            club_id: club_id || null,
            title: title.trim(),
            file_path,
            caption: description || null,
            uploaded_by: getUserId(req),
            status
        });

        req.session.success_msg = 'Gallery item created successfully.';
        res.redirect('/gallery/view/' + imageId);
    } catch (err) {
        console.error('Gallery store error:', err);
        req.session.error_msg = 'Failed to create the gallery item.';
        res.redirect('/gallery/add');
    }
};

// =============================================
// VIEW A SINGLE GALLERY ITEM
// =============================================
exports.view = async (req, res) => {
    try {
        const image = await Gallery.getById(req.params.id);
        if (!image) {
            req.session.error_msg = 'Gallery item not found.';
            return res.redirect('/gallery');
        }
        const clubs = await Club.getAll();
        const albums = await Gallery.getAlbums();
        res.render('gallery/view', {
            image,
            clubs,
            albums,
            pageTitle: image.title
        });
    } catch (err) {
        console.error('Gallery view error:', err);
        req.session.error_msg = 'Failed to load the gallery item.';
        res.redirect('/gallery');
    }
};

// =============================================
// ADMIN: SHOW EDIT FORM
// =============================================
exports.editForm = async (req, res) => {
    try {
        const image = await Gallery.getById(req.params.id);
        if (!image) {
            req.session.error_msg = 'Gallery item not found.';
            return res.redirect('/gallery');
        }
        const clubs = await Club.getAll();
        const albums = await Gallery.getAlbums();
        res.render('gallery/edit', {
            image,
            clubs,
            albums,
            pageTitle: 'Edit Gallery Item'
        });
    } catch (err) {
        console.error('Gallery edit form error:', err);
        req.session.error_msg = 'Failed to load the gallery item.';
        res.redirect('/gallery');
    }
};

// =============================================
// ADMIN: UPDATE GALLERY ITEM
// =============================================
exports.update = async (req, res) => {
    try {
        const { title, description, club_id, gallery_id, status } = req.body;
        const id = req.params.id;

        const existing = await Gallery.getById(id);
        if (!existing) {
            req.session.error_msg = 'Gallery item not found.';
            return res.redirect('/gallery');
        }

        if (!title || !title.trim()) {
            req.session.error_msg = 'A title is required.';
            return res.redirect('/gallery/edit/' + id);
        }

        await Gallery.update(id, {
            gallery_id: gallery_id || null,
            club_id: club_id || null,
            title: title.trim(),
            caption: description || null,
            status
        });

        req.session.success_msg = 'Gallery item updated successfully.';
        res.redirect('/gallery/view/' + id);
    } catch (err) {
        console.error('Gallery update error:', err);
        req.session.error_msg = 'Failed to update the gallery item.';
        res.redirect('/gallery/edit/' + req.params.id);
    }
};

// =============================================
// ADMIN: DELETE GALLERY ITEM
// =============================================
exports.destroy = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await Gallery.getById(id);
        if (existing && existing.file_path) {
            // Remove the physical file if it exists
            const fullPath = path.join(__dirname, '..', 'public', existing.file_path);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        await Gallery.delete(id);
        req.session.success_msg = 'Gallery item deleted successfully.';
        res.redirect('/gallery');
    } catch (err) {
        console.error('Gallery delete error:', err);
        req.session.error_msg = 'Failed to delete the gallery item.';
        res.redirect('/gallery');
    }
};

// =============================================
// ADMIN: DELETE INDIVIDUAL IMAGE
// =============================================
exports.deleteImage = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await Gallery.getById(id);
        if (existing && existing.file_path) {
            const fullPath = path.join(__dirname, '..', 'public', existing.file_path);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        await Gallery.deleteImage(id);
        req.session.success_msg = 'Image deleted successfully.';
        res.redirect('/gallery');
    } catch (err) {
        console.error('Gallery delete image error:', err);
        req.session.error_msg = 'Failed to delete the image.';
        res.redirect('/gallery');
    }
};

// =============================================
// STUDENT: VIEW PUBLISHED GALLERY
// =============================================
exports.studentGallery = async (req, res) => {
    try {
        const userId = getUserId(req);
        const student = await Student.getByUserId(userId);
        const images = await Gallery.getPublished();
        const albums = await Gallery.getAlbums(true);
        res.render('students/gallery', {
            student,
            images,
            albums,
            pageTitle: 'Gallery'
        });
    } catch (err) {
        console.error('Student gallery error:', err);
        res.status(500).send('Unable to load the gallery.');
    }
};

// =============================================
// STUDENT: VIEW A SINGLE PUBLISHED GALLERY ITEM
// =============================================
exports.studentView = async (req, res) => {
    try {
        const userId = getUserId(req);
        const student = await Student.getByUserId(userId);
        const image = await Gallery.getById(req.params.id);
        if (!image || image.status !== 'Published') {
            return res.status(404).send('Gallery item not found.');
        }
        res.render('students/gallery-view', {
            student,
            image,
            pageTitle: image.title
        });
    } catch (err) {
        console.error('Student gallery view error:', err);
        res.status(500).send('Unable to load the gallery item.');
    }
};