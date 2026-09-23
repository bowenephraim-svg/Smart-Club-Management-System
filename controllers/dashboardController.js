const db = require('../config/db');

exports.dashboard = async (req, res) => {
    try {
        // =====================================================
        // DASHBOARD STATISTICS
        // =====================================================

        const [[studentCount]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM students
        `);

        const [[clubCount]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM clubs
        `);

        const [[membershipCount]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM memberships
            WHERE status = 'Active'
        `);

        const [[patronCount]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM users
            WHERE role = 'Patron'
        `);


        // =====================================================
        // FINANCE / REVENUE
        // Sum total collected payments
        // =====================================================

        const [[finance]] = await db.query(`
            SELECT
                IFNULL(SUM(amount), 0) AS total
            FROM payments
            WHERE status = 'Paid'
        `);

        const totalRevenue = Number(finance.total || 0);


        // =====================================================
        // RECENT STUDENTS
        // =====================================================

        const [recentStudents] = await db.query(`
            SELECT
                s.student_id,
                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,

                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM memberships m
                        WHERE m.student_id = s.student_id
                        AND m.status = 'Active'
                    )
                    THEN 'Active'
                    ELSE 'Inactive'
                END AS status

            FROM students s

            ORDER BY s.student_id DESC
            LIMIT 5
        `);


       // =====================================================
    // ACTIVE PATRONS
     // =====================================================

const [activePatrons] = await db.query(`
    SELECT
        p.patron_id,
        p.full_name,
        p.email,
        p.department,

        SUBSTRING_INDEX(TRIM(p.full_name), ' ', 1) AS first_name,

        CASE
            WHEN LOCATE(' ', TRIM(p.full_name)) > 0
            THEN SUBSTRING(
                TRIM(p.full_name),
                LOCATE(' ', TRIM(p.full_name)) + 1
            )
            ELSE ''
        END AS last_name

    FROM patrons p

    ORDER BY p.full_name ASC
    LIMIT 5
`);


        // =====================================================
        // UNREAD STUDENT REGISTRATION NOTIFICATIONS
        // =====================================================

        const [notifications] = await db.query(`
            SELECT
                n.notification_id,
                n.message,
                n.created_at,
                n.related_id,

                s.first_name,
                s.last_name,
                s.admission_no,
                s.class

            FROM notifications n

            LEFT JOIN students s
                ON s.student_id = n.related_id

            WHERE
                n.type = 'Student Registration'
                AND n.status = 'Unread'

            ORDER BY n.created_at DESC

            LIMIT 10
        `);


        // =====================================================
        // PENDING STUDENT APPROVALS
        // =====================================================

        const [pendingStudents] = await db.query(`
            SELECT
                u.user_id,
                u.email,
                u.status,

                s.student_id,
                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                s.stream,

                p.payment_date,
                p.amount,
                p.payment_method,
                p.transaction_code

            FROM users u

            INNER JOIN students s
                ON s.user_id = u.user_id

            LEFT JOIN payments p
                ON p.student_id = s.student_id
                AND p.status = 'Paid'

            WHERE
                u.role = 'Student'
                AND u.status = 'Pending Approval'

            ORDER BY
                p.payment_date DESC,
                s.student_id DESC
        `);


        // =====================================================
        // DASHBOARD STATS OBJECT
        // =====================================================

        const stats = {
            totalStudents: Number(studentCount.total || 0),
            totalClubs: Number(clubCount.total || 0),
            totalMemberships: Number(membershipCount.total || 0),
            totalPatrons: Number(patronCount.total || 0),
            totalRevenue
        };


        // =====================================================
        // RENDER DASHBOARD
        // =====================================================

        res.render('dashboard/dashboard', {
            stats,
            recentStudents,
            activePatrons,
            notifications,
            pendingStudents
        });

    } catch (err) {
        console.error('Dashboard error:', err);

        res.status(500).send(
            'Unable to load dashboard: ' + err.message
        );
    }
};