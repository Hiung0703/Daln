const db = require('../models/db');

async function checkUser(username) {
  try {
    const user = await db.getUserByUsername(username);
    if (user) {
      console.log('✅ User found:');
      console.log('  - ID:', user.id);
      console.log('  - Username:', user.username);
      console.log('  - Role:', user.role);
      console.log('  - Full Name:', user.full_name);
    } else {
      console.log('❌ User not found:', username);
      console.log('\nAvailable users:');
      const allUsers = await db.getAllUsers();
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role})`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

const username = process.argv[2] || 'test1';
checkUser(username);
