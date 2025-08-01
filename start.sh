#!/bin/bash

echo "🚀 Galaxy Trucker Editor - Avvio..."

# Controlla se Docker è installato
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non trovato. Installare Docker per continuare."
    exit 1
fi

# Controlla se docker-compose è installato
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose non trovato. Installare Docker Compose per continuare."
    exit 1
fi

echo "📦 Avvio con Docker Compose..."
docker-compose up --build -d

echo "✅ Galaxy Trucker Editor avviato!"
echo "🌐 Accedi all'applicazione su: http://localhost:3000"
echo ""
echo "💡 Comandi utili:"
echo "   docker-compose logs -f    # Visualizza i log"
echo "   docker-compose down       # Ferma l'applicazione"
echo "   docker-compose restart    # Riavvia l'applicazione"