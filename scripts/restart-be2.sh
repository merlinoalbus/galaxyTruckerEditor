#!/bin/bash

# Script per riavviare il secondo Backend (porta 3002)

echo "🔄 Restarting Backend 2..."

# Stop
./scripts/stop-be2.sh

sleep 1

# Start
./scripts/start-be2.sh