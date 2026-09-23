const db = require('../config/db');

class GalleryImage {
    static async getByAlbum(galleryId, publishedOnly = false) {
        const statusClause = publishedOnly ? "AND gi.status = 'Published'" : '';
        const [rows] = await db.query(`
            SELECT gi.*, c.club_name
            FROM gallery_images gi
            LEFT JOIN clubs c ON c.club_id = gi.club_id
            WHERE gi.gallery_id = ? ${statusClause}
            ORDER BY gi.uploaded_at DESC
        `, [galleryId]);
        return rows;
    }

    static async create({ gallery_id, club_id, title, file_path, caption, uploaded_by }) {
        const [result] = await db.query(`
            INSERT INTO gallery_images
                (gallery_id, club_id, title, file_path, caption, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [gallery_id || null, club_id || null, title, file_path, caption || null, uploaded_by || null]);
        return result.insertId;
    }

    static async update(id, { caption, title, status }) {
        const [result] = await db.query(`
            UPDATE gallery_images
            SET caption = ?, title = ?, status = ?
            WHERE image_id = ?
        `, [caption || null, title, status === 'Unpublished' ? 'Unpublished' : 'Published', id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM gallery_images WHERE image_id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = GalleryImage;