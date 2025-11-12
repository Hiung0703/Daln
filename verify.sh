#!/bin/bash

echo "========================================"
echo "🔍 Check OCR Web - System Verification"
echo "========================================"
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
  local name=$1
  local url=$2
  
  if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $name${NC}"
    return 0
  else
    echo -e "${RED}❌ $name${NC}"
    return 1
  fi
}

check_port() {
  local name=$1
  local port=$2
  
  if lsof -i:$port > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $name (port $port)${NC}"
    return 0
  else
    echo -e "${RED}❌ $name (port $port)${NC}"
    return 1
  fi
}

check_file() {
  local name=$1
  local path=$2
  
  if [ -f "$path" ]; then
    echo -e "${GREEN}✅ $name${NC}"
    return 0
  else
    echo -e "${RED}❌ $name${NC}"
    return 1
  fi
}

check_dir() {
  local name=$1
  local path=$2
  
  if [ -d "$path" ]; then
    echo -e "${GREEN}✅ $name${NC}"
    return 0
  else
    echo -e "${RED}❌ $name${NC}"
    return 1
  fi
}

# Check 1: Prerequisites
echo "📦 1. Prerequisites"
echo "-------------------"
which python3 > /dev/null && echo -e "${GREEN}✅ Python 3${NC}" || echo -e "${RED}❌ Python 3${NC}"
which node > /dev/null && echo -e "${GREEN}✅ Node.js${NC}" || echo -e "${RED}❌ Node.js${NC}"
which pnpm > /dev/null && echo -e "${GREEN}✅ pnpm${NC}" || echo -e "${RED}❌ pnpm${NC}"
which psql > /dev/null && echo -e "${GREEN}✅ PostgreSQL${NC}" || echo -e "${RED}❌ PostgreSQL${NC}"
nvidia-smi > /dev/null 2>&1 && echo -e "${GREEN}✅ NVIDIA GPU${NC}" || echo -e "${RED}❌ NVIDIA GPU${NC}"
echo

# Check 2: Project Structure
echo "📁 2. Project Structure"
echo "----------------------"
BASE="/home/dunhiung/Desktop/APP/check-ocr-web"
check_dir "Frontend source" "$BASE/src"
check_dir "Backend server" "$BASE/server"
check_dir "Model service" "$BASE/model-service"
check_file "Package.json" "$BASE/package.json"
check_file "Manage script" "$BASE/manage.sh"
check_file "Test script" "$BASE/test-api.sh"
echo

# Check 3: Model Files
echo "🤖 3. AI Model Files"
echo "-------------------"
MODEL_PATH="/home/dunhiung/Desktop/APP/model/kaggle/working/Qwen2-VL-2B"
check_dir "Model directory" "$MODEL_PATH"
check_file "Model config" "$MODEL_PATH/adapter_config.json"
check_file "Model weights" "$MODEL_PATH/adapter_model.safetensors"
echo

# Check 4: Services Running
echo "🚀 4. Running Services"
echo "---------------------"
check_port "Model Service" 5000
check_port "Node API" 4000
check_port "Frontend Dev" 5173
echo

# Check 5: Service Health
echo "💚 5. Service Health"
echo "-------------------"
check_service "Model Service /health" "http://localhost:5000/health"
check_service "Node API /" "http://localhost:4000/"
check_service "Frontend" "http://localhost:5173/"
echo

# Check 6: API Endpoints
echo "🔌 6. API Endpoints"
echo "------------------"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImlhdCI6MTc2MjkzMTEyMCwiZXhwIjoxNzYzNTM1OTIwfQ.RfONEQ_JpMECs_mIWiMBenC1AG9DTczaBDH7pHU_A5o"

# Test auth endpoint
if curl -s http://localhost:4000/api/auth/login > /dev/null 2>&1; then
  echo -e "${GREEN}✅ POST /api/auth/login${NC}"
else
  echo -e "${RED}❌ POST /api/auth/login${NC}"
fi

# Test history endpoint
if curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/history > /dev/null 2>&1; then
  echo -e "${GREEN}✅ GET /api/history${NC}"
else
  echo -e "${RED}❌ GET /api/history${NC}"
fi

# Test scan endpoint availability (not actual upload)
if curl -s -X OPTIONS http://localhost:4000/api/scan > /dev/null 2>&1; then
  echo -e "${GREEN}✅ POST /api/scan (available)${NC}"
else
  echo -e "${YELLOW}⚠️  POST /api/scan (check manually)${NC}"
fi
echo

# Check 7: Log Files
echo "📋 7. Log Files"
echo "--------------"
check_file "Model service log" "/tmp/ocr-model-service.log"
check_file "Node server log" "/tmp/ocr-node-server.log"
check_file "Vite dev log" "/tmp/vite-dev.log"
echo

# Check 8: PID Files
echo "🔖 8. PID Files"
echo "--------------"
if [ -f "/tmp/ocr-model-service.pid" ]; then
  PID=$(cat /tmp/ocr-model-service.pid)
  if ps -p $PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Model Service PID ($PID)${NC}"
  else
    echo -e "${YELLOW}⚠️  Model Service PID exists but process dead${NC}"
  fi
else
  echo -e "${RED}❌ Model Service PID file${NC}"
fi

if [ -f "/tmp/ocr-node-server.pid" ]; then
  PID=$(cat /tmp/ocr-node-server.pid)
  if ps -p $PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Node Server PID ($PID)${NC}"
  else
    echo -e "${YELLOW}⚠️  Node Server PID exists but process dead${NC}"
  fi
else
  echo -e "${RED}❌ Node Server PID file${NC}"
fi

if [ -f "/tmp/vite-dev.pid" ]; then
  PID=$(cat /tmp/vite-dev.pid)
  if ps -p $PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Vite Dev PID ($PID)${NC}"
  else
    echo -e "${YELLOW}⚠️  Vite Dev PID exists but process dead${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Vite Dev PID file (may not exist if not started)${NC}"
fi
echo

# Check 9: Database
echo "🗄️  9. Database"
echo "--------------"
if sudo systemctl is-active postgresql > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PostgreSQL service${NC}"
else
  echo -e "${RED}❌ PostgreSQL service${NC}"
fi

# Check if tables exist (requires DB connection)
if psql -U postgres -d ocr_app -c "\dt" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database tables${NC}"
else
  echo -e "${YELLOW}⚠️  Database tables (check credentials)${NC}"
fi
echo

# Check 10: Documentation
echo "📚 10. Documentation"
echo "-------------------"
check_file "GUIDE.md" "$BASE/GUIDE.md"
check_file "SUMMARY.md" "$BASE/SUMMARY.md"
check_file "QUICKSTART.md" "$BASE/QUICKSTART.md"
check_file "README_OCR.md" "$BASE/README_OCR.md"
echo

# Summary
echo "========================================"
echo "📊 Verification Summary"
echo "========================================"
echo
echo "✅ All checks passed? Time to use the app!"
echo "❌ Some checks failed? Run troubleshooting:"
echo
echo "  ./manage.sh status    # Check service status"
echo "  ./manage.sh logs      # View recent logs"
echo "  ./manage.sh restart   # Restart services"
echo "  ./test-api.sh         # Test API endpoints"
echo
echo "🌐 Access URLs:"
echo "  Frontend: http://localhost:5173/"
echo "  API Docs: cat GUIDE.md"
echo
echo "👤 Test Credentials:"
echo "  Username: testuser"
echo "  Password: test123"
echo
