// localizationRoutes.js - Routes per la gestione delle localization_strings
const express = require('express');
const router = express.Router();
const localizationController = require('../controllers/localizationController');
const { getLogger } = require('../utils/logger');

const logger = getLogger();

// Middleware per logging delle richieste di localizzazione
router.use((req, res, next) => {
  logger.debug(`Localization API: ${req.method} ${req.path}`, { 
    params: req.params, 
    query: req.query 
  });
  next();
});

// GET /api/localization/strings - Ottiene tutte le localization_strings
router.get('/strings', localizationController.getAllStrings);

// GET /api/localization/strings/:category - Ottiene le stringhe di una categoria specifica
router.get('/strings/:category', localizationController.getStringsByCategory);

// POST /api/localization/strings/:category/save - Salva le modifiche per una categoria
router.post('/strings/:category/save', localizationController.saveCategory);

// GET /api/localization/missions - Ottiene le traduzioni dei missions.yaml
router.get('/missions', localizationController.getMissionsTranslations);

// POST /api/localization/missions/save - Salva le modifiche per missions.yaml
router.post('/missions/save', localizationController.saveMissionsTranslations);

// GET /api/localization/nodes - Ottiene le traduzioni dei nodes.yaml
router.get('/nodes', localizationController.getNodesTranslations);

// POST /api/localization/nodes/save - Salva le modifiche per nodes.yaml
router.post('/nodes/save', localizationController.saveNodesTranslations);

// POST /api/localization/ai-translate - Traduzione AI per singola stringa
router.post('/ai-translate', localizationController.aiTranslateString);

// POST /api/localization/ai-translate-category - Traduzione AI per intera categoria
router.post('/ai-translate-category', localizationController.aiTranslateCategory);

// Error handling middleware specifico per localization
router.use((err, req, res, next) => {
  logger.error(`Localization API Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: 'Localization API error',
    message: err.message
  });
});

module.exports = router;