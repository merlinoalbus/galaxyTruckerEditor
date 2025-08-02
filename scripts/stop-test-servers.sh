#!/bin/bash

# Script per fermare i server di test
# Posizione: supportappgtedit/scripts/stop-test-servers.sh

echo "🛑 Stopping test servers..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PID_FILE="$SCRIPT_DIR/.server-pids"

# Se esiste il file con i PID, leggi e termina i processi
if [ -f "$PID_FILE" ]; then
    source "$PID_FILE"
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping test frontend server (PID: $FRONTEND_PID)..."
        kill -9 $FRONTEND_PID 2>/dev/null
        echo "✓ Test frontend server stopped"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping test backend server (PID: $BACKEND_PID)..."
        kill -9 $BACKEND_PID 2>/dev/null
        echo "✓ Test backend server stopped"
    fi
    
    # Rimuovi il file dei PID
    rm "$PID_FILE"
else
    echo "⚠️  No PID file found. Trying to stop test servers by port..."
    
    # Fallback: termina processi sulle porte di TEST (3002 e 3003)
    if lsof -i:3002 > /dev/null 2>&1; then
        PID_3002=$(lsof -t -i:3002)
        kill -9 $PID_3002 2>/dev/null
        echo "✓ Stopped process on test port 3002"
    fi
    
    if lsof -i:3003 > /dev/null 2>&1; then
        PID_3003=$(lsof -t -i:3003)
        kill -9 $PID_3003 2>/dev/null
        echo "✓ Stopped process on test port 3003"
    fi
fi

# Verifica finale
if ! lsof -i:3002 > /dev/null 2>&1 && ! lsof -i:3003 > /dev/null 2>&1; then
    echo "✅ All test servers stopped successfully"
else
    echo "⚠️  Some test servers may still be running"
fi