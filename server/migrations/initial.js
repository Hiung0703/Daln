const db = require('../config/database');

async function createTables() {
    try {
        // Tạo bảng users
        await db.none(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tạo bảng checks
        await db.none(`
            CREATE TABLE IF NOT EXISTS checks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                check_number VARCHAR(50),
                amount DECIMAL(15,2),
                payee VARCHAR(255),
                date DATE,
                micr_data TEXT,
                image_path VARCHAR(255),
                ocr_content JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tạo bảng check_history
        await db.none(`
            CREATE TABLE IF NOT EXISTS check_history (
                id SERIAL PRIMARY KEY,
                check_id INTEGER REFERENCES checks(id),
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(50),
                changes JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

async function migrateData() {
    try {
        const oldData = require('../data/db.json');
        
        // Migrate users
        for (const user of oldData.users) {
            await db.none(`
                INSERT INTO users (id, username, password_hash, created_at)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO NOTHING
            `, [user.id, user.username, user.password_hash, user.created_at]);
        }

        // Migrate checks history
        if (oldData.history) {
            for (const record of oldData.history) {
                await db.none(`
                    INSERT INTO checks (
                        user_id, check_number, amount, payee, date,
                        micr_data, image_path, ocr_content
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    record.userId,
                    record.checkNumber,
                    record.amount,
                    record.payee,
                    record.date,
                    record.micrData,
                    record.imagePath,
                    record.ocrContent
                ]);
            }
        }

        console.log('Data migrated successfully');
    } catch (error) {
        console.error('Error migrating data:', error);
        throw error;
    }
}

// Chạy migration
async function runMigration() {
    try {
        await createTables();
        await migrateData();
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

module.exports = { runMigration };