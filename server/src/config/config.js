// config.js - Configurazione centralizzata del server
const path = require('path');

// Root directory del gioco - definizione centralizzata
const GAME_ROOT = path.join(process.cwd(), '..', '..');

// Altre configurazioni possibili
const config = {
  // Paths
  GAME_ROOT: GAME_ROOT,
  
  // Server
  DEFAULT_PORT: 3001,
  
  // Languages supportate
  SUPPORTED_LANGUAGES: ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'],
  
  // File extensions
  SCRIPT_EXTENSIONS: ['.txt'],
  IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
  CONFIG_EXTENSIONS: ['.yaml', '.yml', '.json'],
  
  // Directories
  CAMPAIGN_DIR: 'campaign',
  LOCALIZATION_DIR: 'localization_strings',
  ACHIEVEMENTS_DIR: 'achievements',
  AVATARS_DIR: 'avatars',
  
  // File patterns
  SCRIPTS_PATTERN: /^scripts2.*\.txt$/i,
  MISSIONS_PATTERN: /^missions.*\.txt$/i,
  
  // Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_NESTING_DEPTH: 50,
  MAX_DIRECTORY_SCAN_DEPTH: 10,
  
  // Cache
  CACHE_DURATION: 3600, // 1 hour in seconds
  
  // Validation
  ALLOWED_CHARACTERS: /^[a-zA-Z0-9_\-\.\/\\]+$/,
  FORBIDDEN_PATHS: ['/etc/', '/proc/', '/sys/', 'C:\\Windows\\', 'C:\\Program Files\\']
};

module.exports = config;