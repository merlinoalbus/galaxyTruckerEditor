// characterUtils.js - Utilità per gestione personaggi
const fs = require('fs-extra');
const path = require('path');
const { getLogger } = require('./logger');

const logger = getLogger();

// Define GAME_ROOT - temporary until moved to config
const GAME_ROOT = process.cwd();

// Funzione per trovare tutte le immagini di un personaggio
async function findCharacterImages(characterName) {
  try {
    const imageDir = path.join(GAME_ROOT, 'campaign', 'campaignMap', 'big');
    
    if (!await fs.pathExists(imageDir)) {
      return [];
    }
    
    const files = await fs.readdir(imageDir);
    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    const characterImages = [];
    
    // Cerca tutti i file che iniziano con il nome del personaggio
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const baseName = path.basename(file, ext);
      
      if (imageExtensions.includes(ext)) {
        // Controlla se il file inizia con il nome del personaggio
        if (baseName === characterName) {
          // Immagine base (default)
          characterImages.push({
            variant: 'default',
            fileName: file,
            url: `/api/character/image/${characterName}`,
            isDefault: true
          });
        } else if (baseName.startsWith(`${characterName}_`)) {
          // Immagini con varianti (es. "character_happy.png")
          const variant = baseName.substring(characterName.length + 1);
          characterImages.push({
            variant: variant,
            fileName: file,
            url: `/api/character/image/${characterName}?variant=${variant}`,
            isDefault: false
          });
        }
      }
    }
    
    // Ordina le immagini: default prima, poi per nome variante
    characterImages.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.variant.localeCompare(b.variant);
    });
    
    return characterImages;
    
  } catch (error) {
    logger.error(`Error finding images for character ${characterName}: ${error.message}`);
    return [];
  }
}

module.exports = {
  findCharacterImages
};
