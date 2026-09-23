const db = require('./config/db');

async function migrateSettings() {
    try {

        console.log('Starting settings migration...\n');

        // ==========================================
        // CHECK EXISTING COLUMNS
        // ==========================================
        const [columns] = await db.query(`
            SHOW COLUMNS FROM settings
        `);

        const columnNames = columns.map(c => c.Field);

        console.log('Current settings columns:', columnNames.join(', '));

        // ==========================================
        // ADD SCHOOL PROFILE COLUMNS
        // ==========================================
        const newColumns = [
            { name: 'school_motto', sql: "ADD COLUMN school_motto VARCHAR(255) DEFAULT NULL AFTER school_name" },
            { name: 'school_address', sql: "ADD COLUMN school_address VARCHAR(255) DEFAULT NULL" },
            { name: 'school_phone', sql: "ADD COLUMN school_phone VARCHAR(50) DEFAULT NULL" },
            { name: 'school_email', sql: "ADD COLUMN school_email VARCHAR(150) DEFAULT NULL" },
            { name: 'school_website', sql: "ADD COLUMN school_website VARCHAR(150) DEFAULT NULL" },
            { name: 'currency', sql: "ADD COLUMN currency VARCHAR(10) DEFAULT 'KES'" }
        ];

        for (const col of newColumns) {

            if (!columnNames.includes(col.name)) {

                await db.query(`ALTER TABLE settings ${col.sql}`);
                console.log(`✔ Added column: ${col.name}`);

            } else {

                console.log(`→ Column already exists: ${col.name}`);

            }

        }

        // ==========================================
        // ENSURE AT LEAST ONE ROW EXISTS
        // ==========================================
        const [rows] = await db.query(`SELECT setting_id FROM settings LIMIT 1`);

        if (rows.length === 0) {

            await db.query(`
                INSERT INTO settings (
                    school_name, school_motto, school_address,
                    school_phone, school_email, school_website,
                    academic_year, theme, currency
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'Victory School',
                'Excellence, Integrity, Service',
                'P.O. Box 123, Nairobi, Kenya',
                '+254 700 000 000',
                'info@victoryschool.ac.ke',
                'https://victoryschool.ac.ke',
                '2026',
                'Professional',
                'KES'
            ]);

            console.log('✔ Created initial settings row');

        } else {

            // Update existing row with defaults if null
            await db.query(`
                UPDATE settings SET
                    school_motto = COALESCE(school_motto, 'Excellence, Integrity, Service'),
                    school_address = COALESCE(school_address, 'P.O. Box 123, Nairobi, Kenya'),
                    school_phone = COALESCE(school_phone, '+254 700 000 000'),
                    school_email = COALESCE(school_email, 'info@victoryschool.ac.ke'),
                    school_website = COALESCE(school_website, 'https://victoryschool.ac.ke'),
                    currency = COALESCE(currency, 'KES')
                WHERE setting_id = ?
            `, [rows[0].setting_id]);

            console.log('✔ Updated existing settings row with defaults');

        }

        // ==========================================
        // VERIFY FINAL STATE
        // ==========================================
        const [finalColumns] = await db.query(`SHOW COLUMNS FROM settings`);
        console.log('\nFinal settings columns:', finalColumns.map(c => c.Field).join(', '));

        const [[settings]] = await db.query(`SELECT * FROM settings LIMIT 1`);
        console.log('\nSettings row:', JSON.stringify(settings, null, 2));

        console.log('\n🎉 Settings migration completed successfully!');

        process.exit();

    } catch (error) {

        console.error('Settings migration failed:', error.message);

        process.exit(1);

    }
}

migrateSettings();