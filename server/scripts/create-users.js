require('dotenv').config();
const bcrypt = require('bcryptjs');
const pgp = require('pg-promise')();
const dbConfig = require('../config/database');

const db = pgp(dbConfig);

async function createDefaultUsers() {
  try {
    console.log('🔧 Creating default users...\n');
    
    const users = [
      { username: 'testuser', password: 'test123', role: 'admin', fullName: 'Admin User' },
      { username: 'staff01', password: 'staff123', role: 'bank_staff', fullName: 'Staff User' },
      { username: 'test', password: 'test123', role: 'user', fullName: 'Regular User' },
    ];
    
    for (const u of users) {
      try {
        // Check if user exists
        const existing = await db.oneOrNone('SELECT id FROM users WHERE username = $1', [u.username]);
        
        if (existing) {
          // Update password
          const hash = await bcrypt.hash(u.password, 10);
          await db.none(
            'UPDATE users SET password_hash = $1, role = $2, full_name = $3 WHERE username = $4',
            [hash, u.role, u.fullName, u.username]
          );
          console.log(`✅ Updated: ${u.username} (${u.role})`);
        } else {
          // Create new user
          const hash = await bcrypt.hash(u.password, 10);
          await db.none(
            'INSERT INTO users (username, password_hash, role, full_name) VALUES ($1, $2, $3, $4)',
            [u.username, hash, u.role, u.fullName]
          );
          console.log(`✅ Created: ${u.username} (${u.role})`);
        }
      } catch (err) {
        console.error(`❌ Error with ${u.username}:`, err.message);
      }
    }
    
    console.log('\n🎉 All users created/updated successfully!');
    console.log('\nTest accounts:');
    console.log('  - testuser / test123 (admin)');
    console.log('  - staff01 / staff123 (bank_staff)');
    console.log('  - test / test123 (user)');
    
    pgp.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    pgp.end();
    process.exit(1);
  }
}

createDefaultUsers();
