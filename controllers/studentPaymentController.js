const db = require('../config/db');

// ==========================================
// SHOW PAYMENT PAGE
// ==========================================
exports.showPaymentPage = async (req, res) => {

    try {

        const studentId = req.query.student_id;

        const [students] = await db.query(
            `
            SELECT *
            FROM students
            WHERE student_id = ?
            `,
            [studentId]
        );

        if (students.length === 0) {

            return res.send("Student not found.");

        }

        res.render('students/payment', {

            student: students[0]

        });

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

};

// ==========================================
// PROCESS PAYMENT
// ==========================================
exports.processPayment = async (req, res) => {

    const {

        student_id,
        payment_method,
        transaction_code

    } = req.body;

    let connection;

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Get student
        const [students] = await connection.query(
            `
            SELECT *
            FROM students
            WHERE student_id = ?
            `,
            [student_id]
        );

        if (students.length === 0) {

            throw new Error("Student not found.");

        }

        const student = students[0];

        // Save payment
        await connection.query(
            `
            INSERT INTO payments
            (
                student_id,
                amount,
                payment_date,
                payment_method,
                payment_type,
                transaction_code,
                status
            )
            VALUES
            (?, ?, CURDATE(), ?, 'Registration', ?, 'Paid')
            `,
            [
                student.student_id,
                500,
                payment_method,
                transaction_code
            ]
        );

        // Update account status
        await connection.query(
            `
            UPDATE users
            SET status='Pending Approval'
            WHERE user_id=?
            `,
            [student.user_id]
        );

        // Create notification for admin (user_id 1 = System Administrator)
        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                message,
                type,
                status,
                related_id
            )
            VALUES
            (
                1,
                ?,
                'student_registration',
                'Unread',
                ?
            )
            `,
            [
                `${student.first_name} ${student.last_name} has completed registration payment.`,
                student.student_id
            ]
        );

        await connection.commit();

        connection.release();

        res.render('students/paymentSuccess', {

            student

        });

    } catch (err) {

        if (connection) {

            await connection.rollback();
            connection.release();

        }

        console.error(err);

        res.status(500).send(err.message);

    }

};