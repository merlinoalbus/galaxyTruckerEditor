#!/bin/bash
echo "Riavviando Frontend..."

# Kill Frontend on port 3000
for pid in $(netstat -ano | grep :3000 | grep LISTENING | awk '{print $5}'); do
    taskkill //PID $pid //F 2>/dev/null || true
done

sleep 3

# Start Frontend
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit
npm start > FE.log 2>&1 &
disown

# Verifica che il Frontend sia partito
echo "Verificando avvio Frontend..."
for i in {1..30}; do
    if netstat -ano | grep :3000 | grep LISTENING > /dev/null 2>&1; then
        echo "Frontend riavviato con successo sulla porta 3000."
        exit 0
    fi
    echo "Tentativo $i/30 - Frontend non ancora pronto..."
    sleep 2
done

echo "ERRORE: Frontend non si è riavviato entro 60 secondi!"
exit 1