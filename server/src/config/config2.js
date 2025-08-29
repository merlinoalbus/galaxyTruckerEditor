// config2.js - Configurazione per Backend 2 basata su config originale
const path = require('path');

// Carica il config originale come base
const baseConfig = require('./config');

// Carica configurazione specifica da variabili ambiente per BE2
const GAME_HOST = process.env.GAME_HOST_BE2 || path.join(process.cwd(), 'GAMEFOLDER2');
const SERVER_PORT = process.env.SERVER_PORT_BE2 || 3002;
const HOST_ADDRESS = process.env.HOST_ADDRESS || 'localhost';
const GAME_ROOT = GAME_HOST;

// Crea nuovo config estendendo quello base ma con path diversi
const config2 = {
  ...baseConfig,
  
  // Override paths specifici per BE2
  GAME_ROOT: GAME_ROOT,
  GAME_HOST: GAME_HOST,
  SERVER_PORT: SERVER_PORT,
  HOST_ADDRESS: HOST_ADDRESS,
  DEFAULT_PORT: 3002,
  
  // Proprietà specifiche Backend 2
  PORT: SERVER_PORT,
  SERVER_NAME: 'Backend 2',
  GAME_BASE_PATH: GAME_HOST,
  API_MOUNT_POINT: '/api2',
  
  CORS_OPTIONS: {
    origin: 'http://localhost:3000',
    credentials: true
  }
};

// Rigenera PATH_TEMPLATES con il nuovo GAME_ROOT
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

config2.PATH_TEMPLATES = PATH_TEMPLATES;

module.exports = config2;