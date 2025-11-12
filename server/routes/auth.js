const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/rbac');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, fullName, email } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const db = req.app.locals.db;
  try {
    const hash = await bcrypt.hash(password, 10);
    // Mặc định role là 'user' khi register
    const created = await db.createUser(username, hash, 'user', fullName, email);
    
    const user = { 
      id: created.id, 
      username: created.username,
      role: created.role || 'user',
      fullName: created.full_name,
      email: created.email
    };
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ user, token });
  } catch (err) {
    if (err && err.code === 'UNIQUE') {
      return res.status(409).json({ error: 'username taken' });
    }
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const db = req.app.locals.db;
  try {
    const row = await db.findUserByUsername(username);
    if (!row) return res.status(401).json({ error: 'invalid credentials' });
    
    // Check if account is active
    if (row.is_active === false) {
      return res.status(403).json({ error: 'Account disabled' });
    }
    
    const ok = await bcrypt.compare(password, row.password_hash || row.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    
    // Update last login
    await db.updateLastLogin(row.id);
    
    const user = { 
      id: row.id, 
      username: row.username,
      role: row.role || 'user',
      fullName: row.full_name,
      email: row.email
    };
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
