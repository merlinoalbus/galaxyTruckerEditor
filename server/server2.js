// server2.js - Secondo server backend per Galaxy Trucker Editor
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const chokidar = require('chokidar');
const { getLogger } = require('./src/utils/logger');
const path = require('path');
const fs = require('fs');

// SOVRASCRIVE COMPLETAMENTE IL CONFIG PER TUTTO IL PROCESSO SERVER2
// Questo fa sì che tutti i require('./src/config/config') usino config2
const config2 = require('./src/config/config2');
require.cache[require.resolve('./src/config/config')] = {
  id: require.resolve('./src/config/config'),
  exports: config2,
  loaded: true
};

// Import routes - ora useranno automaticamente config2
const apiRoutes = require('./src/routes/apiRoutes');
const scriptsRoutes = require('./src/routes/scriptsRoutes');
const missionsRoutes = require('./src/routes/missionsRoutes');
const gameRoutes = require('./src/routes/gameRoutes');
const metacodesRoutes = require('./src/routes/metacodesRoutes');
const localizationRoutes = require('./src/routes/localizationRoutes');
const exportRoutes = require('./src/routes/exportRoutes');

const app = express();
const PORT = config2.PORT || 3002;
const logger = getLogger();

// Verifica che il path del gioco esista
const gamePath = config2.GAME_BASE_PATH || './GAMEFOLDER2';
if (!fs.existsSync(gamePath)) {
  logger.warn(`⚠️ Game path not found: ${gamePath}`);
  logger.warn(`Please update GAME_HOST_BE2 in server/.env`);
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
if (gamePath && fs.existsSync(gamePath)) {
  app.use('/static', express.static(gamePath, {
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
    gamePath: gamePath,
    gamePathExists: fs.existsSync(gamePath)
  });
});

// Server info endpoint (mantiene /api per compatibilità iniziale)
app.get('/api/server-info', (req, res) => {
  res.json({
    name: config2.SERVER_NAME,
    port: config2.PORT,
    gamePath: gamePath,
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
    path.join(gamePath, 'campaign'),
    path.join(gamePath, 'missions'),
    path.join(gamePath, 'localization_strings')
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
  logger.info(`📁 Game path: ${gamePath}`);
  logger.info(`✅ Server ready for connections`);
  
  if (!fs.existsSync(gamePath)) {
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