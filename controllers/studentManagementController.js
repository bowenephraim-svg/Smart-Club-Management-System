const db = require('../config/db');
const bcrypt = require('bcrypt');

// ==========================================
// GET ALL STUDENTS
// ==========================================
exports.getAllStudents = async (req, res) => {

    try {

        const [students] = await db.query(`
            SELECT
                s.student_id,
                s.admission_no,
                s.first_name,
                s.last_name,
                s.gender,
                s.class,
                s.stream,
                s.phone,
                u.email
            FROM students s
            INNER JOIN users u
                ON s.user_id = u.user_id
            ORDER BY s.first_name ASC
        `);

        res.render('students/index', {
            students,
            user: req.session.user,
            error_msg: null,
            success_msg: null
        });

    } catch (err) {

        console.error(err);

        res.status(500).send("Failed to load students.");

    }

};

// ==========================================
// SHOW ADD STUDENT FORM
// ==========================================
exports.renderCreateForm = (req, res) => {

    res.render('students/add', {
        user: req.session.user,
        error_msg: null,
        success_msg: null
    });

};

// ==========================================
// CREATE NEW STUDENT
// ==========================================
exports.processCreate = async (req, res) => {

    const {
        admission_no,
        first_name,
        last_name,
        gender,
        class: studentClass,
        stream,
        phone,
        email
    } = req.body;

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        // Check duplicate email
        const [emailExists] = await connection.query(
            `SELECT user_id FROM users WHERE email = ?`,
            [email]
        );

        if (emailExists.length > 0) {

            await connection.rollback();

            return res.render('students/add', {
                user: req.session.user,
                error_msg: 'Email already exists.',
                success_msg: null
            });

        }

        // Check duplicate admission number
        const [admissionExists] = await connection.query(
            `SELECT student_id
             FROM students
             WHERE admission_no = ?`,
            [admission_no]
        );

        if (admissionExists.length > 0) {

            await connection.rollback();

            return res.render('students/add', {
                user: req.session.user,
                error_msg: 'Admission number already exists.',
                success_msg: null
            });

        }

        // Initial password = Admission Number
        const hashedPassword = await bcrypt.hash(admission_no, 10);

        const fullName = `${first_name} ${last_name}`;

        // Create user account
        const [userResult] = await connection.query(
            `
            INSERT INTO users
            (full_name, email, password, role)
            VALUES (?, ?, ?, ?)
            `,
            [
                fullName,
                email,
                hashedPassword,
                'Student'
            ]
        );

        // Create student profile
        await connection.query(
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
                userResult.insertId,
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

        await connection.commit();

        res.redirect('/students');

    } catch (err) {

        await connection.rollback();

        console.error(err);

        res.render('students/add', {
            user: req.session.user,
            error_msg: 'Failed to create student.',
            success_msg: null
        });

    } finally {

        connection.release();

    }

};

// ==========================================
// SHOW EDIT FORM
// ==========================================
exports.renderEditForm = async (req, res) => {

    res.send("Edit Student Form - Coming Next");

};

// ==========================================
// UPDATE STUDENT
// ==========================================
exports.processEdit = async (req, res) => {

    res.send("Update Student - Coming Next");

};

// ==========================================
// DELETE STUDENT
// ==========================================
exports.processDelete = async (req, res) => {

    res.send("Delete Student - Coming Next");

};