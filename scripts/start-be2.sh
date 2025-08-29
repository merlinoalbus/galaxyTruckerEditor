#!/bin/bash

# Script per avviare il secondo Backend (porta 3002)

echo "🚀 Starting Backend 2 on port 3002..."

# Kill existing process on port 3002
if lsof -i:3002 > /dev/null 2>&1; then
    echo "⚠️ Port 3002 is in use, killing existing process..."
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Start Backend 2
cd server
nohup node server2.js > ../BE2.log 2>&1 &
BE2_PID=$!

echo "🔄 Waiting for Backend 2 to start..."

# Wait for backend to be ready (max 60 seconds)
counter=0
while [ $counter -lt 60 ]; do
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo "✅ Backend 2 started successfully on port 3002 (PID: $BE2_PID)"
        echo "📝 Logs available in BE2.log"
        exit 0
    fi
    counter=$((counter + 1))
    sleep 1
done

echo "❌ Failed to start Backend 2 after 60 seconds"
echo "Check BE2.log for errors"
exit 1