#!/bin/bash
echo "🛑 Terminando tutti i servizi Galaxy Trucker Editor..."

# Kill Backend 1 on port 3001
echo "Terminando Backend 1 (porta 3001)..."
for pid in $(netstat -ano | grep :3001 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

# Kill Backend 2 on port 3002
echo "Terminando Backend 2 (porta 3002)..."
for pid in $(netstat -ano | grep :3002 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

# Kill Frontend on port 3000
echo "Terminando Frontend (porta 3000)..."
for pid in $(netstat -ano | grep :3000 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

echo "✅ Tutti i servizi sono stati terminati."
exit 0