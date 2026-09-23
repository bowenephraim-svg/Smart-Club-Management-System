// models/Patron.js

const db = require('../config/db');


const mapPatron = (p) => {

    if (!p) return null;

    let firstName = '';
    let lastName = '';

    if (p.full_name) {

        const parts =
            p.full_name
                .trim()
                .split(/\s+/);

        firstName =
            parts[0] || '';

        lastName =
            parts.slice(1).join(' ') || '';

    }

    return {
        ...p,
        first_name: firstName,
        last_name: lastName
    };

};


class Patron {


    // =====================================================
    // GET ALL PATRONS
    // =====================================================

    static async getAll() {

        const query = `
            SELECT
                p.*,

                COUNT(c.club_id)
                AS assigned_clubs_count

            FROM patrons p

            LEFT JOIN clubs c
                ON p.patron_id = c.patron_id

            GROUP BY
                p.patron_id

            ORDER BY
                p.full_name ASC
        `;

        const [rows] =
            await db.query(query);

        return rows.map(mapPatron);

    }


    // =====================================================
    // GET PATRON BY ID
    // =====================================================

    static async getById(id) {

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM patrons
                WHERE patron_id = ?
                `,
                [id]
            );

        return mapPatron(
            rows[0]
        ) || null;

    }


    // =====================================================
    // GET PATRON BY USER ID
    // =====================================================

    static async findByUserId(userId) {

        const [rows] =
            await db.query(
                `
                SELECT
                    p.patron_id,
                    p.user_id,
                    p.full_name,
                    p.email,
                    p.phone,
                    p.department,
                    u.profile_image

                FROM patrons p
                LEFT JOIN users u ON u.user_id = p.user_id

                WHERE p.user_id = ?

                LIMIT 1
                `,
                [userId]
            );

        return mapPatron(
            rows[0]
        ) || null;

    }


    // =====================================================
    // GET ALL PATRON USER IDS
    // USED FOR STUDENT REGISTRATION NOTIFICATIONS
    // =====================================================

    static async getAllPatronUserIds() {

        const [rows] =
            await db.query(
                `
                SELECT DISTINCT
                    p.user_id

                FROM patrons p

                INNER JOIN users u
                    ON p.user_id = u.user_id

                WHERE
                    p.user_id IS NOT NULL

                AND u.role = 'Patron'
                `
            );

        return rows.map(
            row => row.user_id
        );

    }


    // =====================================================
    // GET ASSIGNED CLUBS
    // =====================================================

    static async getAssignedClubs(
        patronId
    ) {

        if (!patronId) {
            return [];
        }

        const [rows] =
            await db.query(
                `
                SELECT

                    c.club_id,
                    c.club_name,
                    c.description,
                    c.meeting_day,
                    c.venue,
                    c.created_at,

                    COUNT(
                        CASE
                            WHEN m.status = 'Active'
                            THEN m.membership_id
                        END
                    ) AS active_member_count,

                    COUNT(
                        CASE
                            WHEN m.status = 'Pending'
                            THEN m.membership_id
                        END
                    ) AS pending_member_count

                FROM clubs c

                LEFT JOIN memberships m
                    ON c.club_id = m.club_id

                WHERE c.patron_id = ?

                GROUP BY
                    c.club_id

                ORDER BY
                    c.club_name ASC
                `,
                [patronId]
            );

        return rows;

    }


    // =====================================================
    // GET PATRON CONTEXT (Role-aware patron resolver)
    // =====================================================

    static async getPatronContext(req) {
        const user = req.session?.user;
        if (!user || user.role !== 'Patron') {
            return {
                isPatron: false,
                patron: null,
                clubs: [],
                clubIds: null
            };
        }

        const userId = user.id || user.user_id;
        const userEmail = user.email || '';

        const [rows] = await db.query(
            `
            SELECT
                p.patron_id,
                p.user_id,
                p.full_name,
                p.email,
                p.phone,
                p.department,
                u.profile_image
            FROM patrons p
            LEFT JOIN users u ON u.user_id = p.user_id
            WHERE p.user_id = ? OR (p.email IS NOT NULL AND LOWER(p.email) = LOWER(?))
            LIMIT 1
            `,
            [userId, userEmail]
        );

        if (!rows || rows.length === 0 || !rows[0].patron_id) {
            return {
                isPatron: true,
                patron: {
                    patron_id: null,
                    user_id: userId,
                    full_name: user.full_name || user.name || 'Patron',
                    email: user.email,
                    phone: null,
                    department: null,
                    profile_image: user.profile_image || null
                },
                clubs: [],
                clubIds: []
            };
        }

        const patron = mapPatron(rows[0]);

        if (!rows[0].user_id && userId) {
            await db.query(
                `UPDATE patrons SET user_id = ? WHERE patron_id = ?`,
                [userId, patron.patron_id]
            );
            patron.user_id = userId;
        }

        const clubs = await this.getAssignedClubs(patron.patron_id);
        const clubIds = clubs.map(c => c.club_id);

        return {
            isPatron: true,
            patron,
            clubs,
            clubIds
        };
    }

    static async canManageClub(req, clubId) {
        const patronCtx = await this.getPatronContext(req);
        return !patronCtx.isPatron || patronCtx.clubIds.includes(Number(clubId));
    }


    // =====================================================
    // GET CLUB MEMBERS
    // =====================================================

    static async getClubMembers(
        clubIds,
        limit = 10
    ) {

        if (
            !clubIds ||
            clubIds.length === 0
        ) {
            return [];
        }

        const placeholders =
            clubIds
                .map(() => '?')
                .join(', ');

        const safeLimit =
            Math.max(
                1,
                Math.min(
                    Number(limit) || 10,
                    100
                )
            );

        const [rows] =
            await db.query(
                `
                SELECT

                    m.membership_id,
                    m.club_id,
                    m.join_date,
                    m.status,

                    s.student_id,
                    s.admission_no,
                    s.first_name,
                    s.last_name,
                    s.class,
                    s.stream,

                    c.club_name,

                    COALESCE(
                        r.position,
                        'Member'
                    ) AS club_role

                FROM memberships m

                JOIN students s
                    ON m.student_id = s.student_id

                JOIN clubs c
                    ON m.club_id = c.club_id

                LEFT JOIN roles r
                    ON m.membership_id =
                       r.membership_id

                WHERE
                    m.club_id IN (${placeholders})

                AND m.status = 'Active'

                ORDER BY
                    m.join_date DESC

                LIMIT ?
                `,
                [
                    ...clubIds,
                    safeLimit
                ]
            );

        return rows;

    }


    // =====================================================
    // GET PENDING MEMBERSHIPS
    // =====================================================

    static async getPendingMemberships(
        clubIds
    ) {

        if (
            !clubIds ||
            clubIds.length === 0
        ) {
            return [];
        }

        const placeholders =
            clubIds
                .map(() => '?')
                .join(', ');

        const [rows] =
            await db.query(
                `
                SELECT

                    m.membership_id,
                    m.club_id,
                    m.join_date,
                    m.status,

                    CONCAT(
                        s.first_name,
                        ' ',
                        s.last_name
                    ) AS student_name,

                    s.admission_no,
                    s.class,

                    c.club_name

                FROM memberships m

                JOIN students s
                    ON m.student_id = s.student_id

                JOIN clubs c
                    ON m.club_id = c.club_id

                WHERE
                    m.club_id IN (${placeholders})

                AND m.status = 'Pending'

                ORDER BY
                    m.join_date DESC
                `,
                clubIds
            );

        return rows;

    }


    // =====================================================
    // UPCOMING ACTIVITIES
    // =====================================================

    static async getUpcomingActivities(
        clubIds,
        limit = 8
    ) {

        if (
            !clubIds ||
            clubIds.length === 0
        ) {
            return [];
        }

        const placeholders =
            clubIds
                .map(() => '?')
                .join(', ');

        const safeLimit =
            Math.max(
                1,
                Math.min(
                    Number(limit) || 8,
                    100
                )
            );

        const [rows] =
            await db.query(
                `
                SELECT

                    a.activity_id,
                    a.activity_name,
                    a.description,
                    a.activity_date,
                    a.venue,

                    c.club_name,

                    CASE

                        WHEN a.activity_date < CURDATE()
                            THEN 'Completed'

                        WHEN a.activity_date = CURDATE()
                            THEN 'Today'

                        ELSE 'Upcoming'

                    END AS status

                FROM activities a

                JOIN clubs c
                    ON a.club_id = c.club_id

                WHERE
                    a.club_id IN (${placeholders})

                AND a.activity_date >= CURDATE()

                ORDER BY
                    a.activity_date ASC

                LIMIT ?
                `,
                [
                    ...clubIds,
                    safeLimit
                ]
            );

        return rows;

    }


    // =====================================================
    // ATTENDANCE SUMMARY
    // =====================================================

    static async getAttendanceSummary(
        clubIds
    ) {

        if (
            !clubIds ||
            clubIds.length === 0
        ) {

            return {
                total: 0,
                present: 0,
                absent: 0,
                rate: 0
            };

        }

        const placeholders =
            clubIds
                .map(() => '?')
                .join(', ');

        const [rows] =
            await db.query(
                `
                SELECT

                    COUNT(*) AS total,

                    SUM(
                        CASE
                            WHEN att.status = 'Present'
                            THEN 1
                            ELSE 0
                        END
                    ) AS present,

                    SUM(
                        CASE
                            WHEN att.status = 'Absent'
                            THEN 1
                            ELSE 0
                        END
                    ) AS absent

                FROM attendance att

                JOIN activities a
                    ON att.activity_id =
                       a.activity_id

                WHERE
                    a.club_id IN (${placeholders})
                `,
                clubIds
            );

        const row =
            rows[0] || {};

        const total =
            Number(row.total || 0);

        const present =
            Number(row.present || 0);

        const absent =
            Number(row.absent || 0);

        const rate =
            total > 0
                ? Math.round(
                    (present / total) * 100
                )
                : 0;

        return {
            total,
            present,
            absent,
            rate
        };

    }


    // =====================================================
    // RECENT ACHIEVEMENTS
    // =====================================================

    static async getRecentAchievements(
        clubIds,
        limit = 6
    ) {

        if (
            !clubIds ||
            clubIds.length === 0
        ) {
            return [];
        }

        const placeholders =
            clubIds
                .map(() => '?')
                .join(', ');

        const safeLimit =
            Math.max(
                1,
                Math.min(
                    Number(limit) || 6,
                    100
                )
            );

        const [rows] =
            await db.query(
                `
                SELECT

                    a.achievement_id,
                    a.title,
                    a.description,
                    a.category,
                    a.achievement_date,
                    a.position,
                    a.award,
                    a.status,

                    c.club_name,

                    CONCAT(
                        s.first_name,
                        ' ',
                        s.last_name
                    ) AS student_name,

                    s.admission_no

                FROM achievements a

                LEFT JOIN clubs c
                    ON a.club_id = c.club_id

                LEFT JOIN students s
                    ON a.student_id = s.student_id

                WHERE
                    a.club_id IN (${placeholders})

                ORDER BY
                    a.achievement_date DESC,
                    a.created_at DESC

                LIMIT ?
                `,
                [
                    ...clubIds,
                    safeLimit
                ]
            );

        return rows;

    }


    // =====================================================
    // UPCOMING EVENTS
    // =====================================================

    static async getUpcomingEvents(
        clubIds,
        limit = 6
    ) {

        return this.getUpcomingActivities(
            clubIds,
            limit
        );

    }


    // =====================================================
    // CREATE PATRON
    // =====================================================

    static async create({
        first_name,
        last_name,
        department,
        email,
        phone,
        user_id
    }) {

        const fullName =
            `${first_name} ${last_name}`.trim();

        const [result] =
            await db.query(
                `
                INSERT INTO patrons
                (
                    user_id,
                    full_name,
                    department,
                    email,
                    phone
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    user_id || null,
                    fullName,
                    department,
                    email,
                    phone || null
                ]
            );

        return result.insertId;

    }


    // =====================================================
    // CREATE PATRON AND ASSIGN CLUB
    // =====================================================

    static async createWithClub(data, clubId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const selectedClubId = Number(clubId) || null;
            if (selectedClubId) {
                const [clubs] = await connection.query(
                    `SELECT club_id, patron_id FROM clubs WHERE club_id = ? FOR UPDATE`,
                    [selectedClubId]
                );

                if (!clubs[0]) {
                    const error = new Error('The selected club could not be found.');
                    error.code = 'CLUB_NOT_FOUND';
                    throw error;
                }

                if (clubs[0].patron_id) {
                    const error = new Error('The selected club already has a patron assigned.');
                    error.code = 'CLUB_ALREADY_ASSIGNED';
                    throw error;
                }
            }

            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
            const [result] = await connection.query(
                `
                INSERT INTO patrons
                    (user_id, full_name, department, email, phone)
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    data.user_id || null,
                    fullName,
                    data.department,
                    data.email,
                    data.phone || null
                ]
            );

            if (selectedClubId) {
                await connection.query(
                    `UPDATE clubs SET patron_id = ? WHERE club_id = ?`,
                    [result.insertId, selectedClubId]
                );
            }

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }


    // =====================================================
    // UPDATE PATRON
    // =====================================================

    static async update(
        id,
        {
            first_name,
            last_name,
            department,
            email,
            phone
        }
    ) {

        const fullName =
            `${first_name} ${last_name}`.trim();

        const [result] =
            await db.query(
                `
                UPDATE patrons

                SET
                    full_name = ?,
                    department = ?,
                    email = ?,
                    phone = ?

                WHERE patron_id = ?
                `,
                [
                    fullName,
                    department,
                    email,
                    phone || null,
                    id
                ]
            );

        return result.affectedRows > 0;

    }


    // =====================================================
    // DELETE
    // =====================================================

    static async delete(id) {

        const [result] =
            await db.query(
                `
                DELETE FROM patrons
                WHERE patron_id = ?
                `,
                [id]
            );

        return result.affectedRows > 0;

    }

}

module.exports = Patron;
