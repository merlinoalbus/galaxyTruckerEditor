// server_new.js - Server modulare per Galaxy Trucker Editor Backend
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const chokidar = require('chokidar');
const { getLogger } = require('./src/utils/logger');

// Import routes
const apiRoutes = require('./src/routes/apiRoutes');
const scriptsRoutes = require('./src/routes/scriptsRoutes');
const missionsRoutes = require('./src/routes/missionsRoutes');
const gameRoutes = require('./src/routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
const logger = getLogger();

// Middleware di sicurezza
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS per frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002'
  ],
  credentials: true
}));

// Parsing JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0-modular'
  });
});

// Routes principali
app.use('/api', apiRoutes);
app.use('/api/scripts', scriptsRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/game', gameRoutes);

// File watcher per hot reload (development)
if (process.env.NODE_ENV !== 'production') {
  const watcher = chokidar.watch([
    './src/**/*.js',
    './*.js'
  ], {
    ignored: /node_modules/,
    persistent: true
  });
  
  watcher.on('change', (filePath) => {
    logger.info(`File changed: ${filePath}`);
    // In produzione questo dovrebbe triggerare un restart
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { 
    stack: err.stack,
    url: req.url,
    method: req.method 
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Galaxy Trucker Editor Backend (Modular) running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📁 Working directory: ${process.cwd()}`);
});

module.exports = app;