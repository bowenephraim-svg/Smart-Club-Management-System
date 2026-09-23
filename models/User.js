// models/User.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // Return exactly the fields needed by server-side authentication.
    static async findByEmail(email) {
        const [rows] = await db.query(
            `SELECT user_id, full_name, email, password, role, status, profile_image
             FROM users WHERE email = ? LIMIT 1`,
            [email]
        );
        return rows[0] || null;
    }

    // Create a new authenticated profile instance
    static async create({ name, email, password, role }) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const query = "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)";
        const [result] = await db.query(query, [name, email, hashedPassword, role || 'Student']);
        return result.insertId;
    }

    // Compare bcrypt passwords using bcrypt. The legacy fallback exists only for
    // pre-existing non-bcrypt records; a bcrypt value never falls back to a raw
    // string comparison.
    static async verifyPassword(rawPassword, hashedPassword) {
        if (typeof hashedPassword !== 'string') {
            return false;
        }

        if (/^\$2[aby]\$/.test(hashedPassword)) {
            try {
                return await bcrypt.compare(rawPassword, hashedPassword);
            } catch (err) {
                console.error('Password hash comparison failed:', err.message);
                return false;
            }
        }

        // Compatibility for legacy seed accounts. New registrations are bcrypt-hashed.
        return rawPassword === hashedPassword;
    }
    // ==========================================
// GET ALL USERS
// ==========================================
static async getAll() {

    const [rows] = await db.query(`
        SELECT
            user_id,
            full_name,
            email,
            role,
            status
        FROM users
        ORDER BY full_name ASC
    `);

    return rows;

}
// Update user approval status
static async updateStatus(userId, status) {

    const [result] = await db.query(

        `
        UPDATE users
        SET status = ?
        WHERE user_id = ?
        `,

        [status, userId]

    );

    return result.affectedRows > 0;

}
}

module.exports = User;
