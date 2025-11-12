const bcrypt = require('bcryptjs');
const db = require('../config/database');

(async () => {
  try {
    // Admin: testuser / admin123
    let hash = await bcrypt.hash('admin123', 10);
    await db.none(
      `INSERT INTO users (username, password_hash, role, full_name, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (username) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             full_name = EXCLUDED.full_name,
             is_active = TRUE`,
      ['testuser', hash, 'admin', 'Admin User']
    );
    console.log('✅ testuser password: admin123');
    
    // Staff: staff01 / staff123
    hash = await bcrypt.hash('staff123', 10);
    await db.none(
      `INSERT INTO users (username, password_hash, role, full_name, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (username) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             full_name = EXCLUDED.full_name,
             is_active = TRUE`,
      ['staff01', hash, 'bank_staff', 'Bank Staff']
    );
    console.log('✅ staff01 password: staff123');
    
    // User: test / test123
    hash = await bcrypt.hash('test123', 10);
    await db.none(
      `INSERT INTO users (username, password_hash, role, full_name, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (username) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             full_name = EXCLUDED.full_name,
             is_active = TRUE`,
      ['test', hash, 'user', 'Test User']
    );
    console.log('✅ test password: test123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
