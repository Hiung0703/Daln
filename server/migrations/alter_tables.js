const db = require('../config/database');

async function alterTables() {
    try {
        // Ví dụ 1: Thêm cột mới
        await db.none(`
            -- Thêm cột status vào bảng checks
            ALTER TABLE checks 
            ADD COLUMN status VARCHAR(50) DEFAULT 'pending';

            -- Thêm cột description với điều kiện NOT NULL
            ALTER TABLE checks 
            ADD COLUMN description TEXT NOT NULL DEFAULT '';

            -- Thêm cột updated_at với timestamp tự động cập nhật
            ALTER TABLE checks 
            ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN processed_by INTEGER REFERENCES users(id);
        `);

        // Ví dụ 2: Xóa cột (bỏ comment nếu muốn xóa)
        /*
        await db.none(`
            ALTER TABLE checks 
            DROP COLUMN IF EXISTS old_column_name;
        `);
        */

        // Ví dụ 3: Đổi tên cột
        /*
        await db.none(`
            ALTER TABLE checks 
            RENAME COLUMN old_name TO new_name;
        `);
        */

        // Ví dụ 4: Thay đổi kiểu dữ liệu của cột
        /*
        await db.none(`
            ALTER TABLE checks 
            ALTER COLUMN amount TYPE NUMERIC(15,2);
        `);
        */

        console.log('Cập nhật cấu trúc bảng thành công');
    } catch (error) {
        console.error('Lỗi khi cập nhật cấu trúc bảng:', error);
        throw error;
    }
}

// Chạy cập nhật
async function runAlterations() {
    try {
        await alterTables();
        console.log('Đã cập nhật xong cấu trúc database');
    } catch (error) {
        console.error('Cập nhật thất bại:', error);
    } finally {
        process.exit();
    }
}

// Export để có thể chạy từ command line
module.exports = { runAlterations };