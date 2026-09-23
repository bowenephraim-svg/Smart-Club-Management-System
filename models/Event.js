const db = require('../config/db');
const Activity = require('./Activity');

// The Events UI is an alternate presentation of the established activities
// data. activity_id is deliberately retained so attendance continues to refer
// to the same record.
class Event {
    static normalize(row) {
        if (!row) return null;

        return {
            ...row,
            title: row.title || row.activity_name,
            event_date: row.event_date || row.activity_date,
            start_time: row.start_time || '08:00:00',
            end_time: row.end_time || '10:00:00',
            status: row.status || Activity.formatStatus(row.activity_date),
            created_by: row.created_by || null,
            created_by_name: row.created_by_name || null
        };
    }

    static async getAll(filters = {}) {
        const conditions = [];
        const values = [];

        if (filters.club_id) {
            conditions.push('a.club_id = ?');
            values.push(filters.club_id);
        } else if (filters.club_ids) {
            if (filters.club_ids.length > 0) {
                conditions.push(`a.club_id IN (${filters.club_ids.map(() => '?').join(',')})`);
                values.push(...filters.club_ids);
            } else {
                conditions.push('1=0');
            }
        }
        if (filters.search) {
            const term = `%${filters.search}%`;
            conditions.push('(a.activity_name LIKE ? OR a.description LIKE ? OR a.venue LIKE ? OR c.club_name LIKE ?)');
            values.push(term, term, term, term);
        }
        if (filters.date_from) {
            conditions.push('a.activity_date >= ?');
            values.push(filters.date_from);
        }
        if (filters.date_to) {
            conditions.push('a.activity_date <= ?');
            values.push(filters.date_to);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [rows] = await db.query(`
            SELECT a.*, c.club_name
            FROM activities a
            LEFT JOIN clubs c ON c.club_id = a.club_id
            ${where}
            ORDER BY a.activity_date ASC, a.activity_id ASC
        `, values);

        const events = rows.map(this.normalize);
        return filters.status ? events.filter(event => event.status === filters.status) : events;
    }

    static async getById(activityId) {
        return this.normalize(await Activity.getById(activityId));
    }

    static async create({ club_id, title, description, event_date, venue }) {
        return Activity.create({
            club_id,
            activity_name: title,
            description,
            activity_date: event_date,
            venue
        });
    }

    static async update(activityId, { club_id, title, description, event_date, venue }) {
        return Activity.update(activityId, {
            club_id,
            activity_name: title,
            description,
            activity_date: event_date,
            venue
        });
    }

    static async delete(activityId) {
        return Activity.delete(activityId);
    }

    static async hasAttendance(activityId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) AS total FROM attendance WHERE activity_id = ?',
            [activityId]
        );
        return rows[0]?.total > 0;
    }

    static async getByClub(clubId) {
        return this.getAll({ club_id: clubId });
    }

    static async getUpcoming(limit = 10) {
        const activities = await Activity.getUpcoming(limit);
        return activities.map(this.normalize);
    }

    static async getPast(limit = 10) {
        const safeLimit = Math.max(1, Math.min(20, parseInt(limit, 10) || 10));
        const [rows] = await db.query(`
            SELECT a.*, c.club_name
            FROM activities a
            LEFT JOIN clubs c ON c.club_id = a.club_id
            WHERE a.activity_date < CURDATE()
            ORDER BY a.activity_date DESC, a.activity_id DESC
            LIMIT ?
        `, [safeLimit]);
        return rows.map(this.normalize);
    }

    static async getStats(clubIds = null) {
        const summary = await Activity.getSummaryCounts(clubIds);
        return {
            totalEvents: summary.totalActivities || 0,
            upcomingCount: summary.upcomingCount || 0,
            ongoingCount: summary.todayCount || 0,
            completedCount: summary.completedCount || 0,
            cancelledCount: 0
        };
    }

    static async getAttendanceCount(activityId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) AS total FROM attendance WHERE activity_id = ?',
            [activityId]
        );
        return rows[0]?.total || 0;
    }

    static async getSummaryCounts(clubIds = null) {
        const summary = await Activity.getSummaryCounts(clubIds);
        return {
            totalEvents: summary.totalActivities || 0,
            todayCount: summary.todayCount || 0,
            upcomingCount: summary.upcomingCount || 0,
            completedCount: summary.completedCount || 0
        };
    }

    static async getPaginated({ search = '', status = 'all', sort = 'upcoming', page = 1, limit = 10, club_ids = null, club_id = null }) {
        const result = await Activity.getPaginated({ search, status, sort, page, limit, club_ids, club_id });
        return {
            events: result.activities.map(this.normalize),
            pagination: result.pagination
        };
    }
}

module.exports = Event;
