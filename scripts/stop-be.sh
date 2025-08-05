#!/bin/bash
echo "Terminando Backend..."

# Kill Backend on port 3001
for pid in $(netstat -ano | grep :3001 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

echo "Backend terminato."
exit 0