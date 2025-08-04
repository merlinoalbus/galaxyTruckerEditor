// fileUtils.js - Utilità per gestione file e sicurezza
const fs = require('fs-extra');
const path = require('path');
const { getLogger } = require('./logger');

const logger = getLogger();

// Define GAME_ROOT - temporary until moved to config
const GAME_ROOT = process.cwd();

// Validazione sicurezza percorsi immagini
function validateImagePaths(imagePaths) {
  const validPaths = [];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  
  for (const imagePath of imagePaths) {
    if (typeof imagePath !== 'string') {
      continue;
    }
    
    // Normalizza il percorso
    const normalizedPath = path.normalize(imagePath);
    
    // Controlla che non contenga traversal
    if (normalizedPath.includes('..')) {
      logger.warn(`Rejected path with traversal: ${imagePath}`);
      continue;
    }
    
    // Controlla estensione
    const ext = path.extname(normalizedPath).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      logger.warn(`Rejected path with invalid extension: ${imagePath}`);
      continue;
    }
    
    validPaths.push(normalizedPath);
  }
  
  return validPaths;
}

// Carica immagine in formato binario
async function loadImageBinary(imagePath) {
  try {
    const fullPath = path.join(GAME_ROOT, imagePath);
    
    if (!await fs.pathExists(fullPath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }
    
    const buffer = await fs.readFile(fullPath);
    const base64Data = buffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    
    let mimeType = 'application/octet-stream';
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      case '.bmp':
        mimeType = 'image/bmp';
        break;
    }
    
    return {
      data: base64Data,
      mimeType: mimeType,
      size: buffer.length
    };
  } catch (error) {
    logger.error(`Error loading image ${imagePath}: ${error.message}`);
    throw error;
  }
}

// Scansione directory per immagini
async function scanDirectoryForImages(dirPath, relativePath = '') {
  const images = [];
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
  
  try {
    if (!await fs.pathExists(dirPath)) {
      return images;
    }
    
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile()) {
        const ext = path.extname(file.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const fullPath = path.join(dirPath, file.name);
          const stats = await fs.stat(fullPath);
          
          images.push({
            fileName: file.name,
            path: path.join(relativePath, file.name).replace(/\\/g, '/'),
            size: stats.size,
            modified: stats.mtime,
            extension: ext
          });
        }
      } else if (file.isDirectory()) {
        // Scansione ricorsiva (limitata a 2 livelli)
        const subDirPath = path.join(dirPath, file.name);
        const subRelativePath = path.join(relativePath, file.name);
        const subImages = await scanDirectoryForImages(subDirPath, subRelativePath);
        images.push(...subImages);
      }
    }
  } catch (error) {
    logger.error(`Error scanning directory ${dirPath}: ${error.message}`);
  }
  
  return images;
}

// Validazione percorso file generico
function isValidFilePath(filePath) {
  if (typeof filePath !== 'string') {
    return false;
  }
  
  // Normalizza il percorso
  const normalizedPath = path.normalize(filePath);
  
  // Controlla che non contenga traversal
  if (normalizedPath.includes('..')) {
    return false;
  }
  
  // Controlla che non punti a file di sistema
  const forbidden = ['/etc/', '/proc/', '/sys/', 'C:\\Windows\\', 'C:\\Program Files\\'];
  for (const forbiddenPath of forbidden) {
    if (normalizedPath.startsWith(forbiddenPath)) {
      return false;
    }
  }
  
  return true;
}

// Carica contenuto multilingua
async function loadMultilingualContent(contentType) {
  const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
  const content = {};
  
  for (const lang of languages) {
    const filePath = path.join(GAME_ROOT, `${contentType}_${lang}.txt`);
    
    if (await fs.pathExists(filePath)) {
      try {
        content[lang] = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        logger.warn(`Error loading ${contentType}_${lang}.txt: ${error.message}`);
      }
    }
  }
  
  return content;
}

module.exports = {
  validateImagePaths,
  loadImageBinary,
  scanDirectoryForImages,
  isValidFilePath,
  loadMultilingualContent
};
