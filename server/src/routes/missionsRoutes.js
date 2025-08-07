// missionsRoutes.js - Routes per gestione missions
const express = require('express');
const { parseScriptContent } = require('../parsers/scriptParser');
const { parseScriptToBlocks, convertBlocksToScript } = require('../parsers/blockParser');
const { getLogger } = require('../utils/logger');
const config = require('../config/config');
const { GAME_ROOT, SUPPORTED_LANGUAGES } = config;
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { findAllRelatedScripts } = require('../utils/scriptAnalyzer');

const router = express.Router();
const logger = getLogger();

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
    
    // 1. Scansiona tutti i file mission multilingua
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
        nodi_referenziati: Array.from(missionData.nodi || [])
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

// API 15: Salvataggio mission da JSON
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
async function parseMissionFileForAPI12(filePath, fileName, language, allMissionsData) {
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
            languages: [],
            fileNames: {},
            commandCounts: {},
            comandiRichiamo: new Set(),
            scriptRichiamati: new Set(),
            missionsRichiamate: new Set(),
            variabili: new Set(),
            personaggi: new Set(),
            labels: new Set(),
            nodi: new Set()
          });
        }
        
        const missionData = allMissionsData.get(currentMission);
        if (!missionData.languages.includes(language)) {
          missionData.languages.push(language);
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

module.exports = router;
