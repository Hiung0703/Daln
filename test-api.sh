#!/bin/bash

API_URL="http://localhost:4000/api"
IMAGE_PATH="/home/dunhiung/Desktop/APP/check-ocr-web/input/image.jpg"

echo "=== 1. Đăng ký user test ==="
RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}')
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "\n=== Thử đăng nhập nếu user đã tồn tại ==="
  RESPONSE=$(curl -s -X POST $API_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"test123"}')
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
fi

echo -e "\n=== 2. Get History (trống ban đầu) ==="
curl -s $API_URL/history \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo -e "\n=== 3. Upload và Scan ảnh ==="
echo "⏳ Đang xử lý... (~20-30s)"
START_TIME=$(date +%s)

SCAN_RESPONSE=$(curl -s -X POST $API_URL/scan \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$IMAGE_PATH")

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "✅ Hoàn tất trong ${DURATION}s"
echo "$SCAN_RESPONSE" | python3 -m json.tool | head -80

echo -e "\n=== 4. Credentials cho test web ==="
echo "Username: testuser"
echo "Password: test123"
echo "URL: http://localhost:5173/"
