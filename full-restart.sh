#!/bin/bash

echo "=========================================="
echo "🔧 Complete System Restart & Test"
echo "=========================================="
echo

# Kill all
echo "1️⃣  Killing all processes..."
killall -9 node python3 2>/dev/null || true
sleep 3

# Start backend
echo "2️⃣  Starting backend services..."
cd /home/dunhiung/Desktop/APP/check-ocr-web
./manage.sh start

# Wait for model to load
echo "3️⃣  Waiting for model to load (~45s)..."
for i in {1..45}; do
    echo -n "."
    sleep 1
done
echo ""

# Check backend
echo "4️⃣  Testing backend..."
echo -n "Node API: "
curl -s http://localhost:4000/ | grep -o '"message":"[^"]*"' || echo "FAILED"
echo -n "Model Service: "
curl -s http://localhost:5000/health | grep -o '"status":"[^"]*"' || echo "FAILED"

# Start frontend
echo "5️⃣  Starting frontend..."
nohup pnpm dev > /tmp/vite-dev.log 2>&1 &
echo $! > /tmp/vite-dev.pid
sleep 5

# Check frontend
echo "6️⃣  Checking frontend..."
if curl -s http://localhost:5173/ > /dev/null 2>&1; then
    echo "✅ Frontend responding"
else
    echo "❌ Frontend NOT responding"
    echo "Logs:"
    tail -20 /tmp/vite-dev.log
fi

echo ""
echo "=========================================="
echo "📊 Final Status"
echo "=========================================="
./manage.sh status

echo ""
echo "🌐 Access URLs:"
echo "  - React App: http://localhost:5173/"
echo "  - Simple Test: file:///home/dunhiung/Desktop/APP/check-ocr-web/test-simple.html"
echo "  - Standalone Test: file:///home/dunhiung/Desktop/APP/check-ocr-web/test-upload.html"
echo ""
echo "👤 Test Login:"
echo "  Username: testuser"
echo "  Password: test123"
echo ""
echo "🔍 If React app still loading forever, open browser console (F12) to see errors"
echo ""
