#!/bin/bash
echo "Avviando Backend e Frontend..."

# Pulisci i file di log
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit
echo "" > BE.log
echo "" > FE.log

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
export PORT=3000
npm start > FE.log 2>&1 &
disown

# Verifica che il Frontend sia partito
echo "Verificando avvio Frontend..."
for i in {1..30}; do
    if netstat -ano | grep :3000 | grep LISTENING > /dev/null 2>&1; then
        echo "Frontend avviato con successo sulla porta 3000."
        echo "Backend e Frontend avviati correttamente."
        exit 0
    fi
    echo "Tentativo $i/30 - Frontend non ancora pronto..."
    sleep 2
done

echo "ERRORE: Frontend non si è avviato entro 60 secondi!"
exit 1