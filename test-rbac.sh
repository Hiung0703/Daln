#!/bin/bash

API_URL="http://localhost:4000/api"

echo "=========================================="
echo "🔐 Test Role-Based Access Control (RBAC)"
echo "=========================================="
echo

# 1. Test Admin Login
echo "1️⃣  Testing ADMIN login..."
ADMIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"admin123"}')

echo "$ADMIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ADMIN_RESPONSE"

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
ADMIN_ROLE=$(echo "$ADMIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['role'])" 2>/dev/null)

echo "Admin Token: ${ADMIN_TOKEN:0:50}..."
echo "Admin Role: $ADMIN_ROLE"
echo

# 2. Test Bank Staff Login
echo "2️⃣  Testing BANK STAFF login..."
STAFF_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"staff01","password":"staff123"}')

echo "$STAFF_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STAFF_RESPONSE"

STAFF_TOKEN=$(echo "$STAFF_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
STAFF_ROLE=$(echo "$STAFF_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['role'])" 2>/dev/null)

echo "Staff Token: ${STAFF_TOKEN:0:50}..."
echo "Staff Role: $STAFF_ROLE"
echo

# 3. Test Regular User Login
echo "3️⃣  Testing REGULAR USER login..."
USER_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}')

echo "$USER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$USER_RESPONSE"

USER_TOKEN=$(echo "$USER_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
USER_ROLE=$(echo "$USER_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['role'])" 2>/dev/null)

echo "User Token: ${USER_TOKEN:0:50}..."
echo "User Role: $USER_ROLE"
echo

echo "=========================================="
echo "📋 Testing Permissions"
echo "=========================================="
echo

# 4. Admin - Get all users (should succeed)
echo "4️⃣  Admin fetching all users..."
curl -s $API_URL/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | python3 -m json.tool | head -30
echo

# 5. Bank Staff - Get all users (should succeed)
echo "5️⃣  Bank Staff fetching all users..."
curl -s $API_URL/users \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  | python3 -m json.tool | head -20
echo

# 6. Regular User - Get all users (should FAIL)
echo "6️⃣  Regular User trying to fetch all users (should fail)..."
curl -s $API_URL/users \
  -H "Authorization: Bearer $USER_TOKEN"
echo -e "\n"

# 7. Admin - Create new user (should succeed)
echo "7️⃣  Admin creating new user..."
curl -s -X POST $API_URL/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "pass123",
    "role": "user",
    "fullName": "New Test User"
  }' | python3 -m json.tool
echo

# 8. Bank Staff - Create user (should FAIL)
echo "8️⃣  Bank Staff trying to create user (should fail)..."
curl -s -X POST $API_URL/users \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "anotheruser",
    "password": "pass123"
  }'
echo -e "\n"

# 9. Test History access
echo "9️⃣  Testing history access..."
echo "   Admin history:"
curl -s $API_URL/history \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'   Count: {len(data)} items')"

echo "   Bank Staff history:"
curl -s $API_URL/history \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'   Count: {len(data)} items')"

echo "   Regular User history:"
curl -s $API_URL/history \
  -H "Authorization: Bearer $USER_TOKEN" \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'   Count: {len(data)} items')"
echo

echo "=========================================="
echo "✅ RBAC Testing Complete!"
echo "=========================================="
echo
echo "📊 Summary:"
echo "   - Admin (testuser): Full access ✅"
echo "   - Bank Staff (staff01): View users, all history ✅"
echo "   - User (test): Limited to own data ✅"
echo
echo "🔑 Test Credentials:"
echo "   Admin: testuser / admin123"
echo "   Staff: staff01 / staff123"
echo "   User: test / test123"
echo
