// models/Gallery.js
const db = require('../config/db');

class Gallery {
    // ==========================================
    // GET ALL GALLERY IMAGES (ADMIN)
    // ==========================================
    static async getAll() {
        const [rows] = await db.query(`
            SELECT g.*, a.title AS album_title, a.description AS album_description,
                   a.status AS album_status, c.club_name
            FROM gallery_images g
            LEFT JOIN gallery_albums a ON a.gallery_id = g.gallery_id
            LEFT JOIN clubs c ON c.club_id = g.club_id
            ORDER BY g.uploaded_at DESC
        `);
        return rows;
    }

    // ==========================================
    // GET PUBLISHED GALLERY IMAGES (STUDENT)
    // ==========================================
    static async getPublished() {
        const [rows] = await db.query(`
            SELECT g.*, a.title AS album_title, a.description AS album_description,
                   c.club_name
            FROM gallery_images g
            LEFT JOIN gallery_albums a ON a.gallery_id = g.gallery_id
            LEFT JOIN clubs c ON c.club_id = g.club_id
            WHERE g.status = 'Published'
              AND (g.gallery_id IS NULL OR a.status = 'Published')
            ORDER BY g.uploaded_at DESC
        `);
        return rows;
    }

    // ==========================================
    // GET SINGLE GALLERY IMAGE BY ID
    // ==========================================
    static async getById(id) {
        const [rows] = await db.query(`
            SELECT g.*, a.title AS album_title, a.description AS album_description,
                   a.status AS album_status, c.club_name
            FROM gallery_images g
            LEFT JOIN gallery_albums a ON a.gallery_id = g.gallery_id
            LEFT JOIN clubs c ON c.club_id = g.club_id
            WHERE g.image_id = ?
        `, [id]);
        return rows[0] || null;
    }

    // ==========================================
    // CREATE GALLERY IMAGE
    // ==========================================
    static async create({ gallery_id, club_id, title, file_path, caption, uploaded_by, status }) {
        const [result] = await db.query(`
            INSERT INTO gallery_images
                (gallery_id, club_id, title, file_path, caption, uploaded_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            gallery_id || null,
            club_id || null,
            title,
            file_path,
            caption || null,
            uploaded_by || null,
            status === 'Unpublished' ? 'Unpublished' : 'Published'
        ]);
        return result.insertId;
    }

    // ==========================================
    // UPDATE GALLERY IMAGE
    // ==========================================
    static async update(id, { gallery_id, club_id, title, caption, status }) {
        const [result] = await db.query(`
            UPDATE gallery_images
            SET gallery_id = ?, club_id = ?, title = ?, caption = ?, status = ?
            WHERE image_id = ?
        `, [
            gallery_id || null,
            club_id || null,
            title,
            caption || null,
            status === 'Unpublished' ? 'Unpublished' : 'Published',
            id
        ]);
        return result.affectedRows > 0;
    }

    // ==========================================
    // DELETE GALLERY IMAGE
    // ==========================================
    static async delete(id) {
        const [result] = await db.query('DELETE FROM gallery_images WHERE image_id = ?', [id]);
        return result.affectedRows > 0;
    }

    // ==========================================
    // GET IMAGES FOR AN ALBUM
    // ==========================================
    static async getImages(galleryId, publishedOnly = false) {
        const statusClause = publishedOnly ? "AND g.status = 'Published'" : '';
        const [rows] = await db.query(`
            SELECT g.*, c.club_name
            FROM gallery_images g
            LEFT JOIN clubs c ON c.club_id = g.club_id
            WHERE g.gallery_id = ? ${statusClause}
            ORDER BY g.uploaded_at DESC
        `, [galleryId]);
        return rows;
    }

    // ==========================================
    // ADD IMAGE TO ALBUM
    // ==========================================
    static async addImage({ gallery_id, club_id, title, file_path, caption, uploaded_by, status }) {
        return this.create({ gallery_id, club_id, title, file_path, caption, uploaded_by, status });
    }

    // ==========================================
    // DELETE INDIVIDUAL IMAGE
    // ==========================================
    static async deleteImage(id) {
        return this.delete(id);
    }

    // ==========================================
    // ALBUMS
    // ==========================================
    static async getAlbums(publishedOnly = false) {
        const [rows] = await db.query(`
            SELECT a.*, COUNT(g.image_id) AS image_count
            FROM gallery_albums a
            LEFT JOIN gallery_images g ON g.gallery_id = a.gallery_id
            ${publishedOnly ? "WHERE a.status = 'Published' AND (g.image_id IS NULL OR g.status = 'Published')" : ''}
            GROUP BY a.gallery_id
            ORDER BY a.created_at DESC
        `);
        return rows;
    }

    static async getAlbumById(id) {
        const [rows] = await db.query(`
            SELECT a.*, COUNT(g.image_id) AS image_count
            FROM gallery_albums a
            LEFT JOIN gallery_images g ON g.gallery_id = a.gallery_id
            WHERE a.gallery_id = ?
            GROUP BY a.gallery_id
        `, [id]);
        return rows[0] || null;
    }

    static async createAlbum({ title, description, created_by, status }) {
        const [result] = await db.query(`
            INSERT INTO gallery_albums (title, description, created_by, status)
            VALUES (?, ?, ?, ?)
        `, [title, description || null, created_by || null, status === 'Unpublished' ? 'Unpublished' : 'Published']);
        return result.insertId;
    }

    static async updateAlbum(id, { title, description, status }) {
        const [result] = await db.query(`
            UPDATE gallery_albums SET title = ?, description = ?, status = ? WHERE gallery_id = ?
        `, [title, description || null, status === 'Unpublished' ? 'Unpublished' : 'Published', id]);
        return result.affectedRows > 0;
    }

    static async deleteAlbum(id) {
        const [result] = await db.query('DELETE FROM gallery_albums WHERE gallery_id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Gallery;