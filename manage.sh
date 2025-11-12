#!/bin/bash

# Helper script để quản lý OCR Check Web Application

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
MODEL_SERVICE_DIR="$PROJECT_ROOT/model-service/app"
SERVER_DIR="$PROJECT_ROOT/server"

function start_model_service() {
    echo "🚀 Starting OCR Model Service..."
    cd "$MODEL_SERVICE_DIR"
    /home/dunhiung/Desktop/APP/model/.venv/bin/python main.py > /tmp/ocr-model-service.log 2>&1 &
    echo $! > /tmp/ocr-model-service.pid
    echo "✅ Model Service started (PID: $(cat /tmp/ocr-model-service.pid))"
    echo "📋 Logs: tail -f /tmp/ocr-model-service.log"
}

function stop_model_service() {
    if [ -f /tmp/ocr-model-service.pid ]; then
        PID=$(cat /tmp/ocr-model-service.pid)
        echo "🛑 Stopping Model Service (PID: $PID)..."
        kill $PID 2>/dev/null || echo "⚠️  Process not found"
        rm -f /tmp/ocr-model-service.pid
    else
        echo "⚠️  Model Service not running"
    fi
}

function start_node_server() {
    echo "🚀 Starting Node.js Server..."
    cd "$SERVER_DIR"
    npm start > /tmp/ocr-node-server.log 2>&1 &
    echo $! > /tmp/ocr-node-server.pid
    echo "✅ Node Server started (PID: $(cat /tmp/ocr-node-server.pid))"
    echo "📋 Logs: tail -f /tmp/ocr-node-server.log"
}

function stop_node_server() {
    if [ -f /tmp/ocr-node-server.pid ]; then
        PID=$(cat /tmp/ocr-node-server.pid)
        echo "🛑 Stopping Node Server (PID: $PID)..."
        kill $PID 2>/dev/null || echo "⚠️  Process not found"
        rm -f /tmp/ocr-node-server.pid
    else
        echo "⚠️  Node Server not running"
    fi
}

function status() {
    echo "📊 Service Status:"
    echo ""
    
    if [ -f /tmp/ocr-model-service.pid ]; then
        PID=$(cat /tmp/ocr-model-service.pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo "✅ Model Service: Running (PID: $PID)"
        else
            echo "❌ Model Service: Stopped (stale PID)"
        fi
    else
        echo "❌ Model Service: Not running"
    fi
    
    if [ -f /tmp/ocr-node-server.pid ]; then
        PID=$(cat /tmp/ocr-node-server.pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo "✅ Node Server: Running (PID: $PID)"
        else
            echo "❌ Node Server: Stopped (stale PID)"
        fi
    else
        echo "❌ Node Server: Not running"
    fi
    
    echo ""
    echo "🔗 URLs:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - API Server: http://localhost:4000"
    echo "   - Model Service: http://localhost:5000"
}

function logs() {
    echo "📋 Recent logs:"
    echo ""
    echo "=== Model Service ==="
    tail -20 /tmp/ocr-model-service.log 2>/dev/null || echo "No logs"
    echo ""
    echo "=== Node Server ==="
    tail -20 /tmp/ocr-node-server.log 2>/dev/null || echo "No logs"
}

case "$1" in
    start)
        start_model_service
        sleep 2
        start_node_server
        ;;
    stop)
        stop_node_server
        stop_model_service
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    start-model)
        start_model_service
        ;;
    stop-model)
        stop_model_service
        ;;
    start-server)
        start_node_server
        ;;
    stop-server)
        stop_node_server
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|start-model|stop-model|start-server|stop-server}"
        exit 1
        ;;
esac
