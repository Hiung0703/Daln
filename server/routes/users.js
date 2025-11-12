const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, authorize, requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Tất cả routes cần authentication
router.use(authenticate);

/**
 * GET /api/users
 * Lấy danh sách tất cả users
 * Permissions: admin, bank_staff
 */
router.get('/', authorize('admin', 'bank_staff'), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/:id
 * Lấy thông tin một user
 * Permissions: admin, bank_staff, hoặc chính user đó
 */
router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  const userId = parseInt(req.params.id);
  const requestorRole = req.user.role || 'user';

  // User chỉ có thể xem thông tin của chính mình
  if (requestorRole === 'user' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const user = await db.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Không trả password hash
    delete user.password_hash;
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/users
 * Tạo user mới
 * Permissions: admin only
 */
router.post('/', authorize('admin'), async (req, res) => {
  const { username, password, role, fullName, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  if (role && !['admin', 'bank_staff', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be: admin, bank_staff, or user' });
  }

  const db = req.app.locals.db;
  try {
    const hash = await bcrypt.hash(password, 10);
    const newUser = await db.createUser(username, hash, role || 'user', fullName, email);
    
    // Không trả password hash
    delete newUser.password_hash;
    res.status(201).json(newUser);
  } catch (err) {
    if (err && err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /api/users/:id
 * Cập nhật thông tin user
 * Permissions: admin có thể update bất kỳ, user chỉ update chính mình
 */
router.put('/:id', async (req, res) => {
  const db = req.app.locals.db;
  const userId = parseInt(req.params.id);
  const requestorRole = req.user.role || 'user';
  const { fullName, email, role, isActive, password } = req.body;

  // User chỉ có thể update chính mình và không thể đổi role/isActive
  if (requestorRole === 'user') {
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (role !== undefined || isActive !== undefined) {
      return res.status(403).json({ error: 'Cannot change role or active status' });
    }
  }

  // Bank staff không thể update role
  if (requestorRole === 'bank_staff' && role !== undefined) {
    return res.status(403).json({ error: 'Cannot change user roles' });
  }

  try {
    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (email !== undefined) updates.email = email;
    if (role !== undefined && requestorRole === 'admin') updates.role = role;
    if (isActive !== undefined && requestorRole === 'admin') updates.is_active = isActive;
    
    // Update password if provided
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updatedUser = await db.updateUser(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    delete updatedUser.password_hash;
    res.json(updatedUser);
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Xóa user
 * Permissions: admin only
 */
router.delete('/:id', authorize('admin'), async (req, res) => {
  const db = req.app.locals.db;
  const userId = parseInt(req.params.id);

  // Không cho phép xóa chính mình
  if (req.user.id === userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  try {
    const result = await db.deleteUser(userId);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/users/stats/summary
 * Thống kê users
 * Permissions: admin only
 */
router.get('/stats/summary', authorize('admin'), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'bank_staff' THEN 1 END) as bank_staff_count,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_users,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_last_week
      FROM users
    `);
    
    res.json(stats[0] || {});
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
