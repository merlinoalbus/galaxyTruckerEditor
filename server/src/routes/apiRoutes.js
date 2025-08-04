// apiRoutes.js - Tutte le routes API del server
const express = require('express');
const { parseScriptContent } = require('../parsers/scriptParser');
const { getLogger } = require('../utils/logger');
const { 
  validateImagePaths, 
  loadImageBinary, 
  scanDirectoryForImages,
  isValidFilePath 
} = require('../utils/fileUtils');
const { GAME_ROOT } = require('../config/config');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const router = express.Router();
const logger = getLogger();

// API 1: Lista immagini JPG/PNG con ricerca ricorsiva e deduplicazione intelligente
router.get('/images', async (req, res) => {
  try {
    logger.info('API call: GET /api/images - Ricerca ricorsiva immagini con classificazione intelligente');
    
    const images = [];
    const imageRegex = /\.(jpe?g|png)$/i; // Case-insensitive
    
    // Funzione ricorsiva per scansionare cartelle
    async function scanRecursive(dirPath, relativePath = '', depth = 0) {
      if (depth > 10) return; // Limite profondità per sicurezza
      
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
          
          if (entry.isFile() && imageRegex.test(entry.name)) {
            const stats = await fs.stat(fullPath);
            const ext = path.extname(entry.name);
            const nomefile = path.basename(entry.name, ext);
            const percorsoNormalized = relPath.replace(/\\\\/g, '/');
            
            // Classificazione intelligente tipo/sottotipo
            const { tipo, sottotipo } = classifyImage(percorsoNormalized);
            
            images.push({
              nomefile: nomefile,
              percorso: percorsoNormalized,
              tipo: tipo,
              sottotipo: sottotipo,
              dimensione: stats.size,
              modificato: stats.mtime,
              profondita: depth
            });
            
          } else if (entry.isDirectory()) {
            await scanRecursive(fullPath, relPath, depth + 1);
          }
        }
      } catch (error) {
        logger.warn(`Cannot access directory ${dirPath}: ${error.message}`);
      }
    }
    
    // Classificazione intelligente basata su percorso
    function classifyImage(percorso) {
      const pathLower = percorso.toLowerCase();
      let tipo = 'system';
      let sottotipo = 'generic';
      
      // Classificazione tipo principale
      if (pathLower.includes('campaign/')) tipo = 'campaign';
      else if (pathLower.includes('icons/') || pathLower.includes('ui/')) tipo = 'interface';
      else if (pathLower.includes('parts/') || pathLower.includes('components/')) tipo = 'parts';
      else if (pathLower.includes('achievements/')) tipo = 'achievements';
      
      // Classificazione sottotipo
      if (pathLower.includes('/big/') || pathLower.includes('/small/')) sottotipo = 'character';
      else if (pathLower.includes('/images/') || pathLower.includes('/img/')) sottotipo = 'generic';
      else if (pathLower.includes('_big') || pathLower.includes('_small')) sottotipo = 'variant';
      else if (/\d+$/.test(path.basename(percorso, path.extname(percorso)))) sottotipo = 'sequence';
      
      return { tipo, sottotipo };
    }
    
    // Avvia scansione ricorsiva
    await scanRecursive(GAME_ROOT);
    
    // Deduplicazione per nomefile + tipo + sottotipo
    const uniqueMap = new Map();
    
    for (const immagine of images) {
      const key = `${immagine.nomefile}_${immagine.tipo}_${immagine.sottotipo}`;
      
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, immagine);
      } else {
        const existing = uniqueMap.get(key);
        
        // Priorità 1: Dimensione maggiore
        if (immagine.dimensione > existing.dimensione) {
          uniqueMap.set(key, immagine);
        } 
        // Priorità 2: Se stessa dimensione, più recente
        else if (immagine.dimensione === existing.dimensione && 
                 immagine.modificato > existing.modificato) {
          uniqueMap.set(key, immagine);
        }
      }
    }
    
    // Converti map in array e ordina
    const result = Array.from(uniqueMap.values()).sort((a, b) => {
      if (a.tipo !== b.tipo) return a.tipo.localeCompare(b.tipo);
      if (a.sottotipo !== b.sottotipo) return a.sottotipo.localeCompare(b.sottotipo);
      return a.nomefile.localeCompare(b.nomefile);
    });
    
    logger.info(`Found ${images.length} total images, ${result.length} unique after deduplication`);
    
    res.json({
      success: true,
      data: result,
      count: result.length,
      stats: {
        totali_trovate: images.length,
        dopo_deduplicazione: result.length,
        duplicate_rimosse: images.length - result.length
      }
    });
  } catch (error) {
    logger.error(`Error retrieving images: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve images',
      message: error.message 
    });
  }
});

// API 2: Recupero immagini in binary da JSON percorsi con fallback
router.post('/images/binary', async (req, res) => {
  try {
    const { percorsi } = req.body;
    
    logger.info(`API call: POST /api/images/binary - Loading ${percorsi?.length || 0} images`);
    
    if (!Array.isArray(percorsi)) {
      return res.status(400).json({ 
        success: false, 
        error: 'percorsi must be an array' 
      });
    }
    
    const fallbackImagePath = path.join(GAME_ROOT, 'avatars', 'common', 'avatar_no_avatar.png');
    let fallbackBinary = null;
    
    // Pre-carica immagine fallback
    try {
      if (await fs.pathExists(fallbackImagePath)) {
        const fallbackBuffer = await fs.readFile(fallbackImagePath);
        fallbackBinary = fallbackBuffer.toString('base64');
      }
    } catch (error) {
      logger.warn(`Cannot load fallback image: ${error.message}`);
    }
    
    const results = [];
    
    for (const percorso of percorsi) {
      try {
        // Validazione security path
        if (!isValidImagePath(percorso)) {
          throw new Error('Invalid or unsafe path');
        }
        
        const fullPath = path.join(GAME_ROOT, percorso);
        
        if (await fs.pathExists(fullPath)) {
          // Carica immagine richiesta
          const buffer = await fs.readFile(fullPath);
          const stats = await fs.stat(fullPath);
          
          results.push({
            percorso: percorso,
            binary: buffer.toString('base64'),
            successo: true,
            dimensione: stats.size
          });
        } else {
          // File non trovato - usa fallback
          results.push({
            percorso: percorso,
            binary: fallbackBinary,
            successo: false,
            errore: 'File not found - fallback applied',
            fallback: './avatars/common/avatar_no_avatar.png',
            dimensione: fallbackBinary ? Buffer.from(fallbackBinary, 'base64').length : 0
          });
        }
        
      } catch (error) {
        logger.error(`Error loading ${percorso}: ${error.message}`);
        
        // Errore generico - usa fallback
        results.push({
          percorso: percorso,
          binary: fallbackBinary,
          successo: false,
          errore: error.message,
          fallback: fallbackBinary ? './avatars/common/avatar_no_avatar.png' : null,
          dimensione: fallbackBinary ? Buffer.from(fallbackBinary, 'base64').length : 0
        });
      }
    }
    
    // Funzione validazione path sicuro
    function isValidImagePath(imagePath) {
      if (!imagePath || typeof imagePath !== 'string') return false;
      
      // Normalizza path
      const normalized = path.normalize(imagePath);
      
      // Controlla traversal
      if (normalized.includes('..')) return false;
      
      // Controlla estensione
      const ext = path.extname(normalized).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    }
    
    const successful = results.filter(r => r.successo).length;
    const failed = results.filter(r => !r.successo).length;
    
    logger.info(`Loaded ${successful} images successfully, ${failed} with fallback`);
    
    res.json({
      success: true,
      data: results,
      stats: {
        richieste: percorsi.length,
        successo: successful,
        fallback: failed,
        fallback_disponibile: fallbackBinary !== null
      }
    });
    
  } catch (error) {
    logger.error(`Error in binary images API: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load images',
      message: error.message 
    });
  }
});

// API generica per lettura file da percorso
router.get('/file/*', async (req, res) => {
  try {
    // Il percorso viene estratto da tutto quello che segue '/file/'
    const requestedPath = req.params[0];
    
    logger.info(`API call: GET /api/file/${requestedPath}`);
    
    if (!requestedPath) {
      return res.status(400).json({ 
        success: false, 
        error: 'File path is required' 
      });
    }
    
    // Validazione sicurezza percorso
    if (!isValidFilePath(requestedPath)) {
      logger.warn(`Rejected unsafe file path: ${requestedPath}`);
      return res.status(403).json({ 
        success: false, 
        error: 'File path not allowed for security reasons' 
      });
    }
    
    const fullPath = path.join(GAME_ROOT, requestedPath);
    
    // Verifica che il file esista
    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'File not found',
        path: requestedPath
      });
    }
    
    // Leggi il file
    const content = await fs.readFile(fullPath, 'utf8');
    const stats = await fs.stat(fullPath);
    
    logger.info(`Successfully read file: ${requestedPath} (${stats.size} bytes)`);
    
    res.json({
      success: true,
      data: {
        path: requestedPath,
        content: content,
        size: stats.size,
        modified: stats.mtime,
        encoding: 'utf8'
      }
    });
    
  } catch (error) {
    logger.error(`Error reading file: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read file',
      message: error.message 
    });
  }
});

module.exports = router;
