// models/Membership.js

const db = require('../config/db');

class Membership {


    // =====================================================
    // GET ALL MEMBERSHIPS
    // ADMIN VIEW
    // =====================================================

    static async getAll() {

        const [rows] = await db.query(`
            SELECT
                m.*,
                s.admission_no,
                s.first_name AS student_first,
                s.last_name AS student_last,
                s.class AS form,
                s.stream,
                c.club_name,
                COALESCE(r.position, 'Member') AS role
            FROM memberships m
            JOIN students s
                ON m.student_id = s.student_id
            JOIN clubs c
                ON m.club_id = c.club_id
            LEFT JOIN roles r
                ON m.membership_id = r.membership_id
            ORDER BY m.join_date DESC
        `);

        return rows.map(row => {

            let form = 1;

            if (row.form) {

                const match =
                    String(row.form).match(
                        /Form\s+(\d+)/i
                    );

                if (match) {
                    form =
                        parseInt(
                            match[1],
                            10
                        );
                }

            }

            return {
                ...row,
                form,
                category: 'General'
            };

        });

    }


    // =====================================================
    // CREATE MEMBERSHIP
    // =====================================================

    static async create({
        student_id,
        club_id,
        role,
        join_date
    }) {

        // ---------------------------------------------
        // Check club
        // ---------------------------------------------

        const [clubRows] =
            await db.query(
                `
                SELECT *
                FROM clubs
                WHERE club_id = ?
                `,
                [club_id]
            );

        if (!clubRows[0]) {

            throw new Error(
                'The selected club does not exist.'
            );

        }


        // ---------------------------------------------
        // Capacity
        // ---------------------------------------------

        const capacity =
            clubRows[0].capacity || 50;


        const [countRows] =
            await db.query(
                `
                SELECT COUNT(*) AS total
                FROM memberships
                WHERE club_id = ?
                AND status = 'Active'
                `,
                [club_id]
            );


        if (
            Number(countRows[0].total) >=
            Number(capacity)
        ) {

            throw new Error(
                'This club has reached its maximum membership capacity.'
            );

        }


        // ---------------------------------------------
        // Duplicate
        // ---------------------------------------------

        const [dupRows] =
            await db.query(
                `
                SELECT *
                FROM memberships
                WHERE student_id = ?
                AND club_id = ?
                `,
                [
                    student_id,
                    club_id
                ]
            );


        if (dupRows.length > 0) {

            const existing =
                dupRows[0];


            if (existing.status === 'Pending') {

                throw new Error(
                    'You already have a pending request for this club.'
                );

            }


            if (existing.status === 'Active') {

                throw new Error(
                    'You are already a member of this club.'
                );

            }


            if (existing.status === 'Rejected') {

                const [result] =
                    await db.query(
                        `
                        UPDATE memberships
                        SET
                            status = 'Pending',
                            join_date = ?,
                            approved_by = NULL,
                            approved_at = NULL
                        WHERE membership_id = ?
                        `,
                        [
                            join_date || new Date(),
                            existing.membership_id
                        ]
                    );

                return existing.membership_id;

            }

        }


        // ---------------------------------------------
        // Create pending membership
        // ---------------------------------------------

        const [result] =
            await db.query(
                `
                INSERT INTO memberships
                (
                    student_id,
                    club_id,
                    join_date,
                    status
                )
                VALUES (?, ?, ?, 'Pending')
                `,
                [
                    student_id,
                    club_id,
                    join_date || new Date()
                ]
            );


        // ---------------------------------------------
        // Optional role
        // ---------------------------------------------

        if (
            role &&
            role !== 'Member'
        ) {

            await db.query(
                `
                INSERT INTO roles
                (
                    membership_id,
                    position,
                    start_date
                )
                VALUES (?, ?, ?)
                `,
                [
                    result.insertId,
                    role,
                    new Date()
                ]
            );

        }


        return result.insertId;

    }


    // =====================================================
    // GET MEMBERSHIP BY ID
    // =====================================================

    static async getById(id) {

        const [rows] =
            await db.query(
                `
                SELECT
                    m.*,
                    c.club_name,
                    c.description,
                    s.first_name,
                    s.last_name,
                    s.admission_no,
                    COALESCE(r.position, 'Member') AS role
                FROM memberships m
                JOIN students s
                    ON m.student_id = s.student_id
                JOIN clubs c
                    ON m.club_id = c.club_id
                LEFT JOIN roles r
                    ON m.membership_id = r.membership_id
                WHERE m.membership_id = ?
                `,
                [id]
            );

        return rows[0] || null;

    }


    // =====================================================
    // GET MEMBERSHIPS FOR STUDENT
    // =====================================================

    static async getByStudent(studentId) {

        const [rows] =
            await db.query(
                `
                SELECT
                    m.membership_id,
                    m.student_id,
                    m.club_id,
                    m.join_date,
                    m.status,
                    c.club_name,
                    c.description
                FROM memberships m
                JOIN clubs c
                    ON m.club_id = c.club_id
                WHERE m.student_id = ?
                ORDER BY m.join_date DESC
                `,
                [studentId]
            );

        return rows;

    }


    // =====================================================
    // CHECK EXISTING MEMBERSHIP
    // =====================================================

    static async alreadyJoined(
        studentId,
        clubId
    ) {

        const [rows] =
            await db.query(
                `
                SELECT
                    membership_id,
                    status
                FROM memberships
                WHERE student_id = ?
                AND club_id = ?
                `,
                [
                    studentId,
                    clubId
                ]
            );

        return rows.length > 0;

    }


    // =====================================================
    // GET AVAILABLE CLUBS
    // =====================================================

    static async getAvailableClubs(
        studentId
    ) {

        const [rows] =
            await db.query(
                `
                SELECT
                    c.*,

                    COUNT(
                        CASE
                            WHEN m2.status = 'Active'
                            THEN m2.membership_id
                        END
                    ) AS active_members

                FROM clubs c

                LEFT JOIN memberships m2
                    ON c.club_id = m2.club_id

                WHERE c.club_id NOT IN (

                    SELECT club_id
                    FROM memberships
                    WHERE student_id = ?

                )

                GROUP BY
                    c.club_id

                ORDER BY
                    c.club_name ASC
                `,
                [studentId]
            );

        return rows;

    }


    // =====================================================
    // GET ALL PENDING
    // ADMIN VIEW ONLY
    // =====================================================

    static async getPending() {

        const [rows] =
            await db.query(
                `
                SELECT
                    m.*,

                    CONCAT(
                        s.first_name,
                        ' ',
                        s.last_name
                    ) AS student_name,

                    s.admission_no,
                    c.club_name

                FROM memberships m

                JOIN students s
                    ON m.student_id = s.student_id

                JOIN clubs c
                    ON m.club_id = c.club_id

                WHERE m.status = 'Pending'

                ORDER BY
                    m.join_date DESC
                `
            );

        return rows;

    }


    // =====================================================
    // GET PENDING REQUESTS FOR ONE PATRON
    // =====================================================

    static async getPendingForPatron(
        patronId
    ) {

        if (!patronId) {
            return [];
        }

        const [rows] =
            await db.query(
                `
                SELECT

                    m.membership_id,
                    m.student_id,
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

                    c.club_name,
                                        c.description,
                                        CASE
                                                WHEN COALESCE(c.membership_fee, 0) = 0 THEN 'Not required'
                                                ELSE (
                                                        SELECT p.status
                                                        FROM payments p
                                                        WHERE p.student_id = m.student_id
                                                            AND p.club_id = m.club_id
                                                            AND p.payment_type = 'Club Fee'
                                                        ORDER BY p.payment_id DESC
                                                        LIMIT 1
                                                )
                                        END AS payment_status

                FROM memberships m

                INNER JOIN students s
                    ON m.student_id = s.student_id

                INNER JOIN clubs c
                    ON m.club_id = c.club_id

                WHERE m.status = 'Pending'

                AND c.patron_id = ?

                AND (
                    COALESCE(c.membership_fee, 0) = 0
                    OR EXISTS (
                        SELECT 1
                        FROM payments p
                        WHERE p.student_id = m.student_id
                          AND p.club_id = m.club_id
                          AND p.payment_type = 'Club Fee'
                          AND p.status <> 'Rejected'
                    )
                )

                ORDER BY
                    m.join_date DESC
                `,
                [patronId]
            );

        return rows;

    }


    // =====================================================
    // GET ONE PENDING REQUEST FOR A PATRON
    // SECURITY CHECK
    // =====================================================

    static async getPendingForPatronById(
        membershipId,
        patronId
    ) {

        const [rows] =
            await db.query(
                `
                SELECT

                    m.membership_id,
                    m.student_id,
                    m.club_id,
                    m.join_date,
                    m.status,

                    s.user_id AS student_user_id,
                    s.first_name,
                    s.last_name,
                    s.admission_no,

                    CONCAT(
                        s.first_name,
                        ' ',
                        s.last_name
                    ) AS student_name,

                    c.club_name,
                                        c.patron_id,
                                        CASE
                                                WHEN COALESCE(c.membership_fee, 0) = 0 THEN 'Not required'
                                                ELSE (
                                                        SELECT p.status
                                                        FROM payments p
                                                        WHERE p.student_id = m.student_id
                                                            AND p.club_id = m.club_id
                                                            AND p.payment_type = 'Club Fee'
                                                        ORDER BY p.payment_id DESC
                                                        LIMIT 1
                                                )
                                        END AS payment_status

                FROM memberships m

                INNER JOIN students s
                    ON m.student_id = s.student_id

                INNER JOIN clubs c
                    ON m.club_id = c.club_id

                WHERE m.membership_id = ?

                AND m.status = 'Pending'

                AND c.patron_id = ?

                AND (
                    COALESCE(c.membership_fee, 0) = 0
                    OR EXISTS (
                        SELECT 1
                        FROM payments p
                        WHERE p.student_id = m.student_id
                          AND p.club_id = m.club_id
                          AND p.payment_type = 'Club Fee'
                          AND p.status <> 'Rejected'
                    )
                )

                LIMIT 1
                `,
                [
                    membershipId,
                    patronId
                ]
            );

        return rows[0] || null;

    }


    // =====================================================
    // APPROVE MEMBERSHIP
    // =====================================================

    static async approve(
        membershipId,
        userId
    ) {

        const [result] =
            await db.query(
                `
                UPDATE memberships
                SET
                    status = 'Active',
                    approved_by = ?,
                    approved_at = NOW()

                WHERE membership_id = ?

                AND status = 'Pending'
                `,
                [
                    userId,
                    membershipId
                ]
            );

        return result.affectedRows > 0;

    }


    // =====================================================
    // REJECT MEMBERSHIP
    // =====================================================

    static async reject(
        membershipId,
        userId
    ) {

        const [result] =
            await db.query(
                `
                UPDATE memberships
                SET
                    status = 'Rejected',
                    approved_by = ?,
                    approved_at = NOW()

                WHERE membership_id = ?

                AND status = 'Pending'
                `,
                [
                    userId,
                    membershipId
                ]
            );

        return result.affectedRows > 0;

    }


    // =====================================================
    // UPDATE MEMBER ROLE
    // =====================================================

    static async updateRole(
        id,
        role
    ) {

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM roles
                WHERE membership_id = ?
                `,
                [id]
            );


        if (rows.length > 0) {

            const [result] =
                await db.query(
                    `
                    UPDATE roles
                    SET position = ?
                    WHERE membership_id = ?
                    `,
                    [
                        role,
                        id
                    ]
                );

            return result.affectedRows > 0;

        }


        const [result] =
            await db.query(
                `
                INSERT INTO roles
                (
                    membership_id,
                    position,
                    start_date
                )
                VALUES (?, ?, ?)
                `,
                [
                    id,
                    role,
                    new Date()
                ]
            );

        return result.insertId > 0;

    }


    // =====================================================
    // DELETE
    // =====================================================

    static async delete(id) {

        const [result] =
            await db.query(
                `
                DELETE FROM memberships
                WHERE membership_id = ?
                `,
                [id]
            );

        return result.affectedRows > 0;

    }

}

module.exports = Membership;