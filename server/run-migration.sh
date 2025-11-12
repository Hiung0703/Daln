#!/bin/bash

echo "======================================"
echo "🔐 Running Role System Migration"
echo "======================================"
echo

cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Running pnpm install..."
    pnpm install
fi

# Run migration
echo "Running migration script..."
node migrations/add_roles.js

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ Migration completed successfully!"
    echo "======================================"
    echo ""
    echo "📋 Default admin account created:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "🔐 Available roles:"
    echo "   - admin: Full system access"
    echo "   - bank_staff: Manage all checks, view users"
    echo "   - user: Manage own checks only"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Restart server: cd .. && ./manage.sh restart"
    echo "   2. Test admin login"
    echo "   3. Create bank_staff users via admin panel"
    echo ""
else
    echo ""
    echo "======================================"
    echo "❌ Migration failed!"
    echo "======================================"
    echo ""
    echo "Please check the error messages above."
    echo "Common issues:"
    echo "  - PostgreSQL not running"
    echo "  - Database connection error"
    echo "  - Permissions issue"
    echo ""
    exit 1
fi
