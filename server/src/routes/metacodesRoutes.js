const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Constants
const REGEX_CONSTANTS = {
  DEFAULT_TIMEOUT: 1000, // ms
  EXEC_TIMEOUT: 2000, // ms
  MAX_ITERATIONS: 1000,
  GENDER_ITERATIONS: 500,
  NUMBER_ITERATIONS: 500,
  IMAGE_ITERATIONS: 500,
  NAME_ITERATIONS: 1000,
  GENDER_TIMEOUT: 1000, // ms
  NUMBER_TIMEOUT: 1000, // ms
  IMAGE_TIMEOUT: 1000, // ms
  NAME_TIMEOUT: 500 // ms
};

const CACHE_CONSTANTS = {
  DURATION: 60 * 60 * 1000, // 1 hour in ms
  MAX_CONTENT_SIZE: 10 * 1024 * 1024 // 10MB
};

// Security: Path sanitization helper
const sanitizePath = (inputPath) => {
  // Input validation
  if (!inputPath || typeof inputPath !== 'string') {
    return '';
  }
  // Remove dangerous characters and patterns
  const sanitized = inputPath
    .replace(/[<>:"|?*\x00-\x1F]/g, '') // Remove invalid filename chars
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single
    .trim();
  
  // Normalize path and prevent directory traversal
  const normalized = path.normalize(sanitized);
  // Remove any attempts to go up directories and Windows absolute paths
  return normalized.replace(/^(\.\.[/\\])+|^[A-Za-z]:\\\\/g, '');
};

// Security: Validate file path is within allowed directory
const isPathSafe = (filePath, baseDir) => {
  try {
    // Input validation
    if (!filePath || !baseDir || typeof filePath !== 'string' || typeof baseDir !== 'string') {
      return false;
    }
    const resolvedPath = path.resolve(baseDir, filePath);
    const resolvedBase = path.resolve(baseDir);
    return resolvedPath.startsWith(resolvedBase);
  } catch (error) {
    // Path resolution failed, treat as unsafe
    return false;
  }
};

// Security: Sanitize content for safe processing
const sanitizeContent = (content) => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  // Limit content size to prevent memory issues (10MB)
  const MAX_CONTENT_SIZE = CACHE_CONSTANTS.MAX_CONTENT_SIZE;
  if (content.length > MAX_CONTENT_SIZE) {
    console.warn('Content exceeds maximum size, truncating');
    return content.substring(0, MAX_CONTENT_SIZE);
  }
  return content;
};

// Security: Safe regex execution with timeout
const safeRegexMatch = (string, pattern, timeout = REGEX_CONSTANTS.DEFAULT_TIMEOUT) => {
  if (!string || typeof string !== 'string') {
    return null;
  }
  
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Regex timeout'));
    }, timeout);
    
    try {
      const result = string.match(pattern);
      clearTimeout(timer);
      resolve(result);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
};

// Security: Safe regex exec with iteration limit
const safeRegexExec = (pattern, string, maxIterations = REGEX_CONSTANTS.MAX_ITERATIONS, timeout = REGEX_CONSTANTS.EXEC_TIMEOUT) => {
  if (!string || typeof string !== 'string') {
    return [];
  }
  
  const results = [];
  let iterations = 0;
  const startTime = Date.now();
  
  try {
    let match;
    // Reset pattern lastIndex for safety
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(string)) !== null) {
      results.push(match);
      iterations++;
      
      // Check iteration limit
      if (iterations >= maxIterations) {
        console.warn(`Regex execution stopped: max iterations (${maxIterations}) reached`);
        break;
      }
      
      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.warn(`Regex execution stopped: timeout (${timeout}ms) reached`);
        break;
      }
      
      // Prevent infinite loop on zero-length matches
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }
    }
  } catch (error) {
    console.error('Safe regex exec error:', error);
  }
  
  return results;
};

// Cache per i metacodici più usati (aggiornata periodicamente)
let metacodesCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = CACHE_CONSTANTS.DURATION; // 1 ora

/**
 * Analizza tutti i file di script per trovare i metacodici più usati
 * Restituisce i top 5 separati per ogni lingua (IT, EN, ES, FR, DE, etc.)
 * Restituisce solo dati reali, nessun default
 */
async function analyzeMetacodesUsage() {
  // Security: Use resolved absolute paths
  const baseGameFolder = path.resolve(__dirname, '../../GAMEFOLDER');
  const customScriptsPath = path.join(baseGameFolder, 'customScripts');
  const campaignPath = path.join(baseGameFolder, 'campaign');
  const localizationPath = path.join(baseGameFolder, 'localization_strings');
  
  // Validate paths exist and are safe
  try {
    await fs.access(baseGameFolder);
    if (!isPathSafe(customScriptsPath, baseGameFolder) || 
        !isPathSafe(campaignPath, baseGameFolder) || 
        !isPathSafe(localizationPath, baseGameFolder)) {
      throw new Error('Invalid path configuration detected');
    }
  } catch (error) {
    throw new Error('Base game folder not accessible or invalid paths');
  }
  
  // Conteggi separati per lingua
  const metacodesByLang = {};
  const supportedLangs = ['IT', 'EN', 'ES', 'FR', 'DE', 'CS', 'PL', 'RU', 'RO', 'JP'];
  
  // Inizializza conteggi per ogni lingua
  supportedLangs.forEach(lang => {
    metacodesByLang[lang] = {
      gender: {},
      number: {},
      image: {},
      name: { '[NAME]': 0 }
    };
  });

  try {
    // 1. Analizza file di customScripts (comuni a tutte le lingue)
    const scriptFiles = await fs.readdir(customScriptsPath).catch(() => []);
    for (const file of scriptFiles) {
      // Security: Sanitize and validate file name
      const sanitizedFile = sanitizePath(file);
      if ((sanitizedFile.endsWith('.txt') || sanitizedFile.endsWith('.yaml'))) {
        try {
          const filePath = path.join(customScriptsPath, sanitizedFile);
          // Security: Validate file path is within allowed directory
          if (!isPathSafe(filePath, baseGameFolder)) {
            console.warn(`Skipping unsafe file path: ${sanitizedFile}`);
            continue;
          }
          const rawContent = await fs.readFile(filePath, 'utf8');
          const content = sanitizeContent(rawContent);
          // Aggiungi i metacodici degli script a tutte le lingue
          supportedLangs.forEach(lang => {
            analyzeContent(content, metacodesByLang[lang]);
          });
        } catch (err) {
          console.error(`Error reading custom script file ${file}:`, err);
        }
      }
    }

    // 2. Analizza file nelle cartelle campaignScripts[LANG] per ogni lingua
    for (const lang of supportedLangs) {
      const langScriptsPath = path.join(campaignPath, `campaignScripts${lang}`);
      try {
        const langFiles = await fs.readdir(langScriptsPath).catch(() => []);
        for (const file of langFiles) {
          // Security: Sanitize and validate file name
          const sanitizedFile = sanitizePath(file);
          if (sanitizedFile.endsWith('.txt')) {
            try {
              const filePath = path.join(langScriptsPath, sanitizedFile);
              if (!isPathSafe(filePath, baseGameFolder)) {
                continue;
              }
              const rawContent = await fs.readFile(filePath, 'utf8');
              const content = sanitizeContent(rawContent);
              // Analizza contenuto specifico per questa lingua
              analyzeContent(content, metacodesByLang[lang]);
            } catch (err) {
              console.error(`Error reading ${lang} script file ${file}:`, err);
            }
          }
        }
      } catch (err) {
        // La cartella della lingua potrebbe non esistere ancora
        console.debug(`Language folder ${lang} not found or empty`);
      }
    }

    // 3. Analizza file di localizzazione per lingua
    const locFiles = await fs.readdir(localizationPath).catch(() => []);
    for (const file of locFiles) {
      // Security: Sanitize file name
      const sanitizedFile = sanitizePath(file);
      if (sanitizedFile.endsWith('.yaml')) {
        // Estrai il codice lingua dal nome del file (es: game_strings_EN.yaml -> EN)
        const sanitizedFileName = sanitizePath(file);
        let langMatch = null;
        try {
          // Safe regex match with timeout protection
          langMatch = sanitizedFileName.match(/_([A-Z]{2,3})\.yaml$/);
        } catch (error) {
          console.warn('Regex timeout in language extraction:', error);
          langMatch = null;
        }
        if (langMatch) {
          const lang = langMatch[1];
          if (metacodesByLang[lang]) {
            try {
              const filePath = path.join(localizationPath, sanitizedFile);
              if (!isPathSafe(filePath, baseGameFolder)) {
                continue;
              }
              const rawContent = await fs.readFile(filePath, 'utf8');
              const content = sanitizeContent(rawContent);
              analyzeContent(content, metacodesByLang[lang]);
            } catch (err) {
              console.error(`Error reading localization file ${file}:`, err);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error analyzing metacodes:', error);
  }

  // Formatta i risultati per ogni lingua
  const result = {};
  supportedLangs.forEach(lang => {
    result[lang] = formatTop5Metacodes(metacodesByLang[lang]);
  });

  return result;
}

/**
 * Analizza il contenuto per trovare metacodici
 */
function analyzeContent(content, metacodesCount) {
  // Input validation
  if (!content || typeof content !== 'string') {
    return;
  }
  
  try {
    // Pattern per genere [g(male|female|neutral)] - with safe execution
    const genderPattern = /\[g\(([^|)]*)\|([^|)]*)(?:\|([^)]*))?\)\]/g;
    const genderMatches = safeRegexExec(genderPattern, content, REGEX_CONSTANTS.GENDER_ITERATIONS, REGEX_CONSTANTS.GENDER_TIMEOUT);
    genderMatches.forEach(match => {
      const key = `[g(${match[1]}|${match[2]}${match[3] ? '|' + match[3] : ''})]`;
      metacodesCount.gender[key] = (metacodesCount.gender[key] || 0) + 1;
    });

    // Pattern per numero con quantificatori multipli [n(2:prove|6:test|10:altro)] - with safe execution
    const numberPattern = /\[n\((?:\d+:[^|)]+(?:\||\)))+\]/g;
    const numberMatches = safeRegexExec(numberPattern, content, REGEX_CONSTANTS.NUMBER_ITERATIONS, REGEX_CONSTANTS.NUMBER_TIMEOUT);
    numberMatches.forEach(match => {
      const key = match[0];
      metacodesCount.number[key] = (metacodesCount.number[key] || 0) + 1;
    });

    // Pattern per immagini [img(path)*count] - with safe execution
    const imagePattern = /\[img\(([^)]+)\)\*(\d+)\]/g;
    const imageMatches = safeRegexExec(imagePattern, content, REGEX_CONSTANTS.IMAGE_ITERATIONS, REGEX_CONSTANTS.IMAGE_TIMEOUT);
    imageMatches.forEach(match => {
      const key = `[img(${match[1]})*${match[2]}]`;
      metacodesCount.image[key] = (metacodesCount.image[key] || 0) + 1;
    });

    // Pattern per nome - solo [NAME] - with safe execution and length limit
    const namePattern = /\[NAME\]/g;
    const nameMatches = safeRegexExec(namePattern, content, REGEX_CONSTANTS.NAME_ITERATIONS, REGEX_CONSTANTS.NAME_TIMEOUT);
    metacodesCount.name['[NAME]'] += nameMatches.length;
  } catch (error) {
    console.error('Error in analyzeContent regex processing:', error);
  }
}

/**
 * Escape caratteri speciali per regex
 */
function escapeRegex(string) {
  // Input validation
  if (!string || typeof string !== 'string') {
    return '';
  }
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Formatta i top 5 metacodici per ogni categoria
 * Restituisce solo dati reali, nessun default
 */
function formatTop5Metacodes(metacodesCount) {
  const result = {
    gender: [],
    number: [],
    image: [],
    name: []
  };

  // Ordina e prendi top 5 per genere
  const genderSorted = Object.entries(metacodesCount.gender)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  result.gender = genderSorted.map(([code, usage]) => {
    let match = null;
    try {
      match = code.match(/\[g\(([^|]*)\|([^|]*)(?:\|([^)]*))?\)\]/);
    } catch (error) {
      console.warn('Regex timeout in gender formatting:', error);
    }
    const label = match ? `${match[1] || '∅'}/${match[2] || '∅'}${match[3] ? '/' + match[3] : ''}` : code;
    return { code, label, usage };
  });

  // Ordina e prendi top 5 per numero
  const numberSorted = Object.entries(metacodesCount.number)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  result.number = numberSorted.map(([code, usage]) => {
    // Estrai una label semplificata dal pattern numerico
    let parts = [];
    try {
      parts = code.match(/\d+:[^|)]+/g) || [];
    } catch (error) {
      console.warn('Regex timeout in number formatting:', error);
    }
    const label = parts.slice(0, 2).join('/');
    return { code, label, usage };
  });

  // Ordina e prendi top 5 per immagini
  const imageSorted = Object.entries(metacodesCount.image)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  result.image = imageSorted.map(([code, usage]) => {
    let match = null;
    try {
      match = code.match(/\[img\(([^)]+)\)\*(\d+)\]/);
    } catch (error) {
      console.warn('Regex timeout in image formatting:', error);
    }
    const path = match ? match[1] : 'unknown';
    const label = path.split('/').pop()?.split('.')[0] || 'img';
    return { code, label, usage };
  });

  // Nome - solo [NAME] se usato
  if (metacodesCount.name['[NAME]'] > 0) {
    result.name = [{
      code: '[NAME]',
      label: 'Nome giocatore',
      usage: metacodesCount.name['[NAME]']
    }];
  }

  // Nessun default - solo dati reali

  return result;
}

// Funzioni di default rimosse - solo dati reali

/**
 * POST /api/metacodes/refresh
 * Forza il refresh della cache dei metacodici
 */
router.post('/refresh', async (req, res) => {
  try {
    // Forza la rigenerazione della cache
    metacodesCache = await analyzeMetacodesUsage();
    cacheTimestamp = Date.now();
    
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      timestamp: new Date(cacheTimestamp).toISOString()
    });
  } catch (error) {
    console.error('Error refreshing metacodes cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache',
      message: error.message
    });
  }
});

/**
 * GET /api/metacodes/top5/:lang?
 * Ritorna i top 5 metacodici più usati per ogni categoria per una lingua specifica
 * Se non specificata la lingua, ritorna tutte le lingue
 * Solo dati reali, nessun default
 */
router.get('/top5/:lang?', async (req, res) => {
  try {
    // Sanitize input parameters
    const langInput = req.params.lang;
    const requestedLang = langInput ? 
      langInput.replace(/[^A-Z]/gi, '').substring(0, 3).toUpperCase() : 
      undefined;
    const forceRefresh = req.query.refresh === 'true';
    
    // Controlla se la cache è valida o se è richiesto un refresh forzato
    const now = Date.now();
    if (!metacodesCache || (now - cacheTimestamp) > CACHE_DURATION || forceRefresh) {
      // Rigenera la cache per tutte le lingue
      metacodesCache = await analyzeMetacodesUsage();
      cacheTimestamp = now;
    }

    // Se richiesta una lingua specifica
    if (requestedLang && metacodesCache[requestedLang]) {
      res.json({
        success: true,
        data: metacodesCache[requestedLang],
        language: requestedLang,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    } else if (requestedLang) {
      // Lingua non supportata o senza dati
      res.json({
        success: true,
        data: {
          gender: [],
          number: [],
          image: [],
          name: []
        },
        language: requestedLang,
        message: 'Language not supported or no data available'
      });
    } else {
      // Ritorna tutti i dati per tutte le lingue
      res.json({
        success: true,
        data: metacodesCache,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    }
  } catch (error) {
    console.error('Error getting top5 metacodes:', error);
    
    // In caso di errore, ritorna liste vuote - nessun default
    res.json({
      success: false,
      error: error.message,
      data: {
        gender: [],
        number: [],
        image: [],
        name: []
      }
    });
  }
});

module.exports = router;