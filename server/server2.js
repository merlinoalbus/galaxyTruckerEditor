// server2.js - Secondo server backend per Galaxy Trucker Editor
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const chokidar = require('chokidar');
const { getLogger } = require('./src/utils/logger');
const path = require('path');
const fs = require('fs');

// Usa configurazione specifica per server2
const config2 = require('./config-server2');

// Import routes
const apiRoutes = require('./src/routes/apiRoutes');
const scriptsRoutes = require('./src/routes/scriptsRoutes');
const missionsRoutes = require('./src/routes/missionsRoutes');
const gameRoutes = require('./src/routes/gameRoutes');
const metacodesRoutes = require('./src/routes/metacodesRoutes');
const localizationRoutes = require('./src/routes/localizationRoutes');
const exportRoutes = require('./src/routes/exportRoutes');

const app = express();
const PORT = config2.PORT;
const logger = getLogger();

// Override del config per usare i path del secondo server
const config = require('./src/config/config');
config.GAME_HOST = config2.GAME_BASE_PATH;
config.SERVER_PORT = config2.PORT;

// Verifica che il path del gioco esista
if (!fs.existsSync(config2.GAME_BASE_PATH)) {
  logger.warn(`⚠️ Game path not found: ${config2.GAME_BASE_PATH}`);
  logger.warn(`Please update GAME_BASE_PATH in server/config-server2.js`);
}

// Middleware di sicurezza
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS per frontend
app.use(cors(config2.CORS_OPTIONS));

// Parsing JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from game directory
if (config2.GAME_BASE_PATH && fs.existsSync(config2.GAME_BASE_PATH)) {
  app.use('/static', express.static(config2.GAME_BASE_PATH, {
    setHeaders: (res, path) => {
      if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/png');
      }
    }
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    serverName: config2.SERVER_NAME,
    port: config2.PORT,
    gamePath: config2.GAME_BASE_PATH,
    gamePathExists: fs.existsSync(config2.GAME_BASE_PATH)
  });
});

// Server info endpoint (mantiene /api per compatibilità iniziale)
app.get('/api/server-info', (req, res) => {
  res.json({
    name: config2.SERVER_NAME,
    port: config2.PORT,
    gamePath: config2.GAME_BASE_PATH,
    mountPoint: config2.API_MOUNT_POINT
  });
});

// Mount API routes usando il mount point configurato
const mountPoint = config2.API_MOUNT_POINT;
app.use(mountPoint, apiRoutes);
app.use(`${mountPoint}/scripts`, scriptsRoutes);
app.use(`${mountPoint}/missions`, missionsRoutes);
app.use(`${mountPoint}/game`, gameRoutes);
app.use(`${mountPoint}/metacodes`, metacodesRoutes);
app.use(`${mountPoint}/localization`, localizationRoutes);
app.use(`${mountPoint}/export`, exportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    serverName: config2.SERVER_NAME
  });
});

// File watcher per hot reload (opzionale)
if (process.env.NODE_ENV !== 'production') {
  const watchPaths = [
    path.join(config2.GAME_BASE_PATH, 'campaign'),
    path.join(config2.GAME_BASE_PATH, 'missions'),
    path.join(config2.GAME_BASE_PATH, 'localization_strings')
  ].filter(p => fs.existsSync(p));

  if (watchPaths.length > 0) {
    const watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', (path) => {
      logger.info(`[${config2.SERVER_NAME}] File changed: ${path}`);
    });
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 ${config2.SERVER_NAME} running on http://localhost:${PORT}`);
  logger.info(`📁 Game path: ${config2.GAME_BASE_PATH}`);
  logger.info(`✅ Server ready for connections`);
  
  if (!fs.existsSync(config2.GAME_BASE_PATH)) {
    logger.warn(`⚠️ Warning: Game path does not exist!`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info(`${config2.SERVER_NAME} shutting down...`);
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info(`${config2.SERVER_NAME} shutting down...`);
  process.exit(0);
});