require('dotenv').config();
const pgp = require('pg-promise')();
const dbConfig = require('../config/database');

const db = pgp(dbConfig);

async function listUsers() {
  try {
    const users = await db.any('SELECT id, username, role, full_name, created_at FROM users ORDER BY id');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`✅ Found ${users.length} users:\n`);
      users.forEach(u => {
        console.log(`  ID: ${u.id}`);
        console.log(`  Username: ${u.username}`);
        console.log(`  Role: ${u.role}`);
        console.log(`  Full Name: ${u.full_name || 'N/A'}`);
        console.log(`  Created: ${u.created_at}`);
        console.log('  ---');
      });
    }
    
    pgp.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    pgp.end();
    process.exit(1);
  }
}

listUsers();
