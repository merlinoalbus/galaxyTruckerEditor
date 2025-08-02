#!/bin/bash

# Script per avviare i server di test su porte dedicate
# Posizione: supportappgtedit/scripts/start-test-servers.sh

echo "🚀 Starting test servers on dedicated ports..."

# Salva il PID dei processi per poterli terminare dopo
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
PID_FILE="$SCRIPT_DIR/.server-pids"

# Pulisci eventuali PID precedenti
> "$PID_FILE"

# Verifica che le porte di test siano libere
if lsof -i:3002 > /dev/null 2>&1; then
    echo "❌ Port 3002 is already in use. Please free it before running tests."
    exit 1
fi

if lsof -i:3003 > /dev/null 2>&1; then
    echo "❌ Port 3003 is already in use. Please free it before running tests."
    exit 1
fi

# Avvia il server frontend (React) sulla porta 3002 per TEST
echo "Starting TEST frontend server on port 3002..."
cd "$PROJECT_ROOT"
PORT=3002 npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "FRONTEND_PID=$FRONTEND_PID" >> "$PID_FILE"
echo "✓ Test frontend server started (PID: $FRONTEND_PID)"

# Avvia il server backend (Node.js) sulla porta 3003 per TEST
echo "Starting TEST backend server on port 3003..."
cd "$PROJECT_ROOT/server"
PORT=3003 node index.js > /dev/null 2>&1 &
BACKEND_PID=$!
echo "BACKEND_PID=$BACKEND_PID" >> "$PID_FILE"
echo "✓ Test backend server started (PID: $BACKEND_PID)"

# Aspetta che i server siano pronti
echo "Waiting for test servers to be ready..."
sleep 5

# Verifica che i server siano attivi
if lsof -i:3002 > /dev/null 2>&1; then
    echo "✅ Test frontend server is running on port 3002"
else
    echo "❌ Test frontend server failed to start"
    exit 1
fi

if lsof -i:3003 > /dev/null 2>&1; then
    echo "✅ Test backend server is running on port 3003"
else
    echo "❌ Test backend server failed to start"
    exit 1
fi

echo "🎉 All test servers are ready!"
echo "📝 Frontend test URL: http://localhost:3002"
echo "📝 Backend test URL: http://localhost:3003"