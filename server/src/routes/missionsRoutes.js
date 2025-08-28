// missionsRoutes.js - Routes per gestione missions
const express = require('express');
const { parseScriptContent } = require('../parsers/scriptParser');
const { parseScriptToBlocks, convertBlocksToScript, serializeElement } = require('../parsers/blockParser');
const { getLogger } = require('../utils/logger');
const config = require('../config/config');
const { GAME_ROOT, SUPPORTED_LANGUAGES } = config;
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { findAllRelatedScripts } = require('../utils/scriptAnalyzer');
const { initializeLanguage, isLanguageInitialized, getAvailableLanguages } = require('../utils/languageInitializer');

const router = express.Router();
const logger = getLogger();

// API per ottenere lista file YAML dalla cartella parts
router.get('/parts', async (req, res) => {
  try {
    logger.info('API call: GET /api/missions/parts - Lista file YAML dalla cartella parts');
    
    const partsPath = path.join(GAME_ROOT, 'parts');
    const partFiles = [];
    
    if (await fs.pathExists(partsPath)) {
      try {
        const files = await fs.readdir(partsPath);
        const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
        
        for (const fileName of yamlFiles) {
          const fileNameWithoutExt = fileName.replace(/\.(yaml|yml)$/, '');
          const fullPath = `parts/${fileName}`;
          
          partFiles.push({
            id: fullPath,
            descrizione: fileNameWithoutExt,
            valore: fullPath
          });
        }
      } catch (error) {
        logger.warn(`Error scanning parts directory: ${error.message}`);
      }
    } else {
      logger.warn('Parts directory not found');
    }
    
    // Ordina per descrizione
    partFiles.sort((a, b) => a.descrizione.localeCompare(b.descrizione));
    
    logger.info(`Found ${partFiles.length} part files`);
    
    res.json({
      success: true,
      data: partFiles,
      count: partFiles.length
    });
  } catch (error) {
    logger.error(`Error retrieving parts: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve parts',
      message: error.message 
    });
  }
});

// API 8: Lista archi mappa da missions.yaml secondo specifica
router.get('/routes', async (req, res) => {
  try {
    logger.info('API call: GET /api/missions/routes - Caricamento archi con tutti gli attributi + analisi utilizzo script');
    
    const routes = [];
    
    // Carica missions.yaml multilingua
    const languages = SUPPORTED_LANGUAGES;
    const routesMap = {};
    
    for (const lang of languages) {
      const missionsPath = config.PATH_TEMPLATES.missionsYaml(lang);
      
      if (await fs.pathExists(missionsPath)) {
        try {
          const content = await fs.readFile(missionsPath, 'utf8');
          const missionsData = yaml.load(content);
          
          if (Array.isArray(missionsData)) {
            for (const routeData of missionsData) {
              if (!routeData.name) continue;
              
              const routeName = routeData.name;
              
              if (!routesMap[routeName]) {
                routesMap[routeName] = {
                  name: routeName,
                  source: routeData.source || '',
                  destination: routeData.destination || '',
                  missiontype: routeData.missiontype || 'NORMAL',
                  license: routeData.license || 'STI',
                  button: routeData.button || [],
                  localizedCaptions: {},
                  localizedDescriptions: {}
                };
              }
              
              // Aggiungi dati localizzati
              if (routeData.caption) {
                routesMap[routeName].localizedCaptions[lang] = routeData.caption;
              }
              if (routeData.description) {
                routesMap[routeName].localizedDescriptions[lang] = routeData.description;
              }
            }
          }
        } catch (error) {
          logger.warn(`Error loading missions.yaml for ${lang}: ${error.message}`);
        }
      }
    }
    
    // Scansiona script per raccogliere utilizzi archi
    const routeUsage = new Map();
    await scanCampaignFilesForRoutes(routeUsage);
    
    // Carica tutti gli script per analisi ricorsiva
    let allScripts = [];
    try {
      const http = require('http');
      const scriptsData = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${config.SERVER_PORT}/api/scripts`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });
      allScripts = scriptsData.data || [];
    } catch (error) {
      logger.warn('Could not load scripts for recursive analysis:', error.message);
    }
    
    // Processa ogni arco
    for (const [routeName, routeData] of Object.entries(routesMap)) {
      const usage = routeUsage.get(routeName) || {
        utilizzi_totali: 0,
        script_che_lo_usano: [],
        comandi_utilizzati: []
      };
      
      // Trova tutti gli script collegati ricorsivamente alla rotta
      const routeIdentifier = `${routeData.source}-${routeData.destination}`;
      const allRelatedScripts = findAllRelatedScripts(routeIdentifier, allScripts, 'route');
      
      // Parsa button in formato strutturato
      const parsedButton = parseRouteButton(routeData.button);
      
      routes.push({
        name: routeName,
        source: routeData.source,
        destination: routeData.destination,
        missiontype: routeData.missiontype,
        license: routeData.license,
        button: parsedButton,
        localizedCaptions: routeData.localizedCaptions,
        localizedDescriptions: routeData.localizedDescriptions,
        utilizzi_totali: usage.utilizzi_totali,
        script_che_lo_usano: Array.from(usage.script_che_lo_usano),
        comandi_utilizzati: Array.from(usage.comandi_utilizzati),
        script_collegati_ricorsivamente: allRelatedScripts
      });
    }
    
    // Ordina per nome
    routes.sort((a, b) => a.name.localeCompare(b.name));
    
    logger.info(`Found ${routes.length} routes (${routes.filter(r => r.utilizzi_totali > 0).length} used in scripts)`);
    
    res.json({
      success: true,
      data: routes,
      count: routes.length
    });
  } catch (error) {
    logger.error(`Error retrieving routes: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve routes',
      message: error.message 
    });
  }
});

// Funzione per scansionare file campaign per utilizzi archi/rotte
async function scanCampaignFilesForRoutes(routeUsage) {
  const campaignPath = path.join(GAME_ROOT, 'campaign');
  
  if (!await fs.pathExists(campaignPath)) {
    logger.warn('Campaign directory not found');
    return;
  }
  
  // Scansione ricorsiva
  async function scanDirectory(dirPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
        
        if (entry.isFile() && entry.name.endsWith('.txt')) {
          await parseFileForRoutes(fullPath, relPath, routeUsage);
        } else if (entry.isDirectory()) {
          await scanDirectory(fullPath, relPath);
        }
      }
    } catch (error) {
      logger.warn(`Cannot scan directory ${dirPath}: ${error.message}`);
    }
  }
  
  await scanDirectory(campaignPath);
}

// Parse file per estrarre utilizzi archi/rotte
async function parseFileForRoutes(filePath, fileName, routeUsage) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    let currentScript = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Traccia script corrente
      if (line.startsWith('SCRIPT ')) {
        currentScript = line.replace('SCRIPT ', '').trim();
      } else if (line.startsWith('MISSION ')) {
        currentScript = line.replace('MISSION ', '').trim();
      } else if (line === 'END_OF_SCRIPT' || line === 'END_OF_MISSION') {
        currentScript = null;
      }
      
      if (!currentScript) continue;
      
      // Estrai utilizzi archi/rotte
      const upperLine = line.toUpperCase().trim();
      let rotta = null;
      let comando = null;
      
      // SHOWPATH <rotta>
      if (upperLine.startsWith('SHOWPATH ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          rotta = parts[1];
          comando = 'SHOWPATH';
        }
      }
      // HIDEPATH <rotta>
      else if (upperLine.startsWith('HIDEPATH ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          rotta = parts[1];
          comando = 'HIDEPATH';
        }
      }
      // CENTERMAPBYPATH <rotta>
      else if (upperLine.startsWith('CENTERMAPBYPATH ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          rotta = parts[1];
          comando = 'CENTERMAPBYPATH';
        }
      }
      // HIDEALLPATHS <nodo1> <nodo2> - anche se ha nodi come parametri, gestisce le rotte
      else if (upperLine.startsWith('HIDEALLPATHS ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 3) {
          // Per HIDEALLPATHS consideriamo la combinazione nodo1-nodo2 come identificativo
          rotta = `${parts[1]}-${parts[2]}`;
          comando = 'HIDEALLPATHS';
        }
      }
      
      if (rotta && comando) {
        if (!routeUsage.has(rotta)) {
          routeUsage.set(rotta, {
            utilizzi_totali: 0,
            script_che_lo_usano: new Set(),
            comandi_utilizzati: new Set()
          });
        }
        
        const usage = routeUsage.get(rotta);
        usage.utilizzi_totali++;
        usage.script_che_lo_usano.add(currentScript);
        usage.comandi_utilizzati.add(comando);
      }
    }
  } catch (error) {
    logger.warn(`Cannot parse file ${filePath}: ${error.message}`);
  }
}

// Parsa button dell'arco in formato strutturato
function parseRouteButton(buttonArray) {
  if (!Array.isArray(buttonArray) || buttonArray.length < 3) {
    return null;
  }
  
  const [buttonId, scriptName, missionName] = buttonArray;
  
  // Per ora manteniamo solo l'inglese, ma struttura pronta per multilingua
  const localizedLabels = {
    'EN': 'Launch Mission' // Label generico per button di missioni
  };
  
  return {
    id: buttonId,
    script: scriptName,
    mission: missionName,
    localizedLabels: localizedLabels
  };
}

// API 12: Lista missions secondo specifica con analisi collegamenti completa
router.get('/', async (req, res) => {
  try {
    logger.info('API call: GET /api/missions - Lista missions con stellato e collegamenti completi');
    
    const missions = [];
    const languages = SUPPORTED_LANGUAGES;
    const allMissionsData = new Map();
    
    // 1. Scansiona tutti i file mission multilingua da campaign
    for (const lang of languages) {
      const missionsPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`);
      
      if (await fs.pathExists(missionsPath)) {
        try {
          const files = await fs.readdir(missionsPath);
          const txtFiles = files.filter(f => f.endsWith('.txt'));
          
          for (const fileName of txtFiles) {
            const filePath = path.join(missionsPath, fileName);
            await parseMissionFileForAPI12(filePath, fileName, lang, allMissionsData);
          }
        } catch (error) {
          logger.warn(`Error scanning missions for ${lang}: ${error.message}`);
        }
      }
    }
    
    // 1b. Scansiona anche customScripts per missions custom
    const customScriptsPath = path.join(GAME_ROOT, 'customScripts');
    
    // Prima scansiona missions multilingua in sottocartelle
    for (const lang of languages) {
      const langPath = path.join(customScriptsPath, lang);
      if (await fs.pathExists(langPath)) {
        try {
          const files = await fs.readdir(langPath);
          const txtFiles = files.filter(f => f.endsWith('.txt'));
          
          for (const fileName of txtFiles) {
            const filePath = path.join(langPath, fileName);
            await parseMissionFileForAPI12(filePath, fileName, lang, allMissionsData, true);
          }
        } catch (error) {
          logger.warn(`Error scanning custom missions for ${lang}: ${error.message}`);
        }
      }
    }
    
    // Poi scansiona missions dirette in customScripts root
    if (await fs.pathExists(customScriptsPath)) {
      try {
        const files = await fs.readdir(customScriptsPath);
        const txtFiles = files.filter(f => f.endsWith('.txt') && f !== 'README.txt');
        
        for (const fileName of txtFiles) {
          const filePath = path.join(customScriptsPath, fileName);
          // Verifica che non sia una directory
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            await parseMissionFileForAPI12(filePath, fileName, 'EN', allMissionsData, true);
          }
        }
      } catch (error) {
        logger.warn(`Error scanning custom missions root: ${error.message}`);
      }
    }
    
    // 2. Costruisce grafo collegamenti bidirezionale
    const missionConnections = buildMissionConnectionGraph(allMissionsData);
    
    // 3. Determina missions stellate dai bottoni (missions.yaml)
    const { stellatedMissions, routeButtons } = await getStellatedMissionsAndButtons();
    
    // 4. Costruisce risultato finale per ogni mission
    for (const [missionName, missionData] of allMissionsData.entries()) {
      const connections = missionConnections.get(missionName) || {
        script_richiamati: [],
        missions_richiamate: [],
        richiamato_da_script: [],
        richiamato_da_missions: []
      };
      
      // Trova bottoni collegati
      const bottoni_collegati = routeButtons
        .filter(b => b.mission === missionName)
        .map(b => ({
          buttonId: b.id,
          sourceId: b.sourceId,
          tipo: b.tipo
        }));
      
      // Determina filename dal primo linguaggio disponibile
      const firstLang = missionData.languages[0];
      const nomefile = missionData.fileNames[firstLang] || 'unknown.txt';
      
      // Prende conteggi dalla lingua EN se disponibile, altrimenti prima disponibile
      const refLang = missionData.languages.includes('EN') ? 'EN' : missionData.languages[0];
      const numero_comandi = missionData.commandCounts[refLang] || 0;
      const numero_blocchi = Math.ceil(numero_comandi / 3); // Stima approssimativa
      
      missions.push({
        nomemission: missionName,
        nomefile: nomefile,
        numero_blocchi: numero_blocchi,
        numero_comandi: numero_comandi,
        stellato: stellatedMissions.has(missionName),
        languages: missionData.languages,
        bottoni_collegati: bottoni_collegati,
        script_richiamati: connections.script_richiamati,
        missions_richiamate: connections.missions_richiamate,
        richiamato_da_script: connections.richiamato_da_script,
        richiamato_da_missions: connections.richiamato_da_missions,
        comandi_richiamo: Array.from(missionData.comandiRichiamo || []),
        utilizzi_totali: (connections.richiamato_da_script.length + connections.richiamato_da_missions.length + bottoni_collegati.length),
        variabili_utilizzate: Array.from(missionData.variabili || []),
        personaggi_utilizzati: Array.from(missionData.personaggi || []),
        labels_definite: Array.from(missionData.labels || []),
        nodi_referenziati: Array.from(missionData.nodi || []),
        isCustom: missionData.isCustom || false,
        customPath: missionData.customPath || null
      });
    }
    
    // Ordina per nome
    missions.sort((a, b) => a.nomemission.localeCompare(b.nomemission));
    
    logger.info(`Found ${missions.length} missions (${missions.filter(m => m.stellato).length} stellated)`);
    
    res.json({
      success: true,
      data: missions,
      count: missions.length
    });
  } catch (error) {
    logger.error(`Error retrieving missions: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve missions',
      message: error.message 
    });
  }
});

// API 13: Mission specifica con parsing completo a blocchi
router.get('/:missionName', async (req, res) => {
  try {
    const { missionName } = req.params;
    const { lang = 'EN', format = 'blocks', multilingua = 'false' } = req.query;
    
    logger.info(`API call: GET /api/missions/${missionName}?lang=${lang}&format=${format}&multilingua=${multilingua}`);
    
    if (multilingua === 'true') {
      // GESTIONE MULTILINGUA COMPLETA
      const result = await parseMissionMultilingual(missionName, format);
      
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: 'Mission not found',
          missionName 
        });
      }
      
      res.json({
        success: true,
        data: result
      });
    } else {
      // GESTIONE SINGOLA LINGUA
      const result = await parseMissionSingleLanguage(missionName, lang, format);
      
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: 'Mission not found',
          missionName 
        });
      }
      
      res.json({
        success: true,
        data: result
      });
    }
    
  } catch (error) {
    logger.error(`Error retrieving mission ${req.params.missionName}: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve mission',
      message: error.message 
    });
  }
});

// API per salvare mission (nuovo endpoint /api/missions/saveMission)
router.post('/saveMission', async (req, res) => {
  try {
    // Il body dovrebbe contenere un array con un singolo oggetto mission
    const missions = req.body;
    
    if (!Array.isArray(missions) || missions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Request must contain an array of missions' 
      });
    }
    
    const mission = missions[0];
    const { name, fileName, blocksMission, blocksFinish, availableLanguages, multilingualMerged, isCustom, customPath, isMultilingual: isMultilingualFlag } = mission;
    const requestedLang = req.query.lang;
    
    // Determina se salvare multilingua o singola lingua
    const isMultilingual = isMultilingualFlag || multilingualMerged === true || availableLanguages?.length > 1;
    const languages = isMultilingual && !requestedLang ? (availableLanguages || SUPPORTED_LANGUAGES) : [requestedLang || 'EN'];
    
    logger.info(`API call: POST /api/missions/saveMission - ${name} (${fileName}) - ${isMultilingual ? 'multilingual' : 'single language'}`);
    
    if (!name || !fileName) {
      return res.status(400).json({ 
        success: false, 
        error: 'name and fileName are required' 
      });
    }
    
    // Verifica e inizializza lingue non esistenti
    for (const language of languages) {
      if (!await isLanguageInitialized(language, GAME_ROOT)) {
        logger.info(`Detected new language ${language}, initializing for mission save...`);
        try {
          await initializeLanguage(language, GAME_ROOT);
          logger.info(`Successfully initialized new language: ${language}`);
        } catch (initError) {
          logger.error(`Failed to initialize language ${language}: ${initError.message}`);
          return res.status(500).json({ 
            success: false, 
            error: `Failed to initialize language ${language}: ${initError.message}`
          });
        }
      }
    }
    
    // Salva in tutte le lingue necessarie
    const savedLanguages = [];
    let errors = [];
    
    for (const lang of languages) {
      try {
        // Converti blocksMission e blocksFinish nel formato del parser
        // Serializza con la lingua specifica
        const missionBlock = {
          type: 'MISSION',
          name: name,
          children: blocksMission || [],
          finishSection: blocksFinish || []
        };
        
        // Serializza solo la mission per la lingua corrente
        // Se è multilingua, serializza per la lingua specifica per estrarre i testi corretti
        const missionContent = serializeElement(missionBlock, lang);
        
        // Percorso del file da salvare - gestisci custom missions
        let missionPath;
        if (isCustom) {
          if (isMultilingual) {
            // Custom multilingua - salva in customScripts/[LANG]/
            missionPath = path.join(GAME_ROOT, 'customScripts', lang, fileName);
          } else {
            // Custom non multilingua - salva in customScripts/
            missionPath = path.join(GAME_ROOT, 'customScripts', fileName);
          }
        } else {
          // Mission standard campaign
          missionPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`, fileName);
        }
        
        // Assicurati che la directory esista
        await fs.ensureDir(path.dirname(missionPath));
        
        // Leggi il contenuto esistente del file
        let fileContent = '';
        let hasScriptsWrapper = false;
        
        if (await fs.pathExists(missionPath)) {
          fileContent = await fs.readFile(missionPath, 'utf8');
          hasScriptsWrapper = fileContent.includes('SCRIPTS') && fileContent.includes('END_OF_SCRIPTS');
        }
        
        // Rimuovi la versione esistente della mission se presente
        const missionStartPattern = new RegExp(`MISSION\\s+${name}(?:\\s|$)`);
        const missionEndPattern = /END_OF_MISSION/;
        
        if (fileContent) {
          const lines = fileContent.split('\n');
          let newLines = [];
          let inTargetMission = false;
          let skipUntilEnd = false;
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            if (trimmedLine.match(missionStartPattern)) {
              // Trovata la mission da sostituire, salta fino a END_OF_MISSION
              inTargetMission = true;
              skipUntilEnd = true;
              continue;
            }
            
            if (skipUntilEnd) {
              if (trimmedLine === 'END_OF_MISSION') {
                skipUntilEnd = false;
                inTargetMission = false;
              }
              continue;
            }
            
            // Mantieni tutte le altre righe
            newLines.push(line);
          }
          
          fileContent = newLines.join('\n');
        }
        
        // Se il file non ha SCRIPTS wrapper, aggiungilo
        if (!hasScriptsWrapper && fileContent) {
          fileContent = 'SCRIPTS\n\n' + fileContent + '\nEND_OF_SCRIPTS';
          hasScriptsWrapper = true;
        }
        
        // Inserisci la nuova mission prima di END_OF_SCRIPTS
        if (hasScriptsWrapper) {
          // Trova END_OF_SCRIPTS e inserisci prima
          const endScriptsIndex = fileContent.lastIndexOf('END_OF_SCRIPTS');
          if (endScriptsIndex !== -1) {
            const beforeEnd = fileContent.substring(0, endScriptsIndex).trimEnd();
            const afterEnd = fileContent.substring(endScriptsIndex);
            
            fileContent = beforeEnd + '\n\n' + missionContent + '\n\n' + afterEnd;
          } else {
            // Non dovrebbe succedere, ma per sicurezza
            fileContent += '\n\n' + missionContent + '\n\nEND_OF_SCRIPTS';
          }
        } else {
          // File nuovo, crea con wrapper
          fileContent = 'SCRIPTS\n\n' + missionContent + '\n\nEND_OF_SCRIPTS';
        }
        
        // Pulisci righe vuote multiple
        fileContent = fileContent.replace(/\n{3,}/g, '\n\n');
        
        // Salva il file aggiornato
        await fs.writeFile(missionPath, fileContent, 'utf8');
        
        savedLanguages.push(lang);
        logger.info(`Successfully saved mission ${name} to ${fileName} in language ${lang}`);
        
      } catch (langError) {
        logger.error(`Error saving mission ${name} in language ${lang}: ${langError.message}`);
        errors.push({ language: lang, error: langError.message });
      }
    }
    
    if (savedLanguages.length === 0) {
      throw new Error('Failed to save mission in any language');
    }
    
    res.json({
      success: true,
      data: {
        name,
        fileName,
        languages: savedLanguages,
        savedAt: new Date().toISOString(),
        blocksMissionCount: blocksMission ? blocksMission.length : 0,
        blocksFinishCount: blocksFinish ? blocksFinish.length : 0,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error) {
    logger.error(`Error saving mission: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save mission',
      message: error.message 
    });
  }
});

// API 15: Salvataggio mission da JSON (vecchio endpoint mantenuto per compatibilità)
router.post('/:missionName/save', async (req, res) => {
  try {
    const { missionName } = req.params;
    const { lang = 'EN', blocks, format = 'mission' } = req.body;
    
    logger.info(`API call: POST /api/missions/${missionName}/save?lang=${lang}&format=${format}`);
    
    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({ 
        success: false, 
        error: 'blocks array is required' 
      });
    }
    
    try {
      // SERIALIZZAZIONE COMPLETA con parser bidirezionale mission-specific
      const missionContent = convertBlocksToScript(blocks);
      
      // Prepara il contenuto finale con header MISSION
      const fullMissionContent = `MISSION ${missionName}\n${missionContent}\nEND_OF_MISSION\n`;
      
      // Percorso del file da salvare
      const missionPath = path.join(GAME_ROOT, `missions_${lang}.txt`);
      
      // Leggi il contenuto esistente per aggiornare solo la mission specifica
      let existingContent = '';
      if (await fs.pathExists(missionPath)) {
        existingContent = await fs.readFile(missionPath, 'utf8');
      }
      
      // Rimuovi la versione esistente della mission se presente
      const missionStartPattern = new RegExp(`MISSION\\s+${missionName}\\s*\\n`, 'i');
      const missionEndPattern = /END_OF_MISSION\\s*\\n?/i;
      
      let updatedContent = existingContent;
      const startMatch = updatedContent.match(missionStartPattern);
      
      if (startMatch) {
        const startIndex = startMatch.index;
        const afterStart = updatedContent.substring(startIndex + startMatch[0].length);
        const endMatch = afterStart.match(missionEndPattern);
        
        if (endMatch) {
          const endIndex = startIndex + startMatch[0].length + endMatch.index + endMatch[0].length;
          updatedContent = updatedContent.substring(0, startIndex) + updatedContent.substring(endIndex);
        }
      }
      
      // Aggiungi la nuova mission alla fine
      if (updatedContent && !updatedContent.endsWith('\n')) {
        updatedContent += '\n';
      }
      updatedContent += fullMissionContent;
      
      // Salva il file aggiornato
      await fs.writeFile(missionPath, updatedContent, 'utf8');
      
      logger.info(`Successfully saved mission: ${missionName} in ${lang}`);
      
      // VALIDAZIONE POST-SAVE (parsing di verifica mission)
      const validationResult = await validateSavedMission(missionName, lang, blocks);
      
      res.json({
        success: true,
        data: {
          missionName,
          language: lang,
          blockCount: blocks.length,
          generatedLines: missionContent.split('\n').length,
          savedAt: new Date().toISOString(),
          filePath: `missions_${lang}.txt`,
          validation: validationResult
        }
      });
      
    } catch (conversionError) {
      logger.error(`Error converting blocks to mission: ${conversionError.message}`);
      res.status(400).json({
        success: false,
        error: 'Failed to convert blocks to mission',
        message: conversionError.message
      });
    }
    
  } catch (error) {
    logger.error(`Error saving mission ${req.params.missionName}: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save mission',
      message: error.message 
    });
  }
});

// Parse file mission per API 12
async function parseMissionFileForAPI12(filePath, fileName, language, allMissionsData, isCustom = false) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    let currentMission = null;
    let commandCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Traccia mission corrente
      if (line.startsWith('MISSION ')) {
        currentMission = line.replace('MISSION ', '').trim();
        commandCount = 0;
        
        if (!allMissionsData.has(currentMission)) {
          allMissionsData.set(currentMission, {
            name: currentMission,  // AGGIUNTO: campo name mancante
            languages: [],
            fileNames: {},
            commandCounts: {},
            comandiRichiamo: new Set(),
            scriptRichiamati: new Set(),
            missionsRichiamate: new Set(),
            variabili: new Set(),
            personaggi: new Set(),
            labels: new Set(),
            nodi: new Set(),
            isCustom: isCustom,
            customPath: isCustom ? filePath : null
          });
        }
        
        const missionData = allMissionsData.get(currentMission);
        if (!missionData.languages.includes(language)) {
          missionData.languages.push(language);
        }
        
        // Assicurati che EN sia sempre incluso se esiste in qualsiasi lingua
        if (language === 'EN' && !missionData.languages.includes('EN')) {
          missionData.languages.push('EN');
        }
        missionData.fileNames[language] = fileName;
        
      } else if (line === 'END_OF_MISSION') {
        if (currentMission) {
          const missionData = allMissionsData.get(currentMission);
          missionData.commandCounts[language] = commandCount;
          currentMission = null;
        }
      } else if (currentMission && line.length > 0 && !line.startsWith('//')) {
        commandCount++;
        
        const missionData = allMissionsData.get(currentMission);
        const upperLine = line.toUpperCase().trim();
        
        // Analizza comandi per estrarre collegamenti e elementi
        analyzeMissionCommand(line, upperLine, missionData);
      }
    }
  } catch (error) {
    logger.warn(`Cannot parse mission file ${filePath}: ${error.message}`);
  }
}

// Analizza comando mission per estrarre collegamenti
function analyzeMissionCommand(line, upperLine, missionData) {
  const parts = line.trim().split(' ');
  
  // SUB_SCRIPT richiami (missions possono chiamare script)
  if (upperLine.startsWith('SUB_SCRIPT ') && parts.length >= 2) {
    missionData.scriptRichiamati.add(parts[1]);
    missionData.comandiRichiamo.add('SUB_SCRIPT');
  }
  
  // ACT_MISSION richiami (missions possono chiamare altre missions)
  if (upperLine.startsWith('ACT_MISSION ') && parts.length >= 2) {
    missionData.missionsRichiamate.add(parts[1]);
    missionData.comandiRichiamo.add('ACT_MISSION');
  }
  
  // Variabili
  if (upperLine.startsWith('SET_TO ') || upperLine.startsWith('ADD ') || 
      upperLine.startsWith('IF_IS ') || upperLine.startsWith('IF_MIN ') || 
      upperLine.startsWith('IF_MAX ')) {
    if (parts.length >= 2) {
      missionData.variabili.add(parts[1]);
    }
  }
  
  // Semafori (anche se tecnicamente sono variabili booleane)
  if (upperLine.startsWith('SET ') || upperLine.startsWith('RESET ') || 
      upperLine.startsWith('IF ') || upperLine.startsWith('IFNOT ')) {
    if (parts.length >= 2 && !parts[1].includes('_')) {
      missionData.variabili.add(parts[1]);
    }
  }
  
  // Personaggi
  if (upperLine.startsWith('SHOWCHAR ') || upperLine.startsWith('HIDECHAR ') || 
      upperLine.startsWith('CHANGECHAR ') || upperLine.startsWith('SAYCHAR ') || 
      upperLine.startsWith('ASKCHAR ')) {
    if (parts.length >= 2) {
      missionData.personaggi.add(parts[1]);
    }
  }
  
  // Labels
  if (upperLine.startsWith('LABEL ') && parts.length >= 2) {
    missionData.labels.add(parts[1]);
  }
  
  // Nodi
  if (upperLine.startsWith('SHOWNODE ') || upperLine.startsWith('HIDENODE ') || 
      upperLine.startsWith('CENTERMAPBYNODE ') || upperLine.startsWith('MOVEPLAYERTONODE ')) {
    if (parts.length >= 2) {
      missionData.nodi.add(parts[1]);
    }
  }
}

// Costruisce grafo collegamenti bidirezionale per missions
function buildMissionConnectionGraph(allMissionsData) {
  const connections = new Map();
  
  // Inizializza connections per ogni mission
  for (const missionName of allMissionsData.keys()) {
    connections.set(missionName, {
      script_richiamati: [],
      missions_richiamate: [],
      richiamato_da_script: [],
      richiamato_da_missions: []
    });
  }
  
  // Costruisce collegamenti bidirezionali
  for (const [missionName, missionData] of allMissionsData.entries()) {
    const conn = connections.get(missionName);
    
    // Script e missions richiamati da questa mission
    conn.script_richiamati = Array.from(missionData.scriptRichiamati);
    conn.missions_richiamate = Array.from(missionData.missionsRichiamate);
    
    // Aggiorna collegamenti inversi per missions
    for (const targetMission of missionData.missionsRichiamate) {
      if (connections.has(targetMission)) {
        connections.get(targetMission).richiamato_da_missions.push(missionName);
      }
    }
  }
  
  // Cerca anche script che chiamano missions con ACT_MISSION
  // (Questo richiede di scansionare i file script - implementazione semplificata)
  
  return connections;
}

// Funzioni helper per conteggi (come in scriptsRoutes.js)
function countCommands(blocks) {
  let count = 0;
  for (const block of blocks) {
    if (block.type !== 'SCRIPT' && block.type !== 'MISSION') {
      count++;
    }
    if (block.children) {
      count += countCommands(block.children);
    }
    if (block.elseBranch) {
      count += countCommands(block.elseBranch);
    }
    if (block.thenBlocks) {
      count += countCommands(block.thenBlocks);
    }
    if (block.elseBlocks) {
      count += countCommands(block.elseBlocks);
    }
    if (block.finishSection) {
      count += countCommands(block.finishSection);
    }
    // Per BUILD e FLIGHT
    if (block.blockInit) {
      count += countCommands(block.blockInit);
    }
    if (block.blockStart) {
      count += countCommands(block.blockStart);
    }
    if (block.blockEvaluate) {
      count += countCommands(block.blockEvaluate);
    }
  }
  return count;
}

function countVariables(blocks) {
  const variables = new Set();
  // Implementazione semplificata
  return variables.size;
}

function countCharacters(blocks) {
  const characters = new Set();
  // Implementazione semplificata
  return characters.size;
}

function countLabels(blocks) {
  const labels = new Set();
  // Implementazione semplificata
  return labels.size;
}

// Determina missions stellate dai bottoni in missions.yaml
async function getStellatedMissionsAndButtons() {
  const stellatedMissions = new Set();
  const routeButtons = [];
  const languages = SUPPORTED_LANGUAGES;
  
  try {
    for (const lang of languages) {
      const missionsPath = config.PATH_TEMPLATES.missionsYaml(lang);
      
      if (await fs.pathExists(missionsPath)) {
        try {
          const content = await fs.readFile(missionsPath, 'utf8');
          const missionsData = yaml.load(content);
          
          if (Array.isArray(missionsData)) {
            for (const routeData of missionsData) {
              if (!routeData.name || !Array.isArray(routeData.button) || routeData.button.length < 3) continue;
              
              const [buttonId, scriptName, missionName] = routeData.button;
              
              // La mission è stellata se collegata a un bottone
              if (missionName) {
                stellatedMissions.add(missionName);
                
                // Aggiungi bottone solo una volta (dalla prima lingua)
                if (!routeButtons.find(b => b.id === buttonId)) {
                  routeButtons.push({
                    id: buttonId,
                    tipo: 'route_button',
                    sourceId: routeData.name,
                    script: scriptName,
                    mission: missionName
                  });
                }
              }
            }
          }
        } catch (error) {
          logger.warn(`Error loading missions.yaml for ${lang}: ${error.message}`);
        }
      }
    }
    
    return { stellatedMissions, routeButtons };
  } catch (error) {
    logger.warn(`Error determining stellated missions: ${error.message}`);
    return { stellatedMissions: new Set(), routeButtons: [] };
  }
}

// Funzione validazione post-save per API 15
async function validateSavedMission(missionName, language, originalBlocks) {
  try {
    // 1. Rilegge la mission appena salvata
    const savedMission = await parseMissionSingleLanguage(missionName, language, 'blocks');
    
    if (!savedMission || !savedMission.blocks) {
      return {
        isValid: false,
        error: 'VALIDATION_FAILED - Could not re-parse saved mission'
      };
    }
    
    // 2. Confronta struttura salvata con originale (inclusa sezione FINISH)
    const structureMatch = compareMissionStructures(originalBlocks, savedMission.blocks);
    
    if (!structureMatch.isMatch) {
      return {
        isValid: false,
        error: `VALIDATION_FAILED - Structure mismatch: ${structureMatch.mismatchLocation}`,
        details: {
          originalBlockCount: originalBlocks.length,
          savedBlockCount: savedMission.blocks.length
        }
      };
    }
    
    // 3. Verifica serializzazione→parsing→serializzazione idempotente per mission
    const reserializedContent = convertBlocksToScript(savedMission.blocks);
    const originalSerializedContent = convertBlocksToScript(originalBlocks);
    
    return {
      isValid: true,
      roundTripTest: {
        passed: true,
        originalLines: originalSerializedContent.split('\n').length,
        reserializedLines: reserializedContent.split('\n').length
      },
      structureValidation: {
        passed: true,
        blockCount: savedMission.blocks.length,
        commandCount: savedMission.metadata?.commandCount || 0,
        buildPhases: savedMission.metadata?.buildPhaseCount || 0,
        flightPhases: savedMission.metadata?.flightPhaseCount || 0
      }
    };
    
  } catch (error) {
    logger.error(`Error in mission validation: ${error.message}`);
    return {
      isValid: false,
      error: `VALIDATION_ERROR - ${error.message}`
    };
  }
}

// Confronto strutture mission per validazione (più complesso degli script)
function compareMissionStructures(blocks1, blocks2) {
  if (blocks1.length !== blocks2.length) {
    return { isMatch: false, mismatchLocation: 'block count differs' };
  }
  
  for (let i = 0; i < blocks1.length; i++) {
    const block1 = blocks1[i];
    const block2 = blocks2[i];
    
    if (block1.type !== block2.type) {
      return { isMatch: false, mismatchLocation: `block ${i}: type differs (${block1.type} vs ${block2.type})` };
    }
    
    // Controllo specifico per blocchi MISSION
    if (block1.type === 'MISSION') {
      // Controlla sezione finish se presente
      if ((block1.finishSection && !block2.finishSection) || (!block1.finishSection && block2.finishSection)) {
        return { isMatch: false, mismatchLocation: `block ${i}: finish section presence differs` };
      }
      
      if (block1.finishSection && block2.finishSection) {
        const finishMatch = compareMissionStructures(block1.finishSection, block2.finishSection);
        if (!finishMatch.isMatch) {
          return { isMatch: false, mismatchLocation: `block ${i}.finishSection: ${finishMatch.mismatchLocation}` };
        }
      }
    }
    
    // Controllo specifico per blocchi BUILD/FLIGHT con fasi
    if ((block1.type === 'BUILD' || block1.type === 'FLIGHT') && block1.phase !== block2.phase) {
      return { isMatch: false, mismatchLocation: `block ${i}: phase differs (${block1.phase} vs ${block2.phase})` };
    }
    
    // Controllo ricorsivo per blocchi con children
    if (block1.children && block2.children) {
      const childMatch = compareMissionStructures(block1.children, block2.children);
      if (!childMatch.isMatch) {
        return { isMatch: false, mismatchLocation: `block ${i}.children: ${childMatch.mismatchLocation}` };
      }
    }
    
    // Controllo branch ELSE per IF
    if (block1.elseBranch && block2.elseBranch) {
      const elseMatch = compareMissionStructures(block1.elseBranch, block2.elseBranch);
      if (!elseMatch.isMatch) {
        return { isMatch: false, mismatchLocation: `block ${i}.elseBranch: ${elseMatch.mismatchLocation}` };
      }
    }
  }
  
  return { isMatch: true };
}

// Parse mission multilingua
async function parseMissionMultilingual(missionName, format = 'blocks') {
  try {
    const languages = SUPPORTED_LANGUAGES;
    const parsedMissions = {};
    let referenceMission = null;
    
    // 1. Parse ogni lingua separatamente
    for (const lang of languages) {
      const missionData = await parseMissionSingleLanguage(missionName, lang, format);
      if (missionData) {
        parsedMissions[lang] = missionData;
        if (lang === 'EN') {
          referenceMission = missionData;
        }
      }
    }
    
    if (!referenceMission) {
      // Usa la prima lingua disponibile come riferimento
      const availableLanguages = Object.keys(parsedMissions);
      if (availableLanguages.length === 0) {
        return null;
      }
      referenceMission = parsedMissions[availableLanguages[0]];
    }
    
    // 2. Merge multilingua se formato blocchi
    if (format === 'blocks') {
      try {
        const mergedResult = mergeMissionMultilingualBlocks(parsedMissions, referenceMission);
        return mergedResult;
      } catch (mergeError) {
        logger.error(`Error merging multilingual mission ${missionName}: ${mergeError.message}`);
        // Fallback: restituisci solo inglese con errore
        referenceMission.error = `ML - ${mergeError.message}`;
        return referenceMission;
      }
    } else {
      // Formato raw: aggiungi solo info multilingua
      referenceMission.availableLanguages = Object.keys(parsedMissions);
      referenceMission.multilingualVersions = parsedMissions;
      return referenceMission;
    }
    
  } catch (error) {
    logger.error(`Error parsing multilingual mission ${missionName}: ${error.message}`);
    throw error;
  }
}

// Merge blocchi multilingua per missioni
function mergeMissionMultilingualBlocks(parsedMissions, referenceMission) {
  const languages = Object.keys(parsedMissions);
  const result = { ...referenceMission };
  
  // Rimuovi il campo languages se presente
  delete result.languages;
  
  // Merge blocksMission
  if (result.blocksMission) {
    result.blocksMission = mergeBlockArrays(result.blocksMission, parsedMissions, 'blocksMission');
  }
  
  // Merge blocksFinish
  if (result.blocksFinish) {
    result.blocksFinish = mergeBlockArrays(result.blocksFinish, parsedMissions, 'blocksFinish');
  }
  
  result.availableLanguages = languages;
  result.multilingualMerged = true;
  
  return result;
}

// Merge array di blocchi per tutte le lingue
function mergeBlockArrays(referenceBlocks, parsedMissions, blockType) {
  const languages = Object.keys(parsedMissions);
  const mergedBlocks = [];
  
  for (let i = 0; i < referenceBlocks.length; i++) {
    const refBlock = referenceBlocks[i];
    const mergedBlock = { ...refBlock };
    
    // Per BUILD e FLIGHT, merge le fasi interne
    if (refBlock.type === 'BUILD') {
      mergedBlock.blockInit = mergeBlockArrays(refBlock.blockInit || [], parsedMissions, `${blockType}[${i}].blockInit`);
      mergedBlock.blockStart = mergeBlockArrays(refBlock.blockStart || [], parsedMissions, `${blockType}[${i}].blockStart`);
      mergedBlock.numBlockInit = mergedBlock.blockInit.length;
      mergedBlock.numBlockStart = mergedBlock.blockStart.length;
    } else if (refBlock.type === 'FLIGHT') {
      mergedBlock.blockInit = mergeBlockArrays(refBlock.blockInit || [], parsedMissions, `${blockType}[${i}].blockInit`);
      mergedBlock.blockStart = mergeBlockArrays(refBlock.blockStart || [], parsedMissions, `${blockType}[${i}].blockStart`);
      mergedBlock.blockEvaluate = mergeBlockArrays(refBlock.blockEvaluate || [], parsedMissions, `${blockType}[${i}].blockEvaluate`);
      mergedBlock.numBlockInit = mergedBlock.blockInit.length;
      mergedBlock.numBlockStart = mergedBlock.blockStart.length;
      mergedBlock.numBlockEvaluate = mergedBlock.blockEvaluate.length;
    } else if (refBlock.type === 'IF') {
      // Merge branch IF
      if (refBlock.thenBlocks) {
        mergedBlock.thenBlocks = mergeBlockArrays(refBlock.thenBlocks, parsedMissions, `${blockType}[${i}].thenBlocks`);
        mergedBlock.numThen = mergedBlock.thenBlocks.length;
      }
      if (refBlock.elseBlocks) {
        mergedBlock.elseBlocks = mergeBlockArrays(refBlock.elseBlocks, parsedMissions, `${blockType}[${i}].elseBlocks`);
        mergedBlock.numElse = mergedBlock.elseBlocks.length;
      }
    } else if (refBlock.type === 'MENU' && refBlock.children) {
      // Merge opzioni menu
      mergedBlock.children = mergeBlockArrays(refBlock.children, parsedMissions, `${blockType}[${i}].children`);
    } else if (refBlock.type === 'OPT' && refBlock.children) {
      // Merge contenuto opzione con testi multilingua
      mergedBlock.children = mergeBlockArrays(refBlock.children, parsedMissions, `${blockType}[${i}].children`);
      // Merge testo opzione
      if (refBlock.text) {
        mergedBlock.text = {};
        for (const lang of languages) {
          const langBlocks = getBlockAtPath(parsedMissions[lang], blockType);
          if (langBlocks && langBlocks[i] && langBlocks[i].text) {
            mergedBlock.text[lang] = typeof langBlocks[i].text === 'string' 
              ? langBlocks[i].text 
              : langBlocks[i].text[lang] || langBlocks[i].text;
          }
        }
      }
    } else if (refBlock.parameters) {
      // Merge parametri con testi multilingua
      mergedBlock.parameters = mergeCommandParameters(refBlock.parameters, parsedMissions, languages, `${blockType}[${i}]`);
    }
    
    mergedBlocks.push(mergedBlock);
  }
  
  return mergedBlocks;
}

// Helper per ottenere blocco da path
function getBlockAtPath(mission, path) {
  const parts = path.split(/[\[\].]/).filter(p => p);
  let current = mission;
  
  for (const part of parts) {
    if (!current) return null;
    if (!isNaN(part)) {
      current = current[parseInt(part)];
    } else {
      current = current[part];
    }
  }
  
  return current;
}

// Merge parametri comando con testi multilingua
function mergeCommandParameters(refParams, parsedMissions, languages, blockPath) {
  const mergedParams = { ...refParams };
  
  // Identifica parametri che potrebbero contenere testo
  const textParams = ['text', 'message', 'prompt', 'label', 'title', 'description'];
  
  for (const paramName of Object.keys(refParams)) {
    if (textParams.includes(paramName) || paramName.includes('text') || paramName.includes('Text')) {
      // Questo parametro potrebbe contenere testo multilingua
      const paramValue = refParams[paramName];
      
      if (typeof paramValue === 'string') {
        // Crea oggetto multilingua
        mergedParams[paramName] = {};
        for (const lang of languages) {
          const langBlock = getBlockAtPath(parsedMissions[lang], blockPath);
          if (langBlock && langBlock.parameters && langBlock.parameters[paramName]) {
            mergedParams[paramName][lang] = langBlock.parameters[paramName];
          }
        }
      } else if (typeof paramValue === 'object' && paramValue !== null) {
        // Già multilingua, assicurati che tutte le lingue siano presenti
        for (const lang of languages) {
          const langBlock = getBlockAtPath(parsedMissions[lang], blockPath);
          if (langBlock && langBlock.parameters && langBlock.parameters[paramName]) {
            if (typeof langBlock.parameters[paramName] === 'string') {
              mergedParams[paramName][lang] = langBlock.parameters[paramName];
            } else if (langBlock.parameters[paramName][lang]) {
              mergedParams[paramName][lang] = langBlock.parameters[paramName][lang];
            }
          }
        }
      }
    }
  }
  
  return mergedParams;
}

// Parse mission singola lingua (seguendo la stessa logica di parseScriptSingleLanguage)
async function parseMissionSingleLanguage(missionName, language = 'EN', format = 'blocks') {
  try {
    // Array delle directory da cercare in ordine di priorità
    const searchPaths = [
      // 1. Directory standard campaign
      path.join(GAME_ROOT, 'campaign', `campaignScripts${language}`),
      // 2. Custom missions multilingua
      path.join(GAME_ROOT, 'customScripts', language),
      // 3. Custom missions singola lingua (solo per EN o se non trovato altrove)
      path.join(GAME_ROOT, 'customScripts')
    ];
    
    let missionFound = false;
    let missionLines = [];
    let fileName = '';
    let searchedPath = '';
    
    // Cerca la mission in tutte le directory
    for (const missionsPath of searchPaths) {
      if (!await fs.pathExists(missionsPath)) {
        continue;
      }
      
      try {
        const files = await fs.readdir(missionsPath);
        
        // Cerca la mission nei file
        for (const file of files.filter(f => f.endsWith('.txt'))) {
          const filePath = path.join(missionsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.split('\n');
          
          let missionStartIndex = -1;
          let missionEndIndex = -1;
          let currentMission = null;
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('MISSION ')) {
              const mName = line.replace('MISSION ', '').trim();
              if (mName === missionName) {
                currentMission = mName;
                missionStartIndex = i;
              }
            } else if (line === 'END_OF_MISSION' && currentMission === missionName) {
              missionEndIndex = i;
              break;
            }
          }
          
          if (missionStartIndex >= 0 && missionEndIndex >= 0) {
            missionLines = lines.slice(missionStartIndex, missionEndIndex + 1);
            missionFound = true;
            fileName = file;
            searchedPath = missionsPath;
            break;
          }
        }
        
        if (missionFound) {
          break;
        }
      } catch (error) {
        logger.warn(`Error scanning ${missionsPath}: ${error.message}`);
      }
    }
    
    if (!missionFound) {
      logger.warn(`Mission '${missionName}' not found in any directory for language ${language}`);
      return null;
    }
    
    logger.info(`Mission '${missionName}' found in ${searchedPath}/${fileName}`);
    
    // Prepara risultato base
    const result = {
      name: missionName,
      fileName: fileName,
      language: language,
      originalCode: missionLines.join('\n'),
      lineCount: missionLines.length
    };
    
    if (format === 'blocks') {
      try {
        // Parse con il parser standard
        const parseResult = parseScriptToBlocks(missionLines, language);
        
        if (parseResult.blocks.length > 0 && parseResult.blocks[0].type === 'MISSION') {
          const missionBlock = parseResult.blocks[0];
          
          // Aggrega BUILD e FLIGHT e costruisci blocksMission/blocksFinish
          const blocksMission = [];
          const blocksFinish = [];
          
          // Processa children (tutto prima di FINISH_MISSION)
          if (missionBlock.children && Array.isArray(missionBlock.children)) {
            for (const child of missionBlock.children) {
              if (child.type === 'BUILD') {
                // Il parser ora restituisce BUILD già come blocco singolo con le fasi
                blocksMission.push({
                  type: 'BUILD',
                  blockInit: child.blockInit || [],
                  blockStart: child.blockStart || [],
                  numBlockInit: child.numBlockInit || 0,
                  numBlockStart: child.numBlockStart || 0
                });
              } else if (child.type === 'FLIGHT') {
                // Il parser ora restituisce FLIGHT già come blocco singolo con le fasi
                blocksMission.push({
                  type: 'FLIGHT',
                  blockInit: child.blockInit || [],
                  blockStart: child.blockStart || [],
                  blockEvaluate: child.blockEvaluate || [],
                  numBlockInit: child.numBlockInit || 0,
                  numBlockStart: child.numBlockStart || 0,
                  numBlockEvaluate: child.numBlockEvaluate || 0
                });
              } else {
                // Altri comandi (ADDOPPONENT, SETDECKPREPARATIONSCRIPT, etc.)
                blocksMission.push(child);
              }
            }
          }
          
          // Processa finishSection (tutto dopo FINISH_MISSION)
          if (missionBlock.finishSection && Array.isArray(missionBlock.finishSection)) {
            blocksFinish.push(...missionBlock.finishSection);
          }
          
          // Costruisci risultato finale (no blocks field for missions)
          result.blocksMission = blocksMission;
          result.blocksFinish = blocksFinish;
          
          result.metadata = {
            blockCount: 1,  // La mission stessa
            errorCount: parseResult.errors?.length || 0,
            commandCount: countCommands([missionBlock]),
            variableCount: countVariables([missionBlock]),
            characterCount: countCharacters([missionBlock]),
            labelCount: countLabels([missionBlock])
          };
          
          if (parseResult.errors && parseResult.errors.length > 0) {
            result.parseErrors = parseResult.errors;
          }
        }
      } catch (parseError) {
        logger.error(`Error parsing mission ${missionName} to blocks: ${parseError.message}`);
        result.error = `PARSE - ${parseError.message}`;
        result.blocks = [];
        result.blocksMission = [];
        result.blocksFinish = [];
      }
    }
    
    return result;
  } catch (error) {
    logger.error(`Error parsing mission ${missionName} for language ${language}: ${error.message}`);
    return null;
  }
}

// API per ottenere coverage traduzioni missions (simile a scripts)
router.get('/translations/coverage', async (req, res) => {
  try {
    logger.info('API call: GET /api/missions/translations/coverage - Coverage traduzioni missions');
    
    const languages = ['EN', 'IT', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU'];
    const perLanguage = {};
    const perMission = [];
    
    // Inizializza contatori per lingua
    for (const lang of languages) {
      if (lang === 'EN') continue; // EN è la lingua base
      perLanguage[lang] = { covered: 0, missing: 0, different: 0, totalFields: 0, percent: 100 };
    }
    
    // Ottieni lista missions usando la stessa logica dell'endpoint existente
    // (evita fetch interno per problemi di dipendenze Node.js)
    const allMissionsData = new Map();
    
    // Carica missions standard da tutte le lingue
    for (const lang of languages) {
      const missionsPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`);
      logger.info(`🔍 Checking path: ${missionsPath}`);
      if (await fs.pathExists(missionsPath)) {
        try {
          const files = await fs.readdir(missionsPath);
          const txtFiles = files.filter(f => f.endsWith('.txt'));
          logger.info(`📁 Found ${txtFiles.length} txt files in ${lang}: ${txtFiles.slice(0,3).join(', ')}${txtFiles.length > 3 ? '...' : ''}`);
          for (const fileName of txtFiles) {
            const filePath = path.join(missionsPath, fileName);
            await parseMissionFileForAPI12(filePath, fileName, lang, allMissionsData, false);
          }
          logger.info(`📊 Total missions in allMissionsData after ${lang}: ${allMissionsData.size}`);
        } catch (error) {
          logger.warn(`Error scanning missions for ${lang}: ${error.message}`);
        }
      } else {
        logger.warn(`Path does not exist: ${missionsPath}`);
      }
    }
    
    // Carica missions custom multilingua
    const customScriptsPath = path.join(GAME_ROOT, 'customScripts');
    for (const lang of languages) {
      const langPath = path.join(customScriptsPath, lang);
      if (await fs.pathExists(langPath)) {
        try {
          const files = await fs.readdir(langPath);
          const txtFiles = files.filter(f => f.endsWith('.txt'));
          for (const fileName of txtFiles) {
            const filePath = path.join(langPath, fileName);
            await parseMissionFileForAPI12(filePath, fileName, lang, allMissionsData, true);
          }
        } catch (error) {
          logger.warn(`Error scanning custom missions for ${lang}: ${error.message}`);
        }
      }
    }
    
    // Carica missions custom singola lingua
    if (await fs.pathExists(customScriptsPath)) {
      try {
        const files = await fs.readdir(customScriptsPath);
        const txtFiles = files.filter(f => f.endsWith('.txt') && f !== 'README.txt');
        for (const fileName of txtFiles) {
          const filePath = path.join(customScriptsPath, fileName);
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            await parseMissionFileForAPI12(filePath, fileName, 'EN', allMissionsData, true);
          }
        }
      } catch (error) {
        logger.warn(`Error scanning custom scripts root: ${error.message}`);
      }
    }
    
    const missions = Array.from(allMissionsData.values()).map(missionData => ({
      nomemission: missionData.name,
      name: missionData.name, // Aggiunge anche .name per compatibilità
      languages: missionData.languages,
      isCustom: missionData.isCustom || false
    }));
    
    
    // Calcola coverage per ogni mission multilingua
    for (const mission of missions) {
      const missionName = mission.nomemission;
      if (!missionName) continue;
      
      
      // Salta missions custom non-multilingua
      const isNonMultilingual = mission.isCustom && (!mission.languages || (mission.languages.length === 1 && mission.languages[0] === 'EN'));
      if (isNonMultilingual) {
        continue;
      }
      
      // Salta missions che non hanno EN (lingua base necessaria)
      if (!mission.languages || !mission.languages.includes('EN')) {
        continue;
      }
      
      try {
        // Usa lo stesso approccio dell'endpoint individuale che funziona
        // Carica solo EN come riferimento per ottenere i campi da tradurre
        const enMission = await parseMissionSingleLanguage(missionName, 'EN', 'blocks');
        if (!enMission || !enMission.blocksMission) continue;
        
        // Estrai tutti i blocchi dalla versione EN
        const allBlocks = [
          ...(enMission.blocksMission || []),
          ...(enMission.blocksFinish || [])
        ];
        
        // Estrai campi multilingua dalla versione EN
        const translationFields = extractMissionTranslationFields(allBlocks, languages);
        
        if (translationFields.length === 0) continue;
        
        const missionEntry = { mission: missionName, totalFields: translationFields.length, languages: {} };
        
        // Per ogni lingua target, carica la mission e confronta
        for (const lang of languages) {
          if (lang === 'EN') continue;
          
          // Salta lingue non supportate da questa mission
          if (!mission.languages.includes(lang)) {
            missionEntry.languages[lang] = {
              covered: 0,
              missing: translationFields.length,
              different: 0,
              totalFields: translationFields.length,
              percent: 0
            };
            // Aggiungi ai contatori globali anche per lingue non supportate
            perLanguage[lang].missing += translationFields.length;
            perLanguage[lang].totalFields += translationFields.length;
            continue;
          }
          
          try {
            const langMission = await parseMissionSingleLanguage(missionName, lang, 'blocks');
            if (!langMission) {
              missionEntry.languages[lang] = {
                covered: 0,
                missing: translationFields.length,
                different: 0,
                totalFields: translationFields.length,
                percent: 0
              };
              continue;
            }
            
            // Estrai campi dalla versione tradotta
            const langBlocks = [
              ...(langMission.blocksMission || []),
              ...(langMission.blocksFinish || [])
            ];
            const langFields = extractMissionTranslationFields(langBlocks, [lang]);
            
            // Calcola coverage confrontando EN vs lang
            const stats = calculateMissionCoverageStats(translationFields, lang, langFields);
            missionEntry.languages[lang] = {
              covered: stats.covered,
              missing: stats.missing,
              different: stats.covered,
              totalFields: stats.total,
              percent: stats.percent
            };
            
            // Aggiungi ai contatori globali
            perLanguage[lang].covered += stats.covered;
            perLanguage[lang].missing += stats.missing;
            perLanguage[lang].different += stats.covered;
            perLanguage[lang].totalFields += stats.total;
            
          } catch (langError) {
            // Se la lingua non esiste, considera tutto missing
            missionEntry.languages[lang] = {
              covered: 0,
              missing: translationFields.length,
              different: 0,
              totalFields: translationFields.length,
              percent: 0
            };
            perLanguage[lang].missing += translationFields.length;
            perLanguage[lang].totalFields += translationFields.length;
          }
        }
        
        perMission.push(missionEntry);
        
      } catch (error) {
        logger.warn(`Error processing mission ${missionName} for coverage: ${error.message}`);
      }
    }
    
    // Calcola percentuali globali
    for (const lang of languages) {
      if (lang === 'EN') continue;
      const d = perLanguage[lang];
      d.percent = d.totalFields > 0 ? Math.round((d.covered / d.totalFields) * 100) : 0;
    }
    
    logger.info(`Missions translation coverage calculated for ${perMission.length} missions`);
    
    res.json({
      success: true,
      data: { perLanguage, perMission }
    });
    
  } catch (error) {
    logger.error(`Error calculating missions translation coverage: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to calculate missions translation coverage',
      message: error.message 
    });
  }
});

// Funzione per estrarre campi multilingua dalle missions
function extractMissionTranslationFields(blocks, languages) {
  const fields = [];
  const norm = (s) => (typeof s === 'string' ? s.trim() : '');
  
  function visit(list, pathStack) {
    if (!Array.isArray(list)) return;
    let lastLabel = null;
    
    for (let i = 0; i < list.length; i++) {
      const b = list[i] || {};
      const currentPath = [...pathStack, i];
      
      // Traccia label più vicino
      if (b.type === 'LABEL' && b.parameters?.name) {
        lastLabel = String(b.parameters.name);
      }
      
      // Campo text (usato da OPT e SAY)
      if (b.text && typeof b.text === 'object' && !Array.isArray(b.text)) {
        const enVal = norm(b.text.EN || Object.values(b.text)[0] || '');
        if (enVal) {
          fields.push({
            blockPath: currentPath,
            field: 'text',
            en: enVal,
            values: { ...b.text },
            nearestLabel: lastLabel,
            type: b.type || null
          });
        }
      }
      
      // Parametri con oggetti multilingua
      if (b.parameters && typeof b.parameters === 'object') {
        for (const [pName, pVal] of Object.entries(b.parameters)) {
          if (pVal && typeof pVal === 'object' && !Array.isArray(pVal)) {
            const enVal = norm(pVal.EN || Object.values(pVal)[0] || '');
            if (enVal) {
              fields.push({
                blockPath: currentPath,
                field: `parameters.${pName}`,
                en: enVal,
                values: { ...pVal },
                nearestLabel: lastLabel,
                type: b.type || null
              });
            }
          }
        }
      }
      
      // Ricorsione sui contenitori
      if (b.children) visit(b.children, [...currentPath, 'children']);
      if (b.thenBlocks) visit(b.thenBlocks, [...currentPath, 'thenBlocks']);
      if (b.elseBlocks) visit(b.elseBlocks, [...currentPath, 'elseBlocks']);
      
      // Ricorsione sui blocchi specifici delle missions
      if (b.blockInit) visit(b.blockInit, [...currentPath, 'blockInit']);
      if (b.blockStart) visit(b.blockStart, [...currentPath, 'blockStart']);
      if (b.blockEvaluate) visit(b.blockEvaluate, [...currentPath, 'blockEvaluate']);
    }
  }
  
  visit(blocks, []);
  return fields;
}

// Funzione per calcolare statistiche coverage missions
function calculateMissionCoverageStats(enFields, targetLang, langFields = null) {
  let covered = 0;
  let missing = 0;
  
  if (langFields) {
    // Confronta campi EN vs campi tradotti 
    for (const enField of enFields) {
      const langField = langFields.find(lf => 
        lf.blockPath.join('.') === enField.blockPath.join('.') && 
        lf.field === enField.field
      );
      
      if (langField && langField.values[targetLang] && 
          langField.values[targetLang].trim() !== enField.en.trim()) {
        covered++;
      } else {
        missing++;
      }
    }
  } else {
    // Usa la logica originale se langFields non disponibili
    for (const field of enFields) {
      const targetVal = field.values[targetLang]?.trim() || '';
      const enVal = field.en.trim();
      
      if (!targetVal || targetVal === enVal) {
        missing++;
      } else {
        covered++;
      }
    }
  }
  
  const total = enFields.length;
  const percent = total > 0 ? Math.round((covered / total) * 100) : 100;
  
  return { covered, missing, total, percent };
}

// API Batch Search: Cerca un termine nel contenuto di tutte le missions specificate
router.post('/translations/batch-search', async (req, res) => {
  try {
    const { missionNames, searchTerm } = req.body;
    
    if (!Array.isArray(missionNames) || !searchTerm || typeof searchTerm !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Expected { missionNames: string[], searchTerm: string }'
      });
    }
    
    logger.info(`Batch search for "${searchTerm}" in ${missionNames.length} missions`);
    
    const matchingMissions = [];
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    const allMissionsData = new Map();
    
    // Carica tutte le missions da tutte le lingue (simile all'endpoint GET / esistente)
    const languages = SUPPORTED_LANGUAGES;
    for (const lang of languages) {
      const missionsPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`);
      
      if (await fs.pathExists(missionsPath)) {
        try {
          const files = await fs.readdir(missionsPath);
          const txtFiles = files.filter(f => f.endsWith('.txt'));
          
          for (const fileName of txtFiles) {
            const filePath = path.join(missionsPath, fileName);
            await parseMissionFileForAPI12(filePath, fileName, lang, allMissionsData);
          }
        } catch (error) {
          logger.warn(`Error scanning missions for ${lang}: ${error.message}`);
        }
      }
      
      // Carica anche customScripts per missions custom
      const customScriptsPath = path.join(GAME_ROOT, 'customScripts');
      const langPath = path.join(customScriptsPath, lang);
      if (await fs.pathExists(langPath)) {
        try {
          const files = await fs.readdir(langPath);
          const txtFiles = files.filter(f => f.endsWith('.txt'));
          
          for (const fileName of txtFiles) {
            const filePath = path.join(langPath, fileName);
            await parseMissionFileForAPI12(filePath, fileName, lang, allMissionsData, true);
          }
        } catch (error) {
          logger.warn(`Error scanning custom missions for ${lang}: ${error.message}`);
        }
      }
    }
    
    // Carica missions custom dirette in root
    const customScriptsPath = path.join(GAME_ROOT, 'customScripts');
    if (await fs.pathExists(customScriptsPath)) {
      try {
        const files = await fs.readdir(customScriptsPath);
        const txtFiles = files.filter(f => f.endsWith('.txt') && f !== 'README.txt');
        for (const fileName of txtFiles) {
          const filePath = path.join(customScriptsPath, fileName);
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            await parseMissionFileForAPI12(filePath, fileName, 'EN', allMissionsData, true);
          }
        }
      } catch (error) {
        logger.warn(`Error scanning custom scripts root: ${error.message}`);
      }
    }
    
    // Processa le missions specificate in parallelo per performance
    const searchPromises = missionNames.map(async (missionName) => {
      try {
        const missionData = allMissionsData.get(missionName);
        if (!missionData) {
          return null;
        }
        
        // Cerca nel nome della mission
        if (missionName.toLowerCase().includes(normalizedSearchTerm)) {
          return missionName;
        }
        
        // Cerca nei file di testo per tutte le lingue disponibili
        if (missionData.languages && Array.isArray(missionData.languages)) {
          for (const lang of missionData.languages) {
            const fileName = missionData.fileNames[lang];
            if (!fileName) continue;
            
            // Costruisci il percorso del file
            let filePath;
            if (missionData.isCustom && missionData.customPath) {
              filePath = missionData.customPath;
            } else {
              filePath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`, fileName);
            }
            
            try {
              // Cerca nel contenuto del file di quella lingua
              if (await searchInMissionFile(filePath, missionName, normalizedSearchTerm)) {
                return missionName;
              }
            } catch (fileError) {
              logger.warn(`Error searching mission file ${filePath}: ${fileError.message}`);
              continue;
            }
          }
        }
        
      } catch (error) {
        logger.warn(`Error searching mission ${missionName}: ${error.message}`);
      }
      return null;
    });
    
    const results = await Promise.all(searchPromises);
    const matchingMissionNames = results.filter(name => name !== null);
    
    logger.info(`Found ${matchingMissionNames.length} missions matching "${searchTerm}"`);
    
    res.json({
      success: true,
      data: {
        searchTerm,
        totalSearched: missionNames.length,
        matchingMissions: matchingMissionNames,
        matchCount: matchingMissionNames.length
      }
    });
    
  } catch (error) {
    logger.error('Error in batch search missions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search missions',
      message: error.message
    });
  }
});

// Helper function per verificare se una riga contiene contenuto tradubibile
function isTranslatableContent(line, searchTerm) {
  const trimmed = line.trim().toLowerCase();
  const searchTermLower = searchTerm.toLowerCase();
  
  // Lista di comandi con parametri tradubibili (con pattern di match per il testo)
  const translatableCommands = [
    // Comandi con testo diretto
    { pattern: /^say\s+(.+)$/i, textGroup: 1 },
    { pattern: /^text\s+(.+)$/i, textGroup: 1 },
    { pattern: /^ask\s+(.+)$/i, textGroup: 1 },
    { pattern: /^message\s+(.+)$/i, textGroup: 1 },
    { pattern: /^prompt\s+(.+)$/i, textGroup: 1 },
    { pattern: /^title\s+(.+)$/i, textGroup: 1 },
    { pattern: /^description\s+(.+)$/i, textGroup: 1 },
    { pattern: /^label\s+(.+)$/i, textGroup: 1 },
    
    // Comandi con parametri nominati che possono contenere testo
    { pattern: /^saychar\s+\w+\s+(.+)$/i, textGroup: 1 },
    { pattern: /^askchar\s+\w+\s+(.+)$/i, textGroup: 1 },
    
    // Menu e opzioni (OPT con testo)
    { pattern: /^opt\s+(.+)$/i, textGroup: 1 }
  ];
  
  // Controlla ogni pattern
  for (const cmd of translatableCommands) {
    const match = trimmed.match(cmd.pattern);
    if (match && match[cmd.textGroup]) {
      const textContent = match[cmd.textGroup].toLowerCase();
      if (textContent.includes(searchTermLower)) {
        return true;
      }
    }
  }
  
  return false;
}

// Helper function per cercare in un file di mission
async function searchInMissionFile(filePath, missionName, searchTerm) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    let insideMission = false;
    let currentMission = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Rileva inizio mission
      if (trimmedLine.startsWith('MISSION ')) {
        currentMission = trimmedLine.replace('MISSION ', '').trim();
        insideMission = (currentMission === missionName);
        continue;
      }
      
      // Rileva fine mission
      if (trimmedLine === 'END_OF_MISSION') {
        if (insideMission) {
          return false; // Mission finita, termine non trovato
        }
        insideMission = false;
        currentMission = null;
        continue;
      }
      
      // Se siamo nella mission corretta, cerca il termine SOLO nei campi tradubibili
      if (insideMission && isTranslatableContent(trimmedLine, searchTerm)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logger.warn(`Error reading mission file ${filePath}: ${error.message}`);
    return false;
  }
}

module.exports = router;
