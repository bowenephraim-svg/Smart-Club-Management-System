const db = require('../config/db');

class Student {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT student_id, first_name, last_name FROM students ORDER BY first_name, last_name'
        );
        return rows;
    }
    // ==========================================
// GET USER ID FROM STUDENT ID
// ==========================================
static async getUserId(studentId) {

    const [rows] = await db.query(
        `
        SELECT user_id
        FROM students
        WHERE student_id = ?
        `,
        [studentId]
    );

    return rows[0] || null;

}
// ==========================================
// GET STUDENT USING USER ID
// ==========================================
static async getByUserId(userId) {

    const [rows] = await db.query(
        `
        SELECT s.*, u.profile_image
        FROM students s
        LEFT JOIN users u ON u.user_id = s.user_id
        WHERE s.user_id=?
        `,
        [userId]
    );

    return rows[0];

}
// ==========================================================
// GET STUDENTS WAITING APPROVAL
// ==========================================================
static async getPendingApprovals() {

    const [rows] = await db.query(
        `
        SELECT
            s.*,
            u.email,
            u.user_id,
            u.status
        FROM students s
        INNER JOIN users u
            ON s.user_id = u.user_id
        WHERE u.status = 'Pending Approval'
        ORDER BY s.created_at ASC
        `
    );

    return rows;

}
}

module.exports = Student;
