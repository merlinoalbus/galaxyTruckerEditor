#!/bin/bash
echo "Avviando Frontend..."

# Pulisci il file di log
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit
echo "" > FE.log

# Start Frontend
npm start > FE.log 2>&1 &
disown

# Verifica che il Frontend sia partito
echo "Verificando avvio Frontend..."
for i in {1..30}; do
    if netstat -ano | grep :3000 | grep LISTENING > /dev/null 2>&1; then
        echo "Frontend avviato con successo sulla porta 3000."
        exit 0
    fi
    echo "Tentativo $i/30 - Frontend non ancora pronto..."
    sleep 2
done

echo "ERRORE: Frontend non si è avviato entro 60 secondi!"
exit 1