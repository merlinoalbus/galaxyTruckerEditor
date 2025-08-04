// config.js - Configurazione centralizzata del server
const path = require('path');

// Carica configurazione da variabili ambiente o usa default
const GAME_HOST = process.env.GAME_HOST || path.join(process.cwd(), '..', '..');
const SERVER_PORT = process.env.SERVER_PORT || 3001;
const HOST_ADDRESS = process.env.HOST_ADDRESS || 'localhost';

// Root directory del gioco - configurabile tramite GAME_HOST
const GAME_ROOT = GAME_HOST;

// Altre configurazioni possibili
const config = {
  // Paths
  GAME_ROOT: GAME_ROOT,
  
  // Server - configurabile tramite variabili ambiente
  SERVER_PORT: SERVER_PORT,
  HOST_ADDRESS: HOST_ADDRESS,
  DEFAULT_PORT: 3001, // Mantenuto per retrocompatibilità
  
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

// Template per percorsi comuni
const PATH_TEMPLATES = {
  // Campaign paths
  campaignBase: path.join(GAME_ROOT, 'campaign'),
  campaignScripts: (lang) => `campaign/campaignScripts${lang}`,
  campaignScriptsDir: (lang) => path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`),
  charactersYaml: path.join(GAME_ROOT, 'campaign', 'characters.yaml'),
  nodesYaml: (lang) => path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`, 'nodes.yaml'),
  missionsYaml: (lang) => path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`, 'missions.yaml'),
  buttonLabelsYaml: (lang) => path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`, 'button_labels.yaml'),
  
  // Localization paths
  buttonStrings: (lang) => path.join(GAME_ROOT, 'localization_strings', `button_strings_${lang}.yaml`),
  buttonStringsAlt: (lang) => path.join(GAME_ROOT, 'localization', `button_strings_${lang}.yaml`),
  
  // Scripts paths
  scriptsFile: (lang) => path.join(GAME_ROOT, `scripts2${lang === 'EN' ? '' : lang}.txt`),
  
  // Fallback image
  fallbackImage: path.join(GAME_ROOT, 'avatars', 'common', 'avatar_no_avatar.png')
};

config.PATH_TEMPLATES = PATH_TEMPLATES;

module.exports = config;