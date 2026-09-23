// models/Notification.js

const db = require('../config/db');

class Notification {

    // =====================================================
    // CREATE ONE NOTIFICATION
    // =====================================================

    static async create({
        user_id,
        message,
        type = 'General',
        related_id = null
    }) {

        const [result] = await db.query(
            `
            INSERT INTO notifications
            (
                user_id,
                message,
                type,
                related_id,
                status
            )
            VALUES (?, ?, ?, ?, 'Unread')
            `,
            [
                user_id,
                message,
                type,
                related_id
            ]
        );

        return result.insertId;
    }


    // =====================================================
    // CREATE NOTIFICATION FOR MANY USERS
    // =====================================================

    static async createForUsers({
        userIds,
        message,
        type = 'General',
        related_id = null
    }) {

        if (!userIds || userIds.length === 0) {
            return [];
        }

        const values = userIds.map(userId => [
            userId,
            message,
            type,
            related_id
        ]);

        const placeholders = values
            .map(() => '(?, ?, ?, ?, \'Unread\')')
            .join(', ');

        const flattenedValues = values.flat();

        const [result] = await db.query(
            `
            INSERT INTO notifications
            (
                user_id,
                message,
                type,
                related_id,
                status
            )
            VALUES ${placeholders}
            `,
            flattenedValues
        );

        return result.affectedRows;
    }


    // =====================================================
    // GET ALL NOTIFICATIONS
    // ADMIN VIEW ONLY
    // =====================================================

    static async getAll() {

        const [rows] = await db.query(
            `
            SELECT
                n.*,
                u.full_name,
                u.email
            FROM notifications n
            LEFT JOIN users u
                ON n.user_id = u.user_id
            ORDER BY n.created_at DESC
            `
        );

        return rows;
    }


    // =====================================================
    // GET ONE NOTIFICATION
    // =====================================================

    static async getById(id) {

        const [rows] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE notification_id = ?
            `,
            [id]
        );

        return rows[0] || null;
    }


    // =====================================================
    // GET ONE NOTIFICATION FOR SPECIFIC USER
    // =====================================================

    static async getByIdForUser(id, userId) {

        const [rows] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE notification_id = ?
            AND user_id = ?
            `,
            [id, userId]
        );

        return rows[0] || null;
    }


    // =====================================================
    // UPDATE
    // =====================================================

    static async update(id, data) {

        const {
            user_id,
            message,
            status,
            type,
            related_id
        } = data;

        await db.query(
            `
            UPDATE notifications
            SET
                user_id = ?,
                message = ?,
                status = ?,
                type = ?,
                related_id = ?
            WHERE notification_id = ?
            `,
            [
                user_id,
                message,
                status,
                type,
                related_id,
                id
            ]
        );

        return true;
    }


    // =====================================================
    // GET USER NOTIFICATIONS
    // =====================================================

    static async getByUser(userId) {

        const [rows] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,
            [userId]
        );

        return rows;
    }


    // =====================================================
    // GET LATEST USER NOTIFICATIONS
    // =====================================================

    static async getLatestForUser(userId, limit = 5) {

        const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 50));

        const [rows] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            `,
            [userId, safeLimit]
        );

        return rows;
    }


    // =====================================================
    // UNREAD COUNT
    // =====================================================

    static async unreadCount(userId) {

        const [rows] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM notifications
            WHERE user_id = ?
            AND status = 'Unread'
            `,
            [userId]
        );

        return Number(rows[0]?.total || 0);
    }


    // =====================================================
    // MARK ONE AS READ
    // =====================================================

    static async markRead(id, userId) {

        const [result] = await db.query(
            `
            UPDATE notifications
            SET status = 'Read'
            WHERE notification_id = ?
            AND user_id = ?
            `,
            [id, userId]
        );

        return result.affectedRows > 0;
    }


    // =====================================================
    // MARK ALL AS READ
    // =====================================================

    static async markAllRead(userId) {

        await db.query(
            `
            UPDATE notifications
            SET status = 'Read'
            WHERE user_id = ?
            `,
            [userId]
        );

        return true;
    }


    // =====================================================
    // DELETE
    // =====================================================

    static async delete(id) {

        const [result] = await db.query(
            `
            DELETE FROM notifications
            WHERE notification_id = ?
            `,
            [id]
        );

        return result.affectedRows > 0;
    }

}

module.exports = Notification;