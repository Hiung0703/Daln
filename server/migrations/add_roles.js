const db = require('../config/database');

/**
 * Migration: Thêm hệ thống phân quyền (role-based access control)
 * 
 * Roles:
 * - admin: Quản trị hệ thống, quản lý users
 * - bank_staff: Nhân viên ngân hàng, xem & xử lý tất cả checks
 * - user: Người dùng thông thường, chỉ xem checks của mình
 */

async function addRoleSystem() {
    try {
        console.log('Starting role system migration...');

        // 1. Thêm cột role vào bảng users
        await db.none(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'role'
                ) THEN
                    ALTER TABLE users 
                    ADD COLUMN role VARCHAR(20) DEFAULT 'user' 
                    CHECK (role IN ('admin', 'bank_staff', 'user'));
                END IF;
            END $$;
        `);
        console.log('✅ Added role column to users table');

        // 2. Thêm các cột bổ sung cho user profile
        await db.none(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'full_name'
                ) THEN
                    ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'email'
                ) THEN
                    ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'is_active'
                ) THEN
                    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'last_login'
                ) THEN
                    ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
                END IF;
            END $$;
        `);
        console.log('✅ Added profile columns to users table');

        // 3. Tạo bảng permissions (nếu cần mở rộng sau)
        await db.none(`
            CREATE TABLE IF NOT EXISTS permissions (
                id SERIAL PRIMARY KEY,
                role VARCHAR(20) NOT NULL,
                resource VARCHAR(50) NOT NULL,
                action VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(role, resource, action)
            );
        `);
        console.log('✅ Created permissions table');

        // 4. Insert default permissions
        const defaultPermissions = [
            // Admin permissions
            { role: 'admin', resource: 'users', action: 'create' },
            { role: 'admin', resource: 'users', action: 'read' },
            { role: 'admin', resource: 'users', action: 'update' },
            { role: 'admin', resource: 'users', action: 'delete' },
            { role: 'admin', resource: 'checks', action: 'read_all' },
            { role: 'admin', resource: 'checks', action: 'update_all' },
            { role: 'admin', resource: 'checks', action: 'delete_all' },
            { role: 'admin', resource: 'system', action: 'manage' },
            
            // Bank staff permissions
            { role: 'bank_staff', resource: 'checks', action: 'read_all' },
            { role: 'bank_staff', resource: 'checks', action: 'update_all' },
            { role: 'bank_staff', resource: 'checks', action: 'verify' },
            { role: 'bank_staff', resource: 'checks', action: 'approve' },
            { role: 'bank_staff', resource: 'users', action: 'read' },
            
            // User permissions
            { role: 'user', resource: 'checks', action: 'create' },
            { role: 'user', resource: 'checks', action: 'read_own' },
            { role: 'user', resource: 'checks', action: 'update_own' },
            { role: 'user', resource: 'checks', action: 'delete_own' },
        ];

        for (const perm of defaultPermissions) {
            await db.none(`
                INSERT INTO permissions (role, resource, action)
                VALUES ($1, $2, $3)
                ON CONFLICT (role, resource, action) DO NOTHING
            `, [perm.role, perm.resource, perm.action]);
        }
        console.log('✅ Inserted default permissions');

        // 5. Tạo user admin mặc định nếu chưa có
        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        // Check if admin already exists
        const existingAdmin = await db.oneOrNone(`
            SELECT id FROM users WHERE username = 'admin'
        `);
        
        if (existingAdmin) {
            // Update existing admin user
            await db.none(`
                UPDATE users 
                SET role = 'admin', 
                    full_name = 'System Administrator',
                    email = 'admin@checkocr.com',
                    is_active = TRUE
                WHERE username = 'admin'
            `);
            console.log('✅ Updated existing admin user');
        } else {
            // Insert new admin user
            await db.none(`
                INSERT INTO users (username, password_hash, role, full_name, email, is_active)
                VALUES ('admin', $1, 'admin', 'System Administrator', 'admin@checkocr.com', TRUE)
            `, [adminPassword]);
            console.log('✅ Created default admin user (username: admin, password: admin123)');
        }

        // 6. Cập nhật existing users thành role 'user'
        await db.none(`
            UPDATE users 
            SET role = 'user' 
            WHERE role IS NULL OR role = ''
        `);
        console.log('✅ Updated existing users with default role');

        // 7. Thêm index cho performance
        await db.none(`
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
            CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        `);
        console.log('✅ Created indexes');

        console.log('\n✅ Role system migration completed successfully!');
        console.log('\n📋 Default accounts:');
        console.log('   Admin: username=admin, password=admin123');
        console.log('\n🔐 Available roles:');
        console.log('   - admin: Full system access');
        console.log('   - bank_staff: Manage all checks, view users');
        console.log('   - user: Manage own checks only');

    } catch (error) {
        console.error('❌ Error in role system migration:', error);
        throw error;
    }
}

async function removeRoleSystem() {
    try {
        console.log('Rolling back role system migration...');
        
        await db.none('DROP TABLE IF EXISTS permissions CASCADE');
        await db.none('ALTER TABLE users DROP COLUMN IF EXISTS role CASCADE');
        await db.none('ALTER TABLE users DROP COLUMN IF EXISTS full_name CASCADE');
        await db.none('ALTER TABLE users DROP COLUMN IF EXISTS email CASCADE');
        await db.none('ALTER TABLE users DROP COLUMN IF EXISTS is_active CASCADE');
        await db.none('ALTER TABLE users DROP COLUMN IF EXISTS last_login CASCADE');
        
        console.log('✅ Rollback completed');
    } catch (error) {
        console.error('❌ Error in rollback:', error);
        throw error;
    }
}

// Run migration
if (require.main === module) {
    addRoleSystem()
        .then(() => {
            console.log('\n✅ Migration script completed');
            process.exit(0);
        })
        .catch((err) => {
            console.error('\n❌ Migration script failed:', err);
            process.exit(1);
        });
}

module.exports = { addRoleSystem, removeRoleSystem };
