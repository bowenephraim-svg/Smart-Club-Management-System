// models/Activity.js
const db = require('../config/db');

class Activity {
    static formatStatus(activityDate) {
        if (!activityDate) return 'Upcoming';
        const today = new Date();
        const supplied = new Date(`${activityDate}T12:00:00`);
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const suppliedOnly = new Date(supplied.getFullYear(), supplied.getMonth(), supplied.getDate());

        if (suppliedOnly < todayOnly) return 'Completed';
        if (suppliedOnly.getTime() === todayOnly.getTime()) return 'Today';
        return 'Upcoming';
    }

    static normalize(row) {
        return {
            ...row,
            title: row.activity_name,
            start_time: row.start_time || '08:00:00',
            end_time: row.end_time || '10:00:00',
            budget_allocated: row.budget_allocated || 0.00,
            status: this.formatStatus(row.activity_date)
        };
    }

    static async getAll(filters = {}) {
        let whereClause = '';
        const values = [];

        if (filters.club_id) {
            whereClause = 'WHERE a.club_id = ?';
            values.push(filters.club_id);
        } else if (filters.club_ids) {
            if (filters.club_ids.length > 0) {
                whereClause = `WHERE a.club_id IN (${filters.club_ids.map(() => '?').join(',')})`;
                values.push(...filters.club_ids);
            } else {
                whereClause = 'WHERE 1=0';
            }
        }

        const query = `
            SELECT a.*, c.club_name,
                (SELECT COUNT(*) FROM event_registrations er WHERE er.activity_id = a.activity_id) AS registration_count
            FROM activities a
            JOIN clubs c ON a.club_id = c.club_id
            ${whereClause}
            ORDER BY a.activity_date ASC, a.activity_name ASC
        `;
        const [rows] = await db.query(query, values);
        return rows.map(row => this.normalize(row));
    }

    // Student dashboards use the established activities table as their event
    // feed. The separate Event module is not backed by a database table yet.
    static async getUpcoming(limit = 5) {
        const safeLimit = Math.max(1, Math.min(20, parseInt(limit, 10) || 5));
        const query = `
            SELECT a.*, c.club_name
            FROM activities a
            LEFT JOIN clubs c ON a.club_id = c.club_id
            WHERE a.activity_date >= CURDATE()
            ORDER BY a.activity_date ASC, a.activity_name ASC
            LIMIT ?
        `;
        const [rows] = await db.query(query, [safeLimit]);
        return rows.map(row => this.normalize(row));
    }

    static async getSummaryCounts(clubIds = null) {
        let whereClause = '';
        const values = [];

        if (clubIds) {
            if (clubIds.length > 0) {
                whereClause = `WHERE club_id IN (${clubIds.map(() => '?').join(',')})`;
                values.push(...clubIds);
            } else {
                whereClause = 'WHERE 1=0';
            }
        }

        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS totalActivities,
                SUM(CASE WHEN activity_date = CURRENT_DATE() THEN 1 ELSE 0 END) AS todayCount,
                SUM(CASE WHEN activity_date > CURRENT_DATE() THEN 1 ELSE 0 END) AS upcomingCount,
                SUM(CASE WHEN activity_date < CURRENT_DATE() THEN 1 ELSE 0 END) AS completedCount
            FROM activities
            ${whereClause}
        `, values);
        return rows[0] || { totalActivities: 0, todayCount: 0, upcomingCount: 0, completedCount: 0 };
    }

    static async getPaginated({ search = '', status = 'all', sort = 'upcoming', page = 1, limit = 10, club_ids = null, club_id = null }) {
        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.max(1, Math.min(25, parseInt(limit, 10) || 10));
        const offset = (safePage - 1) * safeLimit;
        const searchTerm = `%${search.trim()}%`;

        const values = [];
        const conditions = [];

        if (club_id) {
            conditions.push('a.club_id = ?');
            values.push(club_id);
        } else if (club_ids) {
            if (club_ids.length > 0) {
                conditions.push(`a.club_id IN (${club_ids.map(() => '?').join(',')})`);
                values.push(...club_ids);
            } else {
                conditions.push('1=0');
            }
        }

        if (search.trim()) {
            conditions.push('(a.activity_name LIKE ? OR a.description LIKE ? OR a.venue LIKE ? OR c.club_name LIKE ?)');
            values.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status === 'upcoming') {
            conditions.push('a.activity_date > CURRENT_DATE()');
        } else if (status === 'today') {
            conditions.push('a.activity_date = CURRENT_DATE()');
        } else if (status === 'completed') {
            conditions.push('a.activity_date < CURRENT_DATE()');
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        let orderClause = 'a.activity_date ASC, a.activity_name ASC';
        if (sort === 'recent') {
            orderClause = 'a.activity_date DESC, a.activity_name ASC';
        } else if (sort === 'name') {
            orderClause = 'a.activity_name ASC';
        } else if (sort === 'venue') {
            orderClause = 'a.venue ASC, a.activity_date ASC';
        }

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM activities a
            JOIN clubs c ON a.club_id = c.club_id
            ${whereClause}
        `;
        const [countResult] = await db.query(countQuery, values);
        const total = countResult[0]?.total || 0;
        const pages = Math.max(1, Math.ceil(total / safeLimit));

        const query = `
            SELECT a.*, c.club_name,
                (SELECT COUNT(*) FROM event_registrations er WHERE er.activity_id = a.activity_id) AS registration_count
            FROM activities a
            JOIN clubs c ON a.club_id = c.club_id
            ${whereClause}
            ORDER BY ${orderClause}
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query(query, [...values, safeLimit, offset]);

        return {
            activities: rows.map(row => this.normalize(row)),
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                pages,
                hasPrev: safePage > 1,
                hasNext: safePage < pages
            }
        };
    }

    static async getById(id) {
        const query = `
            SELECT a.*, c.club_name
            FROM activities a
            JOIN clubs c ON a.club_id = c.club_id
            WHERE a.activity_id = ?
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) return null;
        return this.normalize(rows[0]);
    }

    static async create({ club_id, activity_name, description, activity_date, venue }) {
        const query = `
            INSERT INTO activities (club_id, activity_name, description, activity_date, venue)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [club_id, activity_name || 'Activity Event', description || null, activity_date || null, venue || null]);
        return result.insertId;
    }

    static async update(id, { activity_name, description, activity_date, venue }) {
        const query = `
            UPDATE activities
            SET activity_name = ?, description = ?, activity_date = ?, venue = ?
            WHERE activity_id = ?
        `;
        const [result] = await db.query(query, [activity_name || 'Activity Event', description || null, activity_date || null, venue || null, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM activities WHERE activity_id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getRegistrations(activityId) {
        const query = `
            SELECT er.registration_id, er.registration_date, s.student_id, s.admission_no, s.first_name, s.last_name, s.class
            FROM event_registrations er
            JOIN students s ON er.student_id = s.student_id
            WHERE er.activity_id = ?
            ORDER BY er.registration_date DESC, s.last_name ASC
        `;
        const [rows] = await db.query(query, [activityId]);
        return rows;
    }

    static async getEligibleStudentsForClub(clubId) {
        const query = `
            SELECT s.student_id, s.admission_no, s.first_name, s.last_name, s.class
            FROM memberships m
            JOIN students s ON m.student_id = s.student_id
            WHERE m.club_id = ? AND m.status = 'Active'
            ORDER BY s.first_name ASC, s.last_name ASC
        `;
        const [rows] = await db.query(query, [clubId]);
        return rows;
    }

    static async registerStudent(activityId, studentId) {
        const existingQuery = 'SELECT registration_id FROM event_registrations WHERE activity_id = ? AND student_id = ?';
        const [existingRows] = await db.query(existingQuery, [activityId, studentId]);
        if (existingRows.length > 0) return { success: false, message: 'Student is already registered for this activity.' };

        const insertQuery = 'INSERT INTO event_registrations (activity_id, student_id, registration_date) VALUES (?, ?, CURRENT_DATE())';
        const [result] = await db.query(insertQuery, [activityId, studentId]);
        return { success: true, registrationId: result.insertId };
    }

    static async removeRegistration(registrationId) {
        const [result] = await db.query('DELETE FROM event_registrations WHERE registration_id = ?', [registrationId]);
        return result.affectedRows > 0;
    }

    static async getAttendanceSummary(activityId) {
        const query = `
            SELECT
                COUNT(*) AS totalStudents,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS presentCount,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absentCount
            FROM attendance
            WHERE activity_id = ?
        `;
        const [rows] = await db.query(query, [activityId]);
        return rows[0];
    }
}

module.exports = Activity;
