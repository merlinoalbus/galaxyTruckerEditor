#!/bin/bash
echo "Terminando Frontend..."

# Kill Frontend on port 3000
for pid in $(netstat -ano | grep :3000 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

echo "Frontend terminato."
exit 0