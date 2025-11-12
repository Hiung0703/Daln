const express = require('express');
const { authenticate, authorizeOwnerOrStaff } = require('../middleware/rbac');

const router = express.Router();

/**
 * GET /api/history
 * Lấy histories
 * - User: chỉ xem của mình
 * - Bank staff & Admin: xem tất cả
 */
router.get('/', authenticate, async (req, res) => {
  const db = req.app.locals.db;
  const userRole = req.user.role || 'user';
  
  try {
    let rows;
    if (userRole === 'admin' || userRole === 'bank_staff') {
      // Admin/staff xem tất cả
      rows = await db.getAllChecks();
    } else {
      // User chỉ xem của mình
      rows = await db.getHistoriesByUser(req.user.id);
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

/**
 * POST /api/history
 * Tạo history mới
 */
router.post('/', authenticate, async (req, res) => {
  const db = req.app.locals.db;
  const { content, meta } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  try {
    const row = await db.addHistory(req.user.id, content, meta);
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

/**
 * GET /api/history/:id
 * Lấy chi tiết một history
 * - User: chỉ xem của mình
 * - Bank staff & Admin: xem tất cả
 */
router.get('/:id', authenticate, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const userRole = req.user.role || 'user';
  
  try {
    const history = await db.getHistoryById(id);
    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }
    
    // Check ownership
    if (userRole === 'user' && history.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

/**
 * PUT /api/history/:id
 * Cập nhật history
 * - User: chỉ update của mình
 * - Bank staff & Admin: update tất cả
 */
router.put('/:id', authenticate, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { content, meta } = req.body;
  const userRole = req.user.role || 'user';
  
  try {
    const history = await db.getHistoryById(id);
    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }
    
    // Check ownership
    if (userRole === 'user' && history.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updated = await db.updateHistory(id, content, meta);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

/**
 * DELETE /api/history/:id
 * Xóa history
 * - User: chỉ xóa của mình
 * - Bank staff & Admin: xóa tất cả
 */
router.delete('/:id', authenticate, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const userRole = req.user.role || 'user';
  
  try {
    const history = await db.getHistoryById(id);
    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }
    
    // Check ownership
    if (userRole === 'user' && history.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await db.deleteHistory(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
