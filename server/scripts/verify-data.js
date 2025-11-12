const db = require('../config/database');

async function verifyData() {
    try {
        // Kiểm tra bảng users
        const users = await db.any('SELECT * FROM users');
        console.log('Số lượng users:', users.length);
        console.log('Mẫu dữ liệu user:', users[0]);

        // Kiểm tra bảng checks
        const checks = await db.any('SELECT * FROM checks');
        console.log('\nSố lượng checks:', checks.length);
        if (checks.length > 0) {
            console.log('Mẫu dữ liệu check:', checks[0]);
        }

        // Kiểm tra bảng check_history
        const history = await db.any('SELECT * FROM check_history');
        console.log('\nSố lượng check_history:', history.length);
        if (history.length > 0) {
            console.log('Mẫu dữ liệu history:', history[0]);
        }

    } catch (error) {
        console.error('Lỗi khi verify dữ liệu:', error);
    } finally {
        process.exit();
    }
}

verifyData();