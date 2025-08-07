#!/bin/bash
echo "Avviando Backend..."

# Pulisci il file di log
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit
echo "" > BE.log

# Start Backend
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit/server
npm start > ../BE.log 2>&1 &
disown

# Verifica che il Backend sia partito
echo "Verificando avvio Backend..."
for i in {1..30}; do
    if netstat -ano | grep :3001 | grep LISTENING > /dev/null 2>&1; then
        echo "Backend avviato con successo sulla porta 3001."
        exit 0
    fi
    echo "Tentativo $i/30 - Backend non ancora pronto..."
    sleep 2
done

echo "ERRORE: Backend non si è avviato entro 60 secondi!"
exit 1