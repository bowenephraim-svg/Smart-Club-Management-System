const db = require('../config/db');
const Notification = require('./Notification');

class AdminApproval {

    // ==========================================
    // STUDENTS WAITING FOR APPROVAL
    // ==========================================
    static async getPendingStudents() {

        const [rows] = await db.query(`
            SELECT
                s.student_id,
                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                s.stream,
                s.created_at,
                u.user_id,
                u.email,
                u.status
            FROM students s
            INNER JOIN users u
                ON s.user_id = u.user_id
            WHERE u.status='Pending Approval'
            ORDER BY s.created_at ASC
        `);

        return rows;
    }

    // ==========================================
    // APPROVE STUDENT
    // ==========================================
    static async approve(studentId) {

        const [[student]] = await db.query(`
            SELECT
                s.*,
                u.user_id
            FROM students s
            JOIN users u
                ON s.user_id=u.user_id
            WHERE s.student_id=?
        `,[studentId]);

        if(!student){
            throw new Error("Student not found.");
        }

        await db.query(`
            UPDATE users
            SET status='Approved'
            WHERE user_id=?
        `,[student.user_id]);

        await Notification.create({
            user_id: student.user_id,
            message:
                "Congratulations! Your account has been approved. You can now access all club services.",
            type:'Approval',
            related_id:student.student_id
        });

        return true;
    }

    // ==========================================
    // REJECT STUDENT
    // ==========================================
    static async reject(studentId) {

        const [[student]] = await db.query(`
            SELECT
                s.*,
                u.user_id
            FROM students s
            JOIN users u
                ON s.user_id=u.user_id
            WHERE s.student_id=?
        `,[studentId]);

        if(!student){
            throw new Error("Student not found.");
        }

        await db.query(`
            UPDATE users
            SET status='Rejected'
            WHERE user_id=?
        `,[student.user_id]);

        await Notification.create({
            user_id: student.user_id,
            message:
                "Your registration was not approved. Please contact the school administration.",
            type:'Approval',
            related_id:student.student_id
        });

        return true;
    }

}

module.exports = AdminApproval;