#!/usr/bin/env bash
# Safe helper to restart the forwarder on a given port.
# Usage:
#   ./start_forwarder.sh [PORT] [MODEL_URL] [MODEL_PAYLOAD] [MODEL_FIELD_NAME] [MODEL_AUTH]
# Example:
#   ./start_forwarder.sh 4000 http://localhost:5000/predict multipart file "Bearer TOKEN"

set -euo pipefail
PORT=${1:-4000}
MODEL_URL=${2:-http://localhost:5000/predict}
MODEL_PAYLOAD=${3:-multipart}
MODEL_FIELD_NAME=${4:-file}
MODEL_AUTH=${5:-}
LOGFILE=/tmp/forwarder.log

echo "Restarting forwarder on port $PORT -> MODEL_URL=$MODEL_URL PAYLOAD=$MODEL_PAYLOAD FIELD=$MODEL_FIELD_NAME"

# Find and kill processes listening on the port (if any)
if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti tcp:"$PORT" || true)
else
  PIDS=$(ss -ltnp "sport = :$PORT" 2>/dev/null | awk 'NR>1 && $1 ~ /LISTEN/ {print $6}' | sed 's/,.*$//' | sed 's/pid=//' || true)
fi

if [ -n "$PIDS" ]; then
  echo "Killing existing PIDs on port $PORT: $PIDS"
  for pid in $PIDS; do
    kill "$pid" || true
  done
  sleep 1
fi

# Start forwarder in background with nohup
mkdir -p "$(dirname "$LOGFILE")"
export MODEL_URL="$MODEL_URL"
export MODEL_PAYLOAD="$MODEL_PAYLOAD"
export MODEL_FIELD_NAME="$MODEL_FIELD_NAME"
if [ -n "$MODEL_AUTH" ]; then
  export MODEL_AUTH="$MODEL_AUTH"
fi

echo "Starting forwarder, logging to $LOGFILE"
nohup env PORT="$PORT" node index.js > "$LOGFILE" 2>&1 &
NEWPID=$!
sleep 1
echo "Started PID: $NEWPID"
# Show head of log
head -n 50 "$LOGFILE" || true

echo "Done. To watch logs: tail -f $LOGFILE"
