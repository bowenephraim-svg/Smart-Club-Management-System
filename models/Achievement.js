const db = require('../config/db');

class Achievement {
    // ==========================================
    // GET ALL ACHIEVEMENTS (ADMIN)
    // ==========================================
    static async getAll(filters = {}, publishedOnly = false) {
        const clauses = [];
        const params = [];
        if (publishedOnly) clauses.push("a.status = 'Published'");
        if (filters.search) {
            clauses.push('(a.title LIKE ? OR a.description LIKE ?)');
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.club_id) {
            clauses.push('a.club_id = ?');
            params.push(filters.club_id);
        } else if (filters.club_ids) {
            if (filters.club_ids.length > 0) {
                clauses.push(`a.club_id IN (${filters.club_ids.map(() => '?').join(',')})`);
                params.push(...filters.club_ids);
            } else {
                clauses.push('1=0');
            }
        }
        if (filters.student_id) { clauses.push('a.student_id = ?'); params.push(filters.student_id); }
        if (filters.category) { clauses.push('a.category = ?'); params.push(filters.category); }
        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const [rows] = await db.query(`
            SELECT a.*, c.club_name,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.admission_no
            FROM achievements a
            LEFT JOIN clubs c ON c.club_id = a.club_id
            LEFT JOIN students s ON s.student_id = a.student_id
            ${where}
            ORDER BY a.achievement_date DESC, a.created_at DESC
        `, params);
        return rows;
    }

    // ==========================================
    // GET SINGLE ACHIEVEMENT BY ID
    // ==========================================
    static async getById(id) {
        const [rows] = await db.query(`
            SELECT a.*, c.club_name,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.admission_no
            FROM achievements a
            LEFT JOIN clubs c ON c.club_id = a.club_id
            LEFT JOIN students s ON s.student_id = a.student_id
            WHERE a.achievement_id = ?
        `, [id]);
        return rows[0] || null;
    }

    // ==========================================
    // GET ACHIEVEMENTS FOR A SPECIFIC STUDENT
    // ==========================================
    static async getByStudent(studentId, publishedOnly = false) {
        const statusClause = publishedOnly ? "AND a.status = 'Published'" : '';
        const [rows] = await db.query(`
            SELECT a.*, c.club_name,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.admission_no
            FROM achievements a
            LEFT JOIN clubs c ON c.club_id = a.club_id
            LEFT JOIN students s ON s.student_id = a.student_id
            WHERE a.student_id = ? ${statusClause}
            ORDER BY a.achievement_date DESC, a.created_at DESC
        `, [studentId]);
        return rows;
    }

    // ==========================================
    // CREATE ACHIEVEMENT
    // ==========================================
    static async create(data) {
        const [result] = await db.query(`
            INSERT INTO achievements
                (student_id, club_id, title, description, category, achievement_date,
                 position, award, image, created_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [data.student_id || null, data.club_id || null, data.title, data.description || null,
            data.category || null, data.achievement_date || null, data.position || null,
            data.award || null, data.image || null, data.created_by || null,
            data.status === 'Unpublished' ? 'Unpublished' : 'Published']);
        return result.insertId;
    }

    // ==========================================
    // UPDATE ACHIEVEMENT
    // ==========================================
    static async update(id, data) {
        const [result] = await db.query(`
            UPDATE achievements SET student_id = ?, club_id = ?, title = ?, description = ?,
                category = ?, achievement_date = ?, position = ?, award = ?, image = ?, status = ?
            WHERE achievement_id = ?
        `, [data.student_id || null, data.club_id || null, data.title, data.description || null,
            data.category || null, data.achievement_date || null, data.position || null,
            data.award || null, data.image || null,
            data.status === 'Unpublished' ? 'Unpublished' : 'Published', id]);
        return result.affectedRows > 0;
    }

    // ==========================================
    // DELETE ACHIEVEMENT
    // ==========================================
    static async delete(id) {
        const [result] = await db.query('DELETE FROM achievements WHERE achievement_id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Achievement;