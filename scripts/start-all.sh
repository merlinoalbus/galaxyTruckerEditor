#!/bin/bash
echo "🚀 Avviando tutti i servizi Galaxy Trucker Editor..."

# Pulisci i file di log
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit
echo "" > BE.log
echo "" > BE2.log
echo "" > FE.log

# Start Backend 1 (porta 3001)
echo "▶️ Avviando Backend 1 (porta 3001)..."
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit/server
npm start > ../BE.log 2>&1 &
disown

# Verifica che il Backend 1 sia partito
echo "⏳ Verificando avvio Backend 1..."
for i in {1..30}; do
    if netstat -ano | grep :3001 | grep LISTENING > /dev/null 2>&1; then
        echo "✅ Backend 1 avviato con successo sulla porta 3001."
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️ Backend 1 non si è avviato entro 60 secondi (continuo comunque)."
    fi
    echo "Tentativo $i/30 - Backend 1 non ancora pronto..."
    sleep 2
done

# Start Backend 2 (porta 3002)
echo "▶️ Avviando Backend 2 (porta 3002)..."
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit/server
npm run start2 > ../BE2.log 2>&1 &
disown

# Verifica che il Backend 2 sia partito
echo "⏳ Verificando avvio Backend 2..."
for i in {1..30}; do
    if netstat -ano | grep :3002 | grep LISTENING > /dev/null 2>&1; then
        echo "✅ Backend 2 avviato con successo sulla porta 3002."
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️ Backend 2 non si è avviato entro 60 secondi (continuo comunque)."
    fi
    echo "Tentativo $i/30 - Backend 2 non ancora pronto..."
    sleep 2
done

# Verifica che almeno un backend sia attivo
BE1_ACTIVE=false
BE2_ACTIVE=false

if netstat -ano | grep :3001 | grep LISTENING > /dev/null 2>&1; then
    BE1_ACTIVE=true
fi

if netstat -ano | grep :3002 | grep LISTENING > /dev/null 2>&1; then
    BE2_ACTIVE=true
fi

if [ "$BE1_ACTIVE" = false ] && [ "$BE2_ACTIVE" = false ]; then
    echo "❌ ERRORE: Nessun backend è attivo! Il frontend non può funzionare."
    exit 1
fi

# Start Frontend
echo "▶️ Avviando Frontend..."
cd /c/Users/rober/OneDrive/Documenti/Repository/supportappgtedit
export PORT=3000
npm start > FE.log 2>&1 &
disown

# Verifica che il Frontend sia partito
echo "⏳ Verificando avvio Frontend..."
for i in {1..30}; do
    if netstat -ano | grep :3000 | grep LISTENING > /dev/null 2>&1; then
        echo "✅ Frontend avviato con successo sulla porta 3000."
        echo ""
        echo "====================================="
        echo "🎮 Galaxy Trucker Editor Avviato!"
        echo "====================================="
        [ "$BE1_ACTIVE" = true ] && echo "✅ Backend 1: http://localhost:3001"
        [ "$BE1_ACTIVE" = false ] && echo "❌ Backend 1: Non disponibile"
        [ "$BE2_ACTIVE" = true ] && echo "✅ Backend 2: http://localhost:3002"
        [ "$BE2_ACTIVE" = false ] && echo "❌ Backend 2: Non disponibile"
        echo "🌐 Frontend: http://localhost:3000"
        echo "====================================="
        echo "📝 Log disponibili in: BE.log, BE2.log, FE.log"
        exit 0
    fi
    echo "Tentativo $i/30 - Frontend non ancora pronto..."
    sleep 2
done

echo "❌ ERRORE: Frontend non si è avviato entro 60 secondi!"
exit 1