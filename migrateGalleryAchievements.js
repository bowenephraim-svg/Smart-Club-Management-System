// migrateGalleryAchievements.js
// Applies the gallery_albums table and the missing columns for
// gallery_images and achievements in an idempotent, safe manner.
const db = require('./config/db');

async function migrate() {
    try {
        // =============================================
        // 1. CREATE gallery_albums TABLE
        // =============================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS gallery_albums (
                gallery_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                description TEXT NULL,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('Published', 'Unpublished') NOT NULL DEFAULT 'Published',
                CONSTRAINT fk_gallery_albums_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
            )
        `);
        console.log('✅ gallery_albums table ready');

        // =============================================
        // 2. ADD MISSING COLUMNS TO gallery_images
        // =============================================
        const [giCols] = await db.query('SHOW COLUMNS FROM gallery_images');
        const giNames = giCols.map(c => c.Field);

        if (!giNames.includes('gallery_id')) {
            await db.query('ALTER TABLE gallery_images ADD COLUMN gallery_id INT NULL');
            console.log('  + gallery_images.gallery_id');
        }
        if (!giNames.includes('caption')) {
            await db.query('ALTER TABLE gallery_images ADD COLUMN caption VARCHAR(255) NULL');
            console.log('  + gallery_images.caption');
        }
        if (!giNames.includes('uploaded_by')) {
            await db.query('ALTER TABLE gallery_images ADD COLUMN uploaded_by INT NULL');
            console.log('  + gallery_images.uploaded_by');
        }
        if (!giNames.includes('status')) {
            await db.query("ALTER TABLE gallery_images ADD COLUMN status ENUM('Published','Unpublished') NOT NULL DEFAULT 'Published'");
            console.log('  + gallery_images.status');
        }

        // Indexes + foreign keys (only if not already present)
        const [giIdx] = await db.query('SHOW INDEX FROM gallery_images');
        const giIndexNames = giIdx.map(i => i.Key_name);
        if (!giIndexNames.includes('idx_gallery_images_gallery_id')) {
            await db.query('ALTER TABLE gallery_images ADD INDEX idx_gallery_images_gallery_id (gallery_id)');
            console.log('  + index idx_gallery_images_gallery_id');
        }
        if (!giIndexNames.includes('fk_gallery_images_album')) {
            await db.query('ALTER TABLE gallery_images ADD CONSTRAINT fk_gallery_images_album FOREIGN KEY (gallery_id) REFERENCES gallery_albums(gallery_id) ON DELETE SET NULL');
            console.log('  + fk_gallery_images_album');
        }
        if (!giIndexNames.includes('fk_gallery_images_uploader')) {
            await db.query('ALTER TABLE gallery_images ADD CONSTRAINT fk_gallery_images_uploader FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL');
            console.log('  + fk_gallery_images_uploader');
        }

        // =============================================
        // 3. ADD MISSING COLUMNS TO achievements
        // =============================================
        const [aCols] = await db.query('SHOW COLUMNS FROM achievements');
        const aNames = aCols.map(c => c.Field);

        if (!aNames.includes('student_id')) {
            await db.query('ALTER TABLE achievements ADD COLUMN student_id INT NULL');
            console.log('  + achievements.student_id');
        }
        if (!aNames.includes('category')) {
            await db.query('ALTER TABLE achievements ADD COLUMN category VARCHAR(100) NULL');
            console.log('  + achievements.category');
        }
        if (!aNames.includes('position')) {
            await db.query('ALTER TABLE achievements ADD COLUMN position VARCHAR(100) NULL');
            console.log('  + achievements.position');
        }
        if (!aNames.includes('award')) {
            await db.query('ALTER TABLE achievements ADD COLUMN award VARCHAR(150) NULL');
            console.log('  + achievements.award');
        }
        if (!aNames.includes('image')) {
            await db.query('ALTER TABLE achievements ADD COLUMN image VARCHAR(255) NULL');
            console.log('  + achievements.image');
        }
        if (!aNames.includes('created_by')) {
            await db.query('ALTER TABLE achievements ADD COLUMN created_by INT NULL');
            console.log('  + achievements.created_by');
        }
        if (!aNames.includes('status')) {
            await db.query("ALTER TABLE achievements ADD COLUMN status ENUM('Published','Unpublished') NOT NULL DEFAULT 'Published'");
            console.log('  + achievements.status');
        }
        if (!aNames.includes('created_at')) {
            await db.query('ALTER TABLE achievements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log('  + achievements.created_at');
        }
        if (!aNames.includes('updated_at')) {
            await db.query('ALTER TABLE achievements ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
            console.log('  + achievements.updated_at');
        }

        // Indexes + foreign keys for achievements
        const [aIdx] = await db.query('SHOW INDEX FROM achievements');
        const aIndexNames = aIdx.map(i => i.Key_name);
        if (!aIndexNames.includes('idx_achievements_student_id')) {
            await db.query('ALTER TABLE achievements ADD INDEX idx_achievements_student_id (student_id)');
            console.log('  + index idx_achievements_student_id');
        }
        if (!aIndexNames.includes('fk_achievements_student')) {
            await db.query('ALTER TABLE achievements ADD CONSTRAINT fk_achievements_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL');
            console.log('  + fk_achievements_student');
        }
        if (!aIndexNames.includes('fk_achievements_creator')) {
            await db.query('ALTER TABLE achievements ADD CONSTRAINT fk_achievements_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL');
            console.log('  + fk_achievements_creator');
        }

        console.log('✅ Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();