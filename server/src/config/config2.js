// Configurazione per il secondo server backend
const path = require('path');

module.exports = {
  PORT: process.env.SERVER_PORT_BE2,
  SERVER_NAME: 'Backend 2',
  
  // Path del gioco diverso - da personalizzare con il tuo path
  GAME_BASE_PATH: process.env.GAME_HOST_BE2,
  
  // Mount point diverso per distinguere i due server
  API_MOUNT_POINT: '/api2',
  
  // Paths relativi al GAME_BASE_PATH
  PATHS: {
    CAMPAIGN_SCRIPTS: 'campaign',
    MISSIONS: 'missions',
    LOCALIZATION: 'localization_strings',
    NODES: 'nodes.yaml',
    YAML_MISSIONS: 'missions.yaml'
  },
  
  // Configurazioni CORS identiche
  CORS_OPTIONS: {
    origin: 'http://localhost:3000',
    credentials: true
  }
};