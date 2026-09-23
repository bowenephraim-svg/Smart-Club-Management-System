CREATE TABLE IF NOT EXISTS gallery_albums (
    gallery_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Published', 'Unpublished') NOT NULL DEFAULT 'Published',
    CONSTRAINT fk_gallery_albums_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

ALTER TABLE gallery_images
    ADD COLUMN IF NOT EXISTS gallery_id INT NULL,
    ADD COLUMN IF NOT EXISTS caption VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS uploaded_by INT NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('Published', 'Unpublished') NOT NULL DEFAULT 'Published';

ALTER TABLE gallery_images
    ADD INDEX IF NOT EXISTS idx_gallery_images_gallery_id (gallery_id),
    ADD CONSTRAINT fk_gallery_images_album FOREIGN KEY (gallery_id) REFERENCES gallery_albums(gallery_id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_gallery_images_uploader FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE achievements
    ADD COLUMN IF NOT EXISTS student_id INT NULL,
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS position VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS award VARCHAR(150) NULL,
    ADD COLUMN IF NOT EXISTS image VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS created_by INT NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('Published', 'Unpublished') NOT NULL DEFAULT 'Published',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE achievements
    ADD INDEX IF NOT EXISTS idx_achievements_student_id (student_id),
    ADD CONSTRAINT fk_achievements_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_achievements_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;