#!/bin/bash
echo "🔄 Riavviando tutti i servizi Galaxy Trucker Editor..."

# Prima termina tutti i servizi
./scripts/stop-all.sh

# Attendi che i processi si chiudano completamente
sleep 3

# Poi avvia tutti i servizi
./scripts/start-all.sh