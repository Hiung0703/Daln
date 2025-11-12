const db = require('../config/database');

// Tạo user mới
async function createUser(username, passwordHash, role = 'user', fullName = null, email = null) {
    return db.one(
        `INSERT INTO users (username, password_hash, role, full_name, email) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, username, role, full_name, email`,
        [username, passwordHash, role, fullName, email]
    );
}

// Tìm user theo username
async function findUserByUsername(username) {
    return db.oneOrNone('SELECT * FROM users WHERE username = $1', username);
}

// Tìm user theo id
async function findUserById(id) {
    return db.oneOrNone('SELECT * FROM users WHERE id = $1', id);
}

// Lấy danh sách tất cả users (chỉ admin)
async function getAllUsers() {
    return db.any(`
        SELECT id, username, role, full_name, email, is_active, created_at, last_login 
        FROM users 
        ORDER BY created_at DESC
    `);
}

// Cập nhật role của user
async function updateUserRole(userId, role) {
    return db.oneOrNone(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role',
        [role, userId]
    );
}

// Cập nhật thông tin user
async function updateUser(userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.full_name !== undefined) {
        fields.push(`full_name = $${paramCount++}`);
        values.push(updates.full_name);
    }
    if (updates.email !== undefined) {
        fields.push(`email = $${paramCount++}`);
        values.push(updates.email);
    }
    if (updates.role !== undefined) {
        fields.push(`role = $${paramCount++}`);
        values.push(updates.role);
    }
    if (updates.is_active !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(updates.is_active);
    }
    if (updates.password_hash !== undefined) {
        fields.push(`password_hash = $${paramCount++}`);
        values.push(updates.password_hash);
    }

    if (fields.length === 0) {
        throw new Error('No fields to update');
    }

    values.push(userId);
    const query = `
        UPDATE users 
        SET ${fields.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING id, username, role, full_name, email, is_active
    `;

    return db.oneOrNone(query, values);
}

// Cập nhật last login
async function updateLastLogin(userId) {
    return db.none(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        userId
    );
}

// Xóa user
async function deleteUser(userId) {
    return db.result('DELETE FROM users WHERE id = $1', userId);
}

// Lấy tất cả checks (admin/bank_staff)
async function getAllChecks() {
    return db.any(`
        SELECT c.*, u.username, u.full_name 
        FROM checks c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
    `);
}

// Thêm check mới
async function createCheck(checkData) {
    return db.one(
        `INSERT INTO checks (
            user_id, check_number, amount, payee, date,
            micr_data, image_path, ocr_content
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
            checkData.userId,
            checkData.checkNumber,
            checkData.amount,
            checkData.payee,
            checkData.date,
            checkData.micrData,
            checkData.imagePath,
            checkData.ocrContent
        ]
    );
}

// Lấy danh sách check của user
async function getUserChecks(userId) {
    return db.any('SELECT * FROM checks WHERE user_id = $1 ORDER BY created_at DESC', userId);
}

// Lấy chi tiết một check
async function getCheckById(checkId, userId) {
    return db.oneOrNone(
        'SELECT * FROM checks WHERE id = $1 AND user_id = $2',
        [checkId, userId]
    );
}

// ============ HISTORY FUNCTIONS (alias for checks) ============

// Thêm history (lưu kết quả OCR)
async function addHistory(userId, content, meta) {
    return db.one(
        `INSERT INTO checks (
            user_id, check_number, amount, payee, date,
            micr_data, ocr_content
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, user_id, check_number, amount, payee, date, micr_data, ocr_content, created_at`,
        [
            userId,
            meta?.fields?.check_number || null,
            meta?.fields?.amount || null,
            meta?.fields?.payee || null,
            meta?.fields?.date || null,
            meta?.micr || null,
            { content, ...meta }
        ]
    );
}

// Lấy histories của user
async function getHistoriesByUser(userId) {
    return db.any(
        'SELECT * FROM checks WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
}

// Lấy history theo ID
async function getHistoryById(historyId) {
    return db.oneOrNone(
        'SELECT * FROM checks WHERE id = $1',
        [historyId]
    );
}

// Cập nhật history
async function updateHistory(historyId, content, meta) {
    return db.oneOrNone(
        `UPDATE checks SET 
            check_number = $1,
            amount = $2,
            payee = $3,
            date = $4,
            micr_data = $5,
            ocr_content = $6
        WHERE id = $7
        RETURNING *`,
        [
            meta?.fields?.check_number || null,
            meta?.fields?.amount || null,
            meta?.fields?.payee || null,
            meta?.fields?.date || null,
            meta?.micr || null,
            { content, ...meta },
            historyId
        ]
    );
}

// Xóa history
async function deleteHistory(historyId) {
    return db.result('DELETE FROM checks WHERE id = $1', [historyId]);
}

module.exports = {
    createUser,
    findUserByUsername,
    findUserById,
    getAllUsers,
    updateUserRole,
    updateUser,
    updateLastLogin,
    deleteUser,
    createCheck,
    getUserChecks,
    getAllChecks,
    getCheckById,
    // History functions (alias)
    addHistory,
    getHistoriesByUser,
    getHistoryById,
    updateHistory,
    deleteHistory
};