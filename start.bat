@echo off
echo 🚀 Galaxy Trucker Editor - Avvio...

REM Controlla se Docker è installato
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker non trovato. Installare Docker Desktop per continuare.
    pause
    exit /b 1
)

REM Controlla se docker-compose è installato
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose non trovato. Installare Docker Compose per continuare.
    pause
    exit /b 1
)

echo 📦 Avvio con Docker Compose...
docker-compose up --build -d

echo ✅ Galaxy Trucker Editor avviato!
echo 🌐 Accedi all'applicazione su: http://localhost:3000
echo.
echo 💡 Comandi utili:
echo    docker-compose logs -f    # Visualizza i log
echo    docker-compose down       # Ferma l'applicazione
echo    docker-compose restart    # Riavvia l'applicazione
echo.
pause