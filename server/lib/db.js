"use strict";

// db.js: choose implementation based on environment.
// If PostgreSQL env vars are present, use pg-promise via config/database.js.
// Otherwise fall back to simple JSON file database (existing behavior).

const path = require('path');
const fs = require('fs');

function fileDatabase() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  const dbPath = path.join(dataDir, 'db.json');

  if (!fs.existsSync(dbPath)) {
    const initial = {
      nextUserId: 1,
      nextHistoryId: 1,
      users: [],
      histories: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
  }

  function read() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }

  function write(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }

  return {
    // Keep the same synchronous API as before
    getUserByUsername(username) {
      const d = read();
      return d.users.find(u => u.username === username) || null;
    },
    getUserById(id) {
      const d = read();
      return d.users.find(u => u.id === id) || null;
    },
    createUser(username, password_hash) {
      const d = read();
      if (d.users.find(u => u.username === username)) {
        const err = new Error('username exists');
        err.code = 'UNIQUE';
        throw err;
      }
      const user = { id: d.nextUserId++, username, password_hash, created_at: new Date().toISOString() };
      d.users.push(user);
      write(d);
      return { id: user.id, username: user.username };
    },
    getHistoryById(id) {
      const d = read();
      return d.histories.find(h => h.id === parseInt(id)) || null;
    },
    addHistory(userId, content, meta) {
      const d = read();
      const hist = { id: d.nextHistoryId++, user_id: userId, content, meta: meta || null, created_at: new Date().toISOString() };
      d.histories.push(hist);
      write(d);
      return hist;
    },
    getHistoriesByUser(userId) {
      const d = read();
      return d.histories.filter(h => h.user_id === userId).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    },
    deleteHistory(id) {
      const d = read();
      const index = d.histories.findIndex(h => h.id === parseInt(id));
      if (index !== -1) {
        d.histories.splice(index, 1);
        write(d);
        return true;
      }
      return false;
    },
    updateHistory(id, content, meta) {
      const d = read();
      const history = d.histories.find(h => h.id === parseInt(id));
      if (history) {
        history.content = content;
        if (meta !== undefined) {
          history.meta = meta;
        }
        history.updated_at = new Date().toISOString();
        write(d);
        return history;
      }
      return null;
    }
  };
}

function postgresDatabase() {
  // Use existing config/database.js (pg-promise instance)
  const db = require('../config/database');

  return {
    // Returns a user object or null
    async getUserByUsername(username) {
      return await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    },
    async getUserById(id) {
      return await db.oneOrNone('SELECT * FROM users WHERE id = $1', [id]);
    },
    async createUser(username, password_hash) {
      try {
        const result = await db.one('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id', [username, password_hash]);
        return { id: result.id, username };
      } catch (err) {
        // Map unique violation to previous behavior
        if (err && err.code === '23505') {
          const e = new Error('username exists');
          e.code = 'UNIQUE';
          throw e;
        }
        throw err;
      }
    },
    async getHistoryById(id) {
      return await db.oneOrNone('SELECT * FROM checks WHERE id = $1', [id]);
    },
    async addHistory(userId, content, meta) {
      // Store content in ocr_content JSONB if possible
      const ocrContent = content ? content : null;
      const result = await db.one(
        `INSERT INTO checks (user_id, ocr_content) VALUES ($1, $2) RETURNING *`,
        [userId, ocrContent]
      );
      return result;
    },
    async getHistoriesByUser(userId) {
      return await db.any('SELECT * FROM checks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    },
    async deleteHistory(id) {
      const res = await db.result('DELETE FROM checks WHERE id = $1', [id]);
      return res.rowCount > 0;
    },
    async updateHistory(id, content, meta) {
      const updated = await db.oneOrNone(
        'UPDATE checks SET ocr_content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [content, id]
      );
      return updated;
    }
  };
}

function openDatabase() {
  // If environment contains Postgres config, use postgres; otherwise file
  if (process.env.POSTGRES_HOST) {
    return postgresDatabase();
  }
  return fileDatabase();
}

module.exports = { openDatabase };
