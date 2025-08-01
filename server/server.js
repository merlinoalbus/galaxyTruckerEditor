const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const chokidar = require('chokidar');
// const rateLimit = require('express-rate-limit'); // DISABLED
const helmet = require('helmet');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurazione logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Path base del gioco (parent directory dell'editor)
const GAME_ROOT = path.resolve(__dirname, '../../');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Assicurati che la directory backup esista
fs.ensureDirSync(BACKUP_DIR);

// Middleware di sicurezza
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting completely disabled for development
// app.use(limiter); // DISABLED to fix ERR_INSUFFICIENT_RESOURCES

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from game directory
app.use('/static', express.static(GAME_ROOT));

// Struttura dei file del gioco
const GAME_STRUCTURE = {
  missions: {
    path: 'multiplayermissions',
    extension: '.yaml',
    description: 'Multiplayer mission configurations'
  },
  deckScripts: {
    path: 'customScripts',
    extension: '.txt',
    description: 'Deck building scripts'
  },
  adventureCards: {
    path: 'advCards',
    extension: '.yaml',
    description: 'Adventure card definitions'
  },
  shipParts: {
    path: 'parts',
    extension: '.yaml',
    description: 'Ship part configurations'
  },
  localization: {
    path: 'localization_strings',
    extension: '.yaml',
    description: 'Localization strings'
  },
  aiConfigs: {
    path: 'aiConfigs',
    extension: '.ai',
    description: 'AI configuration files'
  },
  ships: {
    path: 'ships',
    extension: '.yaml',
    description: 'Ship template definitions'
  },
  campaign: {
    path: 'campaign',
    extension: '.yaml',
    description: 'Campaign configurations'
  },
  campaignMissions: {
    path: 'campaign/campaignScriptsEN',
    extension: ['.yaml', '.txt'],
    description: 'Campaign missions'
  },
  campaignScriptsCS: {
    path: 'campaign/campaignScriptsCS',
    extension: '.txt',
    description: 'Campaign scripts Czech'
  },
  campaignScriptsDE: {
    path: 'campaign/campaignScriptsDE',
    extension: '.txt',
    description: 'Campaign scripts German'
  },
  campaignScriptsES: {
    path: 'campaign/campaignScriptsES',
    extension: '.txt',
    description: 'Campaign scripts Spanish'
  },
  campaignScriptsFR: {
    path: 'campaign/campaignScriptsFR',
    extension: '.txt',
    description: 'Campaign scripts French'
  },
  campaignScriptsPL: {
    path: 'campaign/campaignScriptsPL',
    extension: '.txt',
    description: 'Campaign scripts Polish'
  },
  campaignScriptsRU: {
    path: 'campaign/campaignScriptsRU',
    extension: '.txt',
    description: 'Campaign scripts Russian'
  }
};

// Utility function per creare backup
async function createBackup(filePath, content) {
  try {
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `${timestamp}_${fileName}`);
    await fs.writeFile(backupPath, content);
    logger.info(`Backup created: ${backupPath}`);
  } catch (error) {
    logger.error(`Failed to create backup: ${error.message}`);
  }
}

// Utility function per validare path
function validatePath(filePath) {
  const fullPath = path.resolve(GAME_ROOT, filePath);
  return fullPath.startsWith(path.resolve(GAME_ROOT));
}

// API per ottenere la struttura del gioco
app.get('/api/structure', (req, res) => {
  try {
    res.json({
      gameRoot: GAME_ROOT,
      structure: GAME_STRUCTURE,
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error getting structure: ${error.message}`);
    res.status(500).json({ error: 'Failed to get game structure' });
  }
});

// Health check - must come before parameterized routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gameRoot: GAME_ROOT,
    backupDir: BACKUP_DIR
  });
});

// API specifica per file di campagna con supporto multi-lingua
app.get('/api/campaign/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { lang = 'EN' } = req.query;
    
    // Determina la directory basata sulla lingua
    const campaignDir = `campaign/campaignScripts${lang.toUpperCase()}`;
    const filePath = path.join(GAME_ROOT, campaignDir, filename);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ 
        error: 'File not found',
        path: filePath,
        lang: lang.toUpperCase()
      });
    }

    const content = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);
    
    logger.info(`Campaign file read: ${filePath} (lang: ${lang.toUpperCase()})`);
    
    res.json({
      filename,
      content,
      language: lang.toUpperCase(),
      lastModified: stats.mtime,
      size: stats.size
    });
    
  } catch (error) {
    logger.error(`Error reading campaign file: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API per salvare file di campagna con supporto multi-lingua
app.post('/api/campaign/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { lang = 'EN' } = req.query;
    const { content } = req.body;
    
    if (!content && content !== '') {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Determina la directory basata sulla lingua
    const campaignDir = `campaign/campaignScripts${lang.toUpperCase()}`;
    const filePath = path.join(GAME_ROOT, campaignDir, filename);
    
    // Crea backup prima di salvare
    if (await fs.pathExists(filePath)) {
      const backupName = `${filename}_${lang.toUpperCase()}_${Date.now()}.bak`;
      const backupPath = path.join(BACKUP_DIR, backupName);
      await fs.copy(filePath, backupPath);
      logger.info(`Backup created: ${backupPath}`);
    }
    
    // Assicurati che la directory esista
    await fs.ensureDir(path.dirname(filePath));
    
    // Salva il file
    await fs.writeFile(filePath, content, 'utf8');
    
    logger.info(`Campaign file saved: ${filePath} (lang: ${lang.toUpperCase()})`);
    
    res.json({
      message: 'File saved successfully',
      filename,
      language: lang.toUpperCase(),
      path: filePath
    });
    
  } catch (error) {
    logger.error(`Error saving campaign file: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API per listare file di una categoria
app.get('/api/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryPath = path.join(GAME_ROOT, config.path);
    
    if (!await fs.pathExists(categoryPath)) {
      return res.json({ files: [], message: 'Directory does not exist' });
    }

    const files = await fs.readdir(categoryPath);
    const extensions = Array.isArray(config.extension) ? config.extension : [config.extension];
    const filteredFiles = files.filter(file => 
      extensions.some(ext => file.endsWith(ext)) && !file.startsWith('.')
    );

    const fileList = await Promise.all(
      filteredFiles.map(async (file) => {
        const filePath = path.join(categoryPath, file);
        const stats = await fs.stat(filePath);
        
        return {
          name: file,
          path: path.relative(GAME_ROOT, filePath),
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        };
      })
    );

    res.json({
      category,
      path: config.path,
      files: fileList.sort((a, b) => a.name.localeCompare(b.name))
    });

  } catch (error) {
    logger.error(`Error listing ${req.params.category}: ${error.message}`);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// API per leggere un file specifico
app.get('/api/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const filePath = path.join(GAME_ROOT, config.path, filename);
    
    if (!validatePath(filePath)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);

    // Parse YAML se applicabile
    let parsedContent = content;
    if (config.extension === '.yaml') {
      try {
        parsedContent = yaml.load(content);
      } catch (yamlError) {
        logger.warn(`YAML parse error for ${filename}: ${yamlError.message}`);
      }
    }

    res.json({
      filename,
      path: path.relative(GAME_ROOT, filePath),
      content,
      parsed: parsedContent,
      metadata: {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        encoding: 'utf8'
      }
    });

  } catch (error) {
    logger.error(`Error reading file ${req.params.filename}: ${error.message}`);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// API per salvare/creare un file
app.put('/api/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const { content, createBackup: shouldBackup = true } = req.body;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const filePath = path.join(GAME_ROOT, config.path, filename);
    
    if (!validatePath(filePath)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    // Assicurati che la directory esista
    await fs.ensureDir(path.dirname(filePath));

    // Crea backup se il file esiste già
    if (shouldBackup && await fs.pathExists(filePath)) {
      const existingContent = await fs.readFile(filePath, 'utf8');
      await createBackup(filePath, existingContent);
    }

    // Valida YAML se applicabile
    if (config.extension === '.yaml') {
      try {
        yaml.load(content); // Testa se è YAML valido
      } catch (yamlError) {
        return res.status(400).json({ 
          error: 'Invalid YAML content',
          details: yamlError.message 
        });
      }
    }

    // Salva il file
    await fs.writeFile(filePath, content, 'utf8');
    const stats = await fs.stat(filePath);

    logger.info(`File saved: ${filePath}`);

    res.json({
      filename,
      path: path.relative(GAME_ROOT, filePath),
      saved: true,
      metadata: {
        size: stats.size,
        modified: stats.mtime
      }
    });

  } catch (error) {
    logger.error(`Error saving file ${req.params.filename}: ${error.message}`);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// API per eliminare un file
app.delete('/api/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const { createBackup: shouldBackup = true } = req.body;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const filePath = path.join(GAME_ROOT, config.path, filename);
    
    if (!validatePath(filePath)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Crea backup prima di eliminare
    if (shouldBackup) {
      const content = await fs.readFile(filePath, 'utf8');
      await createBackup(filePath, content);
    }

    await fs.remove(filePath);
    logger.info(`File deleted: ${filePath}`);

    res.json({
      filename,
      deleted: true,
      backup: shouldBackup
    });

  } catch (error) {
    logger.error(`Error deleting file ${req.params.filename}: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// API per validare un file YAML
app.post('/api/validate/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { content } = req.body;
    const config = GAME_STRUCTURE[category];
    
    if (!config) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const errors = [];
    const warnings = [];

    // Valida YAML base
    if (config.extension === '.yaml') {
      try {
        const parsed = yaml.load(content);
        
        
      } catch (yamlError) {
        errors.push(`Invalid YAML: ${yamlError.message}`);
      }
    }

    res.json({
      valid: errors.length === 0,
      errors,
      warnings
    });

  } catch (error) {
    logger.error(`Error validating content: ${error.message}`);
    res.status(500).json({ error: 'Failed to validate content' });
  }
});

// API per ottenere i backup
app.get('/api/backups', async (req, res) => {
  try {
    const backupFiles = await fs.readdir(BACKUP_DIR);
    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          path: filePath
        };
      })
    );

    res.json({ 
      backups: backups.sort((a, b) => b.created - a.created)
    });

  } catch (error) {
    logger.error(`Error getting backups: ${error.message}`);
    res.status(500).json({ error: 'Failed to get backups' });
  }
});


// Error handler
app.use((error, req, res, next) => {
  logger.error(`Unhandled error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// File watcher per notificare cambiamenti
const watcher = chokidar.watch(GAME_ROOT, {
  ignored: /(^|[\/\\])\../, // ignora file nascosti
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', (filePath) => {
  logger.info(`File changed: ${filePath}`);
  // Qui potresti implementare notifiche WebSocket se necessario
});

app.listen(PORT, () => {
  logger.info(`Galaxy Trucker Editor Server running on port ${PORT}`);
  logger.info(`Game root: ${GAME_ROOT}`);
  logger.info(`Backup directory: ${BACKUP_DIR}`);
});

module.exports = app;