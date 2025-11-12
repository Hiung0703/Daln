require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models/db');
const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const scanRoutes = require('./routes/scan');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.locals.db = db;

app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/users', usersRoutes);

// Test endpoint to verify auth
const { authMiddleware } = require('./middleware/auth');
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ 
    ok: true, 
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

app.get('/', (req, res) => res.json({ ok: true, message: 'API running' }));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/history');
  console.log('  POST /api/scan');
  console.log('  GET  /api/users (admin/bank_staff)');
  console.log('  POST /api/users (admin)');
});

