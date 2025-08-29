#!/bin/bash

# Script per fermare il secondo Backend (porta 3002)

echo "🛑 Stopping Backend 2..."

# Usa netstat e taskkill per Windows
PID=$(netstat -ano | grep :3002 | grep LISTENING | awk '{print $5}' | head -1)

if [ ! -z "$PID" ]; then
    echo "🔍 Found Backend 2 process with PID: $PID"
    taskkill //F //PID $PID > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Backend 2 stopped"
    else
        echo "❌ Failed to stop Backend 2"
    fi
else
    echo "ℹ️ Backend 2 is not running"
fi