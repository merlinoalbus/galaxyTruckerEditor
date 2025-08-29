// Configurazione per il secondo server backend
const path = require('path');

module.exports = {
  PORT: 3002,
  SERVER_NAME: 'Backend 2',
  
  // Path del gioco diverso - da personalizzare con il tuo path
  GAME_BASE_PATH: 'C:/Program Files (x86)/Steam/steamapps/common/Galaxy Trucker Extended',
  
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