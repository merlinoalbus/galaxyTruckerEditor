const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Cache per i metacodici più usati (aggiornata periodicamente)
let metacodesCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 ora

/**
 * Analizza tutti i file di script per trovare i metacodici più usati
 * Restituisce i top 5 separati per ogni lingua (IT, EN, ES, FR, DE, etc.)
 * Restituisce solo dati reali, nessun default
 */
async function analyzeMetacodesUsage() {
  const customScriptsPath = path.join(__dirname, '../../GAMEFOLDER/customScripts');
  const campaignPath = path.join(__dirname, '../../GAMEFOLDER/campaign');
  const localizationPath = path.join(__dirname, '../../GAMEFOLDER/localization_strings');
  
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
      if (file.endsWith('.txt') || file.endsWith('.yaml')) {
        try {
          const content = await fs.readFile(path.join(customScriptsPath, file), 'utf8');
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
          if (file.endsWith('.txt')) {
            try {
              const content = await fs.readFile(path.join(langScriptsPath, file), 'utf8');
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
      if (file.endsWith('.yaml')) {
        // Estrai il codice lingua dal nome del file (es: game_strings_EN.yaml -> EN)
        const langMatch = file.match(/_([A-Z]{2,3})\.yaml$/);
        if (langMatch) {
          const lang = langMatch[1];
          if (metacodesByLang[lang]) {
            try {
              const content = await fs.readFile(path.join(localizationPath, file), 'utf8');
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
  // Pattern per genere [g(male|female|neutral)]
  const genderPattern = /\[g\(([^|)]*)\|([^|)]*)(?:\|([^)]*))?\)\]/g;
  let match;
  while ((match = genderPattern.exec(content)) !== null) {
    const key = `[g(${match[1]}|${match[2]}${match[3] ? '|' + match[3] : ''})]`;
    metacodesCount.gender[key] = (metacodesCount.gender[key] || 0) + 1;
  }

  // Pattern per numero con quantificatori multipli [n(2:prove|6:test|10:altro)]
  const numberPattern = /\[n\((?:\d+:[^|)]+(?:\||\)))+\]/g;
  while ((match = numberPattern.exec(content)) !== null) {
    const key = match[0];
    metacodesCount.number[key] = (metacodesCount.number[key] || 0) + 1;
  }

  // Pattern per immagini [img(path)*count]
  const imagePattern = /\[img\(([^)]+)\)\*(\d+)\]/g;
  while ((match = imagePattern.exec(content)) !== null) {
    const key = `[img(${match[1]})*${match[2]}]`;
    metacodesCount.image[key] = (metacodesCount.image[key] || 0) + 1;
  }

  // Pattern per nome - solo [NAME]
  const nameCount = (content.match(/\[NAME\]/g) || []).length;
  metacodesCount.name['[NAME]'] += nameCount;
}

/**
 * Escape caratteri speciali per regex
 */
function escapeRegex(string) {
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
    const match = code.match(/\[g\(([^|]*)\|([^|]*)(?:\|([^)]*))?\)\]/);
    const label = match ? `${match[1] || '∅'}/${match[2] || '∅'}${match[3] ? '/' + match[3] : ''}` : code;
    return { code, label, usage };
  });

  // Ordina e prendi top 5 per numero
  const numberSorted = Object.entries(metacodesCount.number)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  result.number = numberSorted.map(([code, usage]) => {
    // Estrai una label semplificata dal pattern numerico
    const parts = code.match(/\d+:[^|)]+/g) || [];
    const label = parts.slice(0, 2).join('/');
    return { code, label, usage };
  });

  // Ordina e prendi top 5 per immagini
  const imageSorted = Object.entries(metacodesCount.image)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  result.image = imageSorted.map(([code, usage]) => {
    const match = code.match(/\[img\(([^)]+)\)\*(\d+)\]/);
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
    const requestedLang = req.params.lang?.toUpperCase();
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

/**
 * POST /api/metacodes/refresh
 * Forza il refresh della cache dei metacodici
 */
router.post('/refresh', async (req, res) => {
  try {
    metacodesCache = await analyzeMetacodesUsage();
    cacheTimestamp = Date.now();
    
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      data: metacodesCache
    });
  } catch (error) {
    console.error('Error refreshing metacodes cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;