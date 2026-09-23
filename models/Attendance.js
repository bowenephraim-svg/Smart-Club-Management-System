// models/Attendance.js
const db = require('../config/db');

class Attendance {

    // ==========================================
    // INITIALIZE ROSTER FOR ACTIVITY
    // ==========================================
    static async initializeRosterForActivity(activity_id, club_id) {
        const rosterQuery = `
            SELECT student_id
            FROM memberships
            WHERE club_id = ? AND status = 'Active'
        `;

        const [members] = await db.query(rosterQuery, [club_id]);

        if (members.length === 0) return 0;

        const checkQuery = `
            SELECT COUNT(*) AS count
            FROM attendance
            WHERE activity_id = ?
        `;

        const [existing] = await db.query(checkQuery, [activity_id]);

        if (existing[0].count > 0) {
            return existing[0].count;
        }

        const insertQuery = `
            INSERT INTO attendance
            (activity_id, student_id, attendance_date, status)
            VALUES (?, ?, CURRENT_DATE(), 'Absent')
        `;

        for (const member of members) {
            await db.query(insertQuery, [
                activity_id,
                member.student_id
            ]);
        }

        return members.length;
    }


    // ==========================================
    // GET SHEET BY ACTIVITY
    // ==========================================
    static async getSheetByActivity(activity_id) {

        const query = `
            SELECT
                a.attendance_id,
                a.activity_id,
                a.student_id,
                a.attendance_date,
                a.status,

                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                s.stream,

                act.activity_name,
                c.club_name

            FROM attendance a

            JOIN students s
                ON a.student_id = s.student_id

            JOIN activities act
                ON a.activity_id = act.activity_id

            JOIN clubs c
                ON act.club_id = c.club_id

            WHERE a.activity_id = ?

            ORDER BY s.last_name ASC, s.first_name ASC
        `;

        const [rows] = await db.query(query, [activity_id]);

        return rows;
    }


    // ==========================================
    // UPDATE STATUS
    // ==========================================
    static async updateStatus(
        activity_id,
        student_id,
        status
    ) {

        const validStatuses = [
            'Present',
            'Absent'
        ];

        if (!validStatuses.includes(status)) {
            throw new Error('Invalid attendance status.');
        }

        const query = `
            UPDATE attendance
            SET status = ?
            WHERE activity_id = ?
            AND student_id = ?
        `;

        const [result] = await db.query(query, [
            status,
            activity_id,
            student_id
        ]);

        return result.affectedRows > 0;
    }


    // ==========================================
    // GET ALL ATTENDANCE
    // ==========================================
    static async getAll(filters = {}) {

        const conditions = [];
        const values = [];

        if (filters.club_id) {
            conditions.push('act.club_id = ?');
            values.push(filters.club_id);
        } else if (filters.club_ids) {
            if (filters.club_ids.length > 0) {
                conditions.push(`act.club_id IN (${filters.club_ids.map(() => '?').join(',')})`);
                values.push(...filters.club_ids);
            } else {
                conditions.push('1=0');
            }
        }

        if (filters.activity_id) {
            conditions.push('a.activity_id = ?');
            values.push(filters.activity_id);
        }

        if (filters.student_id) {
            conditions.push('a.student_id = ?');
            values.push(filters.student_id);
        }

        if (filters.status) {
            conditions.push('a.status = ?');
            values.push(filters.status);
        }

        if (filters.date_from) {
            conditions.push('a.attendance_date >= ?');
            values.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push('a.attendance_date <= ?');
            values.push(filters.date_to);
        }

        if (filters.search) {

            conditions.push(`
                (
                    s.first_name LIKE ?
                    OR s.last_name LIKE ?
                    OR s.admission_no LIKE ?
                    OR act.activity_name LIKE ?
                    OR c.club_name LIKE ?
                )
            `);

            const term = `%${filters.search}%`;

            values.push(
                term,
                term,
                term,
                term,
                term
            );
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const query = `
            SELECT

                a.attendance_id,
                a.activity_id,
                a.student_id,
                a.attendance_date,
                a.status,

                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                s.stream,

                act.activity_name,
                c.club_name

            FROM attendance a

            JOIN students s
                ON a.student_id = s.student_id

            JOIN activities act
                ON a.activity_id = act.activity_id

            JOIN clubs c
                ON act.club_id = c.club_id

            ${whereClause}

            ORDER BY
                a.attendance_date DESC,
                a.attendance_id DESC
        `;

        const [rows] = await db.query(query, values);

        return rows;
    }


    // ==========================================
    // GET BY ID
    // ==========================================
    static async getById(id) {

        const query = `
            SELECT

                a.attendance_id,
                a.activity_id,
                a.student_id,
                a.attendance_date,
                a.status,

                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                s.stream,

                act.activity_name,
                c.club_name

            FROM attendance a

            JOIN students s
                ON a.student_id = s.student_id

            JOIN activities act
                ON a.activity_id = act.activity_id

            JOIN clubs c
                ON act.club_id = c.club_id

            WHERE a.attendance_id = ?
        `;

        const [rows] = await db.query(query, [id]);

        return rows[0] || null;
    }


    // ==========================================
    // GET BY STUDENT
    // ==========================================
    static async getByStudent(studentId, filters = {}) {

        const conditions = [
            'a.student_id = ?'
        ];

        const values = [
            studentId
        ];

        if (filters.club_id) {
            conditions.push('act.club_id = ?');
            values.push(filters.club_id);
        }

        if (filters.status) {
            conditions.push('a.status = ?');
            values.push(filters.status);
        }

        if (filters.date_from) {
            conditions.push('a.attendance_date >= ?');
            values.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push('a.attendance_date <= ?');
            values.push(filters.date_to);
        }

        const query = `
            SELECT

                a.attendance_id,
                a.activity_id,
                a.attendance_date,
                a.status,

                act.activity_name,
                c.club_name

            FROM attendance a

            JOIN activities act
                ON a.activity_id = act.activity_id

            JOIN clubs c
                ON act.club_id = c.club_id

            WHERE ${conditions.join(' AND ')}

            ORDER BY
                a.attendance_date DESC,
                a.attendance_id DESC
        `;

        const [rows] = await db.query(query, values);

        return rows;
    }


    // ==========================================
    // GET BY CLUB
    // ==========================================
    static async getByClub(clubId, filters = {}) {

        const conditions = [
            'c.club_id = ?'
        ];

        const values = [
            clubId
        ];

        if (filters.activity_id) {
            conditions.push('a.activity_id = ?');
            values.push(filters.activity_id);
        }

        if (filters.status) {
            conditions.push('a.status = ?');
            values.push(filters.status);
        }

        if (filters.date_from) {
            conditions.push('a.attendance_date >= ?');
            values.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push('a.attendance_date <= ?');
            values.push(filters.date_to);
        }

        if (filters.search) {

            conditions.push(`
                (
                    s.first_name LIKE ?
                    OR s.last_name LIKE ?
                    OR s.admission_no LIKE ?
                    OR act.activity_name LIKE ?
                )
            `);

            const term = `%${filters.search}%`;

            values.push(
                term,
                term,
                term,
                term
            );
        }

        const query = `
            SELECT

                a.attendance_id,
                a.activity_id,
                a.student_id,
                a.attendance_date,
                a.status,

                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                s.stream,

                act.activity_name,
                c.club_name

            FROM attendance a

            JOIN students s
                ON a.student_id = s.student_id

            JOIN activities act
                ON a.activity_id = act.activity_id

            JOIN clubs c
                ON act.club_id = c.club_id

            WHERE ${conditions.join(' AND ')}

            ORDER BY
                a.attendance_date DESC,
                a.attendance_id DESC
        `;

        const [rows] = await db.query(query, values);

        return rows;
    }


    // ==========================================
    // GET BY EVENT / ACTIVITY
    // ==========================================
    static async getByEvent(activityId) {

        const query = `
            SELECT

                a.attendance_id,
                a.student_id,
                a.attendance_date,
                a.status,

                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                s.stream

            FROM attendance a

            JOIN students s
                ON a.student_id = s.student_id

            WHERE a.activity_id = ?

            ORDER BY
                s.last_name ASC,
                s.first_name ASC
        `;

        const [rows] = await db.query(query, [
            activityId
        ]);

        return rows;
    }


    // ==========================================
    // DASHBOARD STATS
    // ==========================================
    static async getStats(filters = {}) {

        const conditions = [];
        const values = [];

        if (filters.club_id) {
            conditions.push('act.club_id = ?');
            values.push(filters.club_id);
        } else if (filters.club_ids) {
            if (filters.club_ids.length > 0) {
                conditions.push(`act.club_id IN (${filters.club_ids.map(() => '?').join(',')})`);
                values.push(...filters.club_ids);
            } else {
                conditions.push('1=0');
            }
        }

        if (filters.activity_id) {
            conditions.push('a.activity_id = ?');
            values.push(filters.activity_id);
        }

        if (filters.date_from) {
            conditions.push('a.attendance_date >= ?');
            values.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push('a.attendance_date <= ?');
            values.push(filters.date_to);
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const query = `
            SELECT

                COUNT(*) AS totalRecords,

                SUM(
                    CASE
                        WHEN a.status = 'Present'
                        THEN 1
                        ELSE 0
                    END
                ) AS presentCount,

                SUM(
                    CASE
                        WHEN a.status = 'Absent'
                        THEN 1
                        ELSE 0
                    END
                ) AS absentCount,

                COUNT(DISTINCT a.activity_id)
                    AS totalActivities,

                COUNT(DISTINCT a.student_id)
                    AS totalStudents

            FROM attendance a

            JOIN activities act
                ON a.activity_id = act.activity_id

            ${whereClause}
        `;

        const [rows] = await db.query(
            query,
            values
        );

        const stats = rows[0] || {};

        const total =
            Number(stats.totalRecords || 0);

        const present =
            Number(stats.presentCount || 0);

        const attendanceRate =
            total > 0
                ? Math.round((present / total) * 100)
                : 0;

        return {
            totalRecords: total,
            presentCount: present,
            absentCount:
                Number(stats.absentCount || 0),
            totalActivities:
                Number(stats.totalActivities || 0),
            totalStudents:
                Number(stats.totalStudents || 0),
            attendanceRate
        };
    }


    // ==========================================
    // STUDENT STATS
    // ==========================================
    static async getStudentStats(studentId) {

        const query = `
            SELECT

                COUNT(*) AS totalRecords,

                SUM(
                    CASE
                        WHEN status = 'Present'
                        THEN 1
                        ELSE 0
                    END
                ) AS presentCount,

                SUM(
                    CASE
                        WHEN status = 'Absent'
                        THEN 1
                        ELSE 0
                    END
                ) AS absentCount,

                COUNT(DISTINCT activity_id)
                    AS totalActivities

            FROM attendance

            WHERE student_id = ?
        `;

        const [rows] = await db.query(
            query,
            [studentId]
        );

        const stats = rows[0] || {};

        const total =
            Number(stats.totalRecords || 0);

        const present =
            Number(stats.presentCount || 0);

        return {
            totalRecords: total,
            presentCount: present,
            absentCount:
                Number(stats.absentCount || 0),
            totalActivities:
                Number(stats.totalActivities || 0),
            attendanceRate:
                total > 0
                    ? Math.round((present / total) * 100)
                    : 0
        };
    }


    // ==========================================
    // CLUB STATS
    // ==========================================
    static async getClubStats(clubId) {

        const query = `
            SELECT

                COUNT(*) AS totalRecords,

                SUM(
                    CASE
                        WHEN a.status = 'Present'
                        THEN 1
                        ELSE 0
                    END
                ) AS presentCount,

                SUM(
                    CASE
                        WHEN a.status = 'Absent'
                        THEN 1
                        ELSE 0
                    END
                ) AS absentCount,

                COUNT(DISTINCT a.activity_id)
                    AS totalActivities,

                COUNT(DISTINCT a.student_id)
                    AS totalStudents

            FROM attendance a

            JOIN activities act
                ON a.activity_id = act.activity_id

            WHERE act.club_id = ?
        `;

        const [rows] = await db.query(
            query,
            [clubId]
        );

        const stats = rows[0] || {};

        const total =
            Number(stats.totalRecords || 0);

        const present =
            Number(stats.presentCount || 0);

        return {
            totalRecords: total,
            presentCount: present,
            absentCount:
                Number(stats.absentCount || 0),
            totalActivities:
                Number(stats.totalActivities || 0),
            totalStudents:
                Number(stats.totalStudents || 0),
            attendanceRate:
                total > 0
                    ? Math.round((present / total) * 100)
                    : 0
        };
    }


    // ==========================================
    // EVENT STATS
    // ==========================================
    static async getEventStats(activityId) {

        const query = `
            SELECT

                COUNT(*) AS totalRecords,

                SUM(
                    CASE
                        WHEN status = 'Present'
                        THEN 1
                        ELSE 0
                    END
                ) AS presentCount,

                SUM(
                    CASE
                        WHEN status = 'Absent'
                        THEN 1
                        ELSE 0
                    END
                ) AS absentCount,

                COUNT(DISTINCT student_id)
                    AS totalStudents

            FROM attendance

            WHERE activity_id = ?
        `;

        const [rows] = await db.query(
            query,
            [activityId]
        );

        const stats = rows[0] || {};

        const total =
            Number(stats.totalRecords || 0);

        const present =
            Number(stats.presentCount || 0);

        return {
            totalRecords: total,
            presentCount: present,
            absentCount:
                Number(stats.absentCount || 0),
            totalStudents:
                Number(stats.totalStudents || 0),
            attendanceRate:
                total > 0
                    ? Math.round((present / total) * 100)
                    : 0
        };
    }


    // ==========================================
    // CREATE
    // ==========================================
    static async create(data) {

        const {
            activity_id,
            student_id,
            status,
            attendance_date
        } = data;

        const validStatuses = [
            'Present',
            'Absent'
        ];

        if (!validStatuses.includes(status)) {
            throw new Error(
                'Invalid attendance status.'
            );
        }

        const query = `
            INSERT INTO attendance
            (
                activity_id,
                student_id,
                attendance_date,
                status
            )
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await db.query(
            query,
            [
                activity_id,
                student_id,
                attendance_date ||
                    new Date()
                        .toISOString()
                        .split('T')[0],
                status
            ]
        );

        return result.insertId;
    }


    // ==========================================
    // BULK CREATE
    // ==========================================
    static async bulkCreate(
        activityId,
        records
    ) {

        const connection =
            await db.getConnection();

        try {

            await connection.beginTransaction();

            const [activity] =
                await connection.query(
                    `
                    SELECT club_id
                    FROM activities
                    WHERE activity_id = ?
                    `,
                    [activityId]
                );

            if (activity.length === 0) {
                throw new Error(
                    'Activity not found.'
                );
            }

            const clubId =
                activity[0].club_id;

            const [members] =
                await connection.query(
                    `
                    SELECT student_id
                    FROM memberships
                    WHERE club_id = ?
                    AND status = 'Active'
                    `,
                    [clubId]
                );

            if (members.length === 0) {
                throw new Error(
                    'No active members found for this club.'
                );
            }

            await connection.query(
                `
                DELETE FROM attendance
                WHERE activity_id = ?
                `,
                [activityId]
            );

            const insertQuery = `
                INSERT INTO attendance
                (
                    activity_id,
                    student_id,
                    attendance_date,
                    status
                )
                VALUES (?, ?, ?, ?)
            `;

            const today =
                new Date()
                    .toISOString()
                    .split('T')[0];

            for (const member of members) {

                const record =
                    records.find(
                        r =>
                            parseInt(r.student_id) ===
                            member.student_id
                    );

                const status =
                    record &&
                    ['Present', 'Absent']
                        .includes(record.status)
                        ? record.status
                        : 'Absent';

                await connection.query(
                    insertQuery,
                    [
                        activityId,
                        member.student_id,
                        today,
                        status
                    ]
                );
            }

            await connection.commit();

            return members.length;

        } catch (err) {

            await connection.rollback();

            throw err;

        } finally {

            connection.release();
        }
    }


    // ==========================================
    // UPDATE RECORD
    // ==========================================
    static async update(id, data) {

        const {
            status,
            attendance_date
        } = data;

        const validStatuses = [
            'Present',
            'Absent'
        ];

        if (
            status &&
            !validStatuses.includes(status)
        ) {
            throw new Error(
                'Invalid attendance status.'
            );
        }

        const fields = [];
        const values = [];

        if (status) {
            fields.push('status = ?');
            values.push(status);
        }

        if (attendance_date) {
            fields.push(
                'attendance_date = ?'
            );

            values.push(attendance_date);
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(id);

        const query = `
            UPDATE attendance
            SET ${fields.join(', ')}
            WHERE attendance_id = ?
        `;

        const [result] =
            await db.query(
                query,
                values
            );

        return result.affectedRows > 0;
    }


    // ==========================================
    // DELETE
    // ==========================================
    static async delete(id) {

        const [result] =
            await db.query(
                `
                DELETE FROM attendance
                WHERE attendance_id = ?
                `,
                [id]
            );

        return result.affectedRows > 0;
    }


    // ==========================================
    // EXISTS
    // ==========================================
    static async exists(
        activityId,
        studentId
    ) {

        const [rows] =
            await db.query(
                `
                SELECT attendance_id
                FROM attendance
                WHERE activity_id = ?
                AND student_id = ?
                `,
                [
                    activityId,
                    studentId
                ]
            );

        return rows.length > 0;
    }


    // ==========================================
    // RECENT ATTENDANCE
    // ==========================================
    static async getRecent(limit = 10, clubIds = null) {

        let whereClause = '';
        const params = [];

        if (clubIds) {
            if (clubIds.length > 0) {
                whereClause = `WHERE act.club_id IN (${clubIds.map(() => '?').join(',')})`;
                params.push(...clubIds);
            } else {
                whereClause = 'WHERE 1=0';
            }
        }

        const query = `
            SELECT

                a.attendance_id,
                a.attendance_date,
                a.status,

                s.first_name,
                s.last_name,
                s.admission_no,

                act.activity_name,
                c.club_name

            FROM attendance a

            JOIN students s
                ON a.student_id = s.student_id

            JOIN activities act
                ON a.activity_id = act.activity_id

            JOIN clubs c
                ON act.club_id = c.club_id

            ${whereClause}

            ORDER BY
                a.attendance_date DESC,
                a.attendance_id DESC

            LIMIT ?
        `;

        params.push(limit);

        const [rows] =
            await db.query(
                query,
                params
            );

        return rows;
    }


    // ==========================================
    // MONTHLY STATS
    // ==========================================
    static async getMonthlyStats(
        months = 6,
        clubIds = null
    ) {

        const conditions = [
            'a.attendance_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)'
        ];
        const params = [months];

        if (clubIds) {
            if (clubIds.length > 0) {
                conditions.push(`act.club_id IN (${clubIds.map(() => '?').join(',')})`);
                params.push(...clubIds);
            } else {
                conditions.push('1=0');
            }
        }

        const query = `
            SELECT

                DATE_FORMAT(
                    a.attendance_date,
                    '%Y-%m'
                ) AS month,

                DATE_FORMAT(
                    a.attendance_date,
                    '%b %Y'
                ) AS month_label,

                COUNT(*) AS totalRecords,

                SUM(
                    CASE
                        WHEN a.status = 'Present'
                        THEN 1
                        ELSE 0
                    END
                ) AS presentCount,

                SUM(
                    CASE
                        WHEN a.status = 'Absent'
                        THEN 1
                        ELSE 0
                    END
                ) AS absentCount

            FROM attendance a

            JOIN activities act
                ON a.activity_id = act.activity_id

            WHERE ${conditions.join(' AND ')}

            GROUP BY
                DATE_FORMAT(
                    a.attendance_date,
                    '%Y-%m'
                ),
                DATE_FORMAT(
                    a.attendance_date,
                    '%b %Y'
                )

            ORDER BY month ASC
        `;

        const [rows] =
            await db.query(
                query,
                params
            );

        return rows;
    }


    // ==========================================
    // LOW ATTENDANCE
    // ==========================================
    static async getLowAttendance(
        threshold = 70,
        clubId = null,
        clubIds = null
    ) {

        const conditions = [];
        const values = [];

        if (clubId) {

            conditions.push(
                'act.club_id = ?'
            );

            values.push(clubId);
        } else if (clubIds) {
            if (clubIds.length > 0) {
                conditions.push(`act.club_id IN (${clubIds.map(() => '?').join(',')})`);
                values.push(...clubIds);
            } else {
                conditions.push('1=0');
            }
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const query = `
            SELECT

                s.student_id,
                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                s.stream,

                c.club_name,

                COUNT(*) AS totalSessions,

                SUM(
                    CASE
                        WHEN a.status = 'Present'
                        THEN 1
                        ELSE 0
                    END
                ) AS presentSessions,

                ROUND(
                    (
                        SUM(
                            CASE
                                WHEN a.status = 'Present'
                                THEN 1
                                ELSE 0
                            END
                        )
                        / COUNT(*)
                    ) * 100,
                    1
                ) AS attendanceRate

            FROM attendance a

            JOIN students s
                ON a.student_id = s.student_id

            JOIN activities act
                ON a.activity_id = act.activity_id

            JOIN clubs c
                ON act.club_id = c.club_id

            ${whereClause}

            GROUP BY
                s.student_id,
                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                s.stream,
                c.club_name

            HAVING attendanceRate < ?

            ORDER BY attendanceRate ASC
        `;

        values.push(threshold);

        const [rows] =
            await db.query(
                query,
                values
            );

        return rows;
    }
}

module.exports = Attendance;