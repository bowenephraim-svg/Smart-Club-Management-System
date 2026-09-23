console.log("Loaded controller:", __filename);

const bcrypt = require('bcrypt');
const db = require('../config/db');
const Notification = require('../models/Notification');


// ==========================================
// SHOW REGISTRATION PAGE
// ==========================================

exports.renderRegisterForm = (req, res) => {

    res.render("students/register", {
        error_msg: null,
        success_msg: null
    });

};


// ==========================================
// VERIFY ADMISSION NUMBER
// ==========================================

exports.verifyAdmission = async (req, res) => {

    const { admission_no } = req.body;

    try {

        const [students] = await db.query(
            `
            SELECT *
            FROM students
            WHERE admission_no = ?
            `,
            [admission_no]
        );

        if (students.length === 0) {

            return res.render("students/register", {
                error_msg: "Admission number not found.",
                success_msg: null
            });

        }

        const student = students[0];

        return res.render("students/createAccount", {
            student
        });

    } catch (err) {

        console.error("Admission verification error:", err);

        res.status(500).send(err.message);

    }

};


// ==========================================
// CREATE STUDENT ACCOUNT
// ==========================================

// ==========================================
// CREATE STUDENT ACCOUNT
// ==========================================

exports.processRegistration = async (req, res) => {

    const {
        first_name,
        last_name,
        admission_no,
        gender,
        class: studentClass,
        stream,
        email,
        phone,
        password,
        confirm_password
    } = req.body;

    console.log("Registration Data:");
    console.log(req.body);

    let connection;

    try {

        // ==========================================
        // PASSWORD CONFIRMATION
        // ==========================================

        if (password !== confirm_password) {

            return res.render('students/register', {
                error_msg: "Passwords do not match.",
                success_msg: null
            });

        }


        // ==========================================
        // CHECK DUPLICATE EMAIL
        // ==========================================

        const [emailExists] = await db.query(
            `
            SELECT user_id
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        if (emailExists.length > 0) {

            return res.render('students/register', {
                error_msg: "Email already exists.",
                success_msg: null
            });

        }


        // ==========================================
        // CHECK DUPLICATE ADMISSION NUMBER
        // ==========================================

        const [admissionExists] = await db.query(
            `
            SELECT student_id
            FROM students
            WHERE admission_no = ?
            `,
            [admission_no]
        );

        if (admissionExists.length > 0) {

            return res.render('students/register', {
                error_msg: "Admission Number already exists.",
                success_msg: null
            });

        }


        // ==========================================
        // HASH PASSWORD
        // ==========================================

        const hashedPassword = await bcrypt.hash(password, 10);


        // ==========================================
        // START TRANSACTION
        // ==========================================

        connection = await db.getConnection();

        await connection.beginTransaction();


        // ==========================================
        // CREATE USER
        // ==========================================

        const [user] = await connection.query(
            `
            INSERT INTO users
            (
                full_name,
                email,
                password,
                role,
                status
            )
            VALUES (?, ?, ?, 'Student', 'Pending Payment')
            `,
            [
                `${first_name} ${last_name}`,
                email,
                hashedPassword
            ]
        );


        // ==========================================
        // CREATE STUDENT PROFILE
        // ==========================================

        const [studentResult] = await connection.query(
            `
            INSERT INTO students
            (
                user_id,
                admission_no,
                first_name,
                last_name,
                gender,
                class,
                stream,
                phone,
                email
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                user.insertId,
                admission_no,
                first_name,
                last_name,
                gender,
                studentClass,
                stream,
                phone,
                email
            ]
        );


        // ==========================================
        // COMMIT
        // ==========================================

        await connection.commit();

        connection.release();
        connection = null;


        // ==========================================
        // GET ALL PATRON USERS
        // ==========================================

        const [patronUsers] = await db.query(
            `
            SELECT
                u.user_id
            FROM users u
            INNER JOIN patrons p
                ON p.user_id = u.user_id
            WHERE u.role = 'Patron'
            `
        );


        // ==========================================
        // NOTIFY ALL PATRONS
        // ==========================================

        if (patronUsers.length > 0) {

            const patronUserIds = patronUsers.map(
                patron => patron.user_id
            );

            await Notification.createForUsers({
                userIds: patronUserIds,

                message:
                    `${first_name} ${last_name} (${admission_no}) has completed student registration and is awaiting processing.`,

                type:
                    'student_registration',

                related_id:
                    studentResult.insertId
            });

        }


        // ==========================================
        // SAVE EMAIL FOR PAYMENT
        // ==========================================

        req.session.registrationEmail = email;


        // ==========================================
        // REDIRECT TO PAYMENT
        // ==========================================

        return res.redirect(
            `/student/payment?student_id=${studentResult.insertId}`
        );


    } catch (err) {

        console.error(
            "Registration Error:",
            err
        );


        if (connection) {

            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback error:",
                    rollbackError
                );
            }

            connection.release();
        }


        return res.status(500).send(
            "Registration failed. Please try again."
        );

    }

};