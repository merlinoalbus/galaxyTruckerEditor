#!/bin/bash
echo "Riavviando Backend..."

# Kill Backend on port 3001
for pid in $(netstat -ano | grep :3001 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

sleep 3

# Start Backend
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit/server
npm start > ../BE.log 2>&1 &
disown

# Verifica che il Backend sia partito
echo "Verificando avvio Backend..."
for i in {1..30}; do
    if netstat -ano | grep :3001 | grep LISTENING > /dev/null 2>&1; then
        echo "Backend riavviato con successo sulla porta 3001."
        exit 0
    fi
    echo "Tentativo $i/30 - Backend non ancora pronto..."
    sleep 2
done

echo "ERRORE: Backend non si è riavviato entro 60 secondi!"
exit 1