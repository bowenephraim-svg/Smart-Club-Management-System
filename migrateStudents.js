const db = require('./config/db');
const bcrypt = require('bcrypt');

async function migrateStudents() {
    try {

        console.log("Starting student migration...\n");

        // Get all students
        const [students] = await db.query(`
            SELECT *
            FROM students
            WHERE user_id IS NULL
        `);

        console.log(`${students.length} students found.\n`);

        for (const student of students) {

            const fullName = `${student.first_name} ${student.last_name}`.trim();

            // Hash the admission number
            const hashedPassword = await bcrypt.hash(student.admission_no, 10);

            // Create user account
            const [userResult] = await db.query(
                `
                INSERT INTO users
                (full_name, email, password, role)
                VALUES (?, ?, ?, ?)
                `,
                [
                    fullName,
                    student.email,
                    hashedPassword,
                    'Student'
                ]
            );

            // Link student to the user account
            await db.query(
                `
                UPDATE students
                SET user_id = ?
                WHERE student_id = ?
                `,
                [
                    userResult.insertId,
                    student.student_id
                ]
            );

            console.log(`✔ ${fullName} linked to User ID ${userResult.insertId}`);

        }

        console.log("\n🎉 Migration completed successfully!");

        process.exit();

    } catch (error) {

        console.error(error);

        process.exit(1);

    }
}

migrateStudents();