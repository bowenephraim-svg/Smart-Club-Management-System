
const db = require('../config/db');

class Settings {

    // ==========================================
    // GET SETTINGS
    // ==========================================
    // The system uses one settings row.

    static async getAll() {

        const [rows] = await db.query(`
            SELECT *
            FROM settings
            ORDER BY setting_id ASC
            LIMIT 1
        `);

        return rows[0] || null;

    }

    // ==========================================
    // ENSURE SETTINGS ROW EXISTS
    // ==========================================

    static async ensureSettingsRow() {

        const [rows] = await db.query(`
            SELECT setting_id
            FROM settings
            ORDER BY setting_id ASC
            LIMIT 1
        `);

        if (rows.length > 0) {

            return rows[0].setting_id;

        }

        const currentYear =
            new Date().getFullYear().toString();

        const [result] = await db.query(`
            INSERT INTO settings (
                school_name,
                school_motto,
                school_address,
                school_phone,
                school_email,
                school_website,
                school_logo,
                academic_year,
                theme,
                currency
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [

            'Smart Club System',
            null,
            null,
            null,
            null,
            null,
            null,
            currentYear,
            'Professional',
            'KES'

        ]);

        return result.insertId;

    }

    // ==========================================
    // UPDATE SCHOOL PROFILE
    // ==========================================
    // IMPORTANT:
    // This updates ONLY school profile fields.
    // It does not touch currency, academic year,
    // theme or logo.

    static async updateProfile(data) {

        const settingId =
            await this.ensureSettingsRow();

        const {

            school_name,
            school_motto,
            school_address,
            school_phone,
            school_email,
            school_website

        } = data;

        await db.query(`
            UPDATE settings
            SET
                school_name = ?,
                school_motto = ?,
                school_address = ?,
                school_phone = ?,
                school_email = ?,
                school_website = ?
            WHERE setting_id = ?
        `, [

            school_name,
            school_motto,
            school_address,
            school_phone,
            school_email,
            school_website,
            settingId

        ]);

        return this.getAll();

    }

    // ==========================================
    // UPDATE SYSTEM PREFERENCES
    // ==========================================
    // Updates ONLY preferences.

    static async updatePreferences(data) {

        const settingId =
            await this.ensureSettingsRow();

        const {

            currency,
            academic_year,
            theme

        } = data;

        await db.query(`
            UPDATE settings
            SET
                currency = ?,
                academic_year = ?,
                theme = ?
            WHERE setting_id = ?
        `, [

            currency || 'KES',

            academic_year ||
                new Date().getFullYear().toString(),

            theme || 'Professional',

            settingId

        ]);

        return this.getAll();

    }

    // ==========================================
    // UPDATE SCHOOL LOGO
    // ==========================================

    static async updateLogo(filePath) {

        const settingId =
            await this.ensureSettingsRow();

        await db.query(`
            UPDATE settings
            SET school_logo = ?
            WHERE setting_id = ?
        `, [

            filePath,
            settingId

        ]);

        return this.getAll();

    }

}

module.exports = Settings;

