#!/bin/bash
echo "Terminando Backend e Frontend..."

# Kill Backend on port 3001
for pid in $(netstat -ano | grep :3001 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

# Kill Frontend on port 3000
for pid in $(netstat -ano | grep :3000 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

echo "Backend e Frontend terminati."
exit 0