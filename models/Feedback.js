const db = require('../config/db');

class Feedback {
    static async create(feedbackData) {
        const { user_id, category, subject, message } = feedbackData;
        const [result] = await db.query(
            `INSERT INTO feedbacks (user_id, category, subject, message, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [user_id, category, subject, message]
        );
        return result.insertId;
    }

    static async getAll() {
        const [rows] = await db.query(
            `SELECT f.*, u.username , s.first_name, s.last_name
             FROM feedbacks f 
             LEFT JOIN users u ON f.user_id = u.id 
             LEFT JOIN students s ON f.user_id = s.id
             ORDER BY f.created_at DESC`    
        );
        return rows;
    }
}

module.exports = Feedback;
