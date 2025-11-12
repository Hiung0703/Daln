#!/bin/bash

echo "🧪 Testing login and token..."
echo ""

# Test 1: Login với testuser
echo "1️⃣ Login với testuser/test123..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}')

echo "Response: $RESPONSE"
echo ""

# Extract token
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

# Test 2: Test token với /api/me
echo "2️⃣ Testing token với /api/me..."
ME_RESPONSE=$(curl -s -X GET http://localhost:4000/api/me \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ME_RESPONSE"
echo ""

# Test 3: Get history
echo "3️⃣ Testing /api/history với token..."
HISTORY_RESPONSE=$(curl -s -X GET http://localhost:4000/api/history \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $HISTORY_RESPONSE"
echo ""

echo "✅ All tests completed!"
