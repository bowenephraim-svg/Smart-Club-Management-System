// models/Club.js
const db = require('../config/db');

class Club {
    // 1. Fetch all clubs alongside active capacity calculations and patron details
    static async getAll() {
        const query = `
            SELECT c.*, p.full_name AS patron_full,
                   COUNT(m.membership_id) AS active_enrolled_count
            FROM clubs c
            LEFT JOIN patrons p ON c.patron_id = p.patron_id
            LEFT JOIN memberships m 
            ON c.club_id = m.club_id
            AND m.status = 'Active'
            GROUP BY c.club_id
            ORDER BY c.club_name ASC
        `;
        const [rows] = await db.query(query);
        return rows.map(row => {
            let firstName = '';
            let lastName = '';
            if (row.patron_full) {
                const parts = row.patron_full.trim().split(/\s+/);
                firstName = parts[0] || '';
                lastName = parts.slice(1).join(' ') || '';
            } else if (row.patron_name) {
                const parts = row.patron_name.trim().split(/\s+/);
                firstName = parts[0] || '';
                lastName = parts.slice(1).join(' ') || '';
            }
            return {
                ...row,
                patron_first: firstName,
                patron_last: lastName,
                category: row.category || 'General',
                capacity: row.capacity || 50,
                status: row.status || 'Active'
            };
        });
    }

    // 2. Fetch specific club record with comprehensive metadata
    static async getById(id) {
        const query = `
            SELECT c.*, p.full_name AS patron_full, p.email AS patron_email
            FROM clubs c
            LEFT JOIN patrons p ON c.patron_id = p.patron_id
            WHERE c.club_id = ?
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) return null;
        
        const row = rows[0];
        let firstName = '';
        let lastName = '';
        if (row.patron_full) {
            const parts = row.patron_full.trim().split(/\s+/);
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
        } else if (row.patron_name) {
            const parts = row.patron_name.trim().split(/\s+/);
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
        }
        return {
            ...row,
            patron_first: firstName,
            patron_last: lastName,
            category: row.category || 'General',
            capacity: row.capacity || 50,
            status: row.status || 'Active'
        };
    }

    // 3. Extract the active student roster explicitly assigned to a specific club
    static async getRoster(clubId) {
        const query = `
            SELECT m.membership_id, COALESCE(r.position, 'Member') AS role, m.join_date,
                   s.student_id, s.admission_no, s.first_name, s.last_name, s.class AS form, s.phone AS stream
            FROM memberships m
            JOIN students s ON m.student_id = s.student_id
            LEFT JOIN roles r ON m.membership_id = r.membership_id
            WHERE m.club_id = ?
            AND m.status = 'Active'
            ORDER BY s.class DESC, s.last_name ASC
        `;
        const [rows] = await db.query(query, [clubId]);
        return rows.map(row => {
            let form = 1;
            let stream = 'A';
            if (row.form) {
                const match = row.form.match(/Form\s+(\d+)/i);
                if (match) {
                    form = parseInt(match[1]);
                }
            }
            return {
                ...row,
                form: form,
                stream: stream
            };
        });
    }

    // 4. Create a new club charter instance configuration
    static async create({ club_name, category, patron_id, capacity, status, description }) {
        const query = `
            INSERT INTO clubs (club_name, patron_id, description, patron_name)
            VALUES (?, ?, ?, ?)
        `;
        let patronName = 'Unassigned';
        if (patron_id) {
            const [patrons] = await db.query("SELECT full_name FROM patrons WHERE patron_id = ?", [patron_id]);
            if (patrons[0]) patronName = patrons[0].full_name;
        }
        const [result] = await db.query(query, [
            club_name, patron_id || null, description || null, patronName
        ]);
        return result.insertId;
    }

    // 5. Mutate updates onto an existing charter block
    static async update(id, { club_name, category, patron_id, capacity, status, description }) {
        const query = `
            UPDATE clubs
            SET club_name = ?, patron_id = ?, description = ?, patron_name = ?
            WHERE club_id = ?
        `;
        let patronName = 'Unassigned';
        if (patron_id) {
            const [patrons] = await db.query("SELECT full_name FROM patrons WHERE patron_id = ?", [patron_id]);
            if (patrons[0]) patronName = patrons[0].full_name;
        }
        const [result] = await db.query(query, [
            club_name, patron_id || null, description || null, patronName, id
        ]);
        return result.affectedRows > 0;
    }

    // 6. Cascade safe deletion logic
    static async delete(id) {
        const [result] = await db.query("DELETE FROM clubs WHERE club_id = ?", [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Club;