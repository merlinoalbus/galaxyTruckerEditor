#!/bin/bash
echo "Terminando processi esistenti..."

# Kill Backend on port 3001
for pid in $(netstat -ano | grep :3001 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

# Kill Frontend on port 3000
for pid in $(netstat -ano | grep :3000 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

sleep 3

echo "Avviando server..."

# Start Backend
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit/server
npm start > ../BE.log 2>&1 &
disown

# Verifica che il Backend sia partito
echo "Verificando avvio Backend..."
for i in {1..30}; do
    if netstat -ano | grep :3001 | grep LISTENING > /dev/null 2>&1; then
        echo "Backend avviato con successo sulla porta 3001."
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERRORE: Backend non si è avviato entro 60 secondi!"
        exit 1
    fi
    echo "Tentativo $i/30 - Backend non ancora pronto..."
    sleep 2
done

# Start Frontend
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit
npm start > FE.log 2>&1 &
disown

# Verifica che il Frontend sia partito
echo "Verificando avvio Frontend..."
for i in {1..30}; do
    if netstat -ano | grep :3000 | grep LISTENING > /dev/null 2>&1; then
        echo "Frontend avviato con successo sulla porta 3000."
        echo "Server riavviati correttamente."
        exit 0
    fi
    echo "Tentativo $i/30 - Frontend non ancora pronto..."
    sleep 2
done

echo "ERRORE: Frontend non si è avviato entro 60 secondi!"
exit 1