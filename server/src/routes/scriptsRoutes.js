// scriptsRoutes.js - Routes per gestione scripts
const express = require('express');
const { parseScriptContent } = require('../parsers/scriptParser');
const { parseScriptToBlocks, convertBlocksToScript, serializeElement } = require('../parsers/blockParser');
const { getLogger } = require('../utils/logger');
const config = require('../config/config');
const { GAME_ROOT, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = config;
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { initializeLanguage, isLanguageInitialized, getAvailableLanguages } = require('../utils/languageInitializer');

const router = express.Router();
const logger = getLogger();

// API 2.5: Lista lingue disponibili (dinamica)
router.get('/languages', async (req, res) => {
  try {
    logger.info('API call: GET /api/scripts/languages');
    
    // Ottiene lingue inizializzate dal filesystem
    const availableLanguages = await getAvailableLanguages(GAME_ROOT);
    
    // Combina con le lingue supportate di default per assicurare completezza
    const allLanguages = [...new Set([...SUPPORTED_LANGUAGES, ...availableLanguages])].sort();
    
    res.json({
      success: true,
      data: {
        languages: allLanguages,
        defaultLanguage: DEFAULT_LANGUAGE,
        initializedLanguages: availableLanguages,
        supportedLanguages: SUPPORTED_LANGUAGES
      },
      count: allLanguages.length
    });
  } catch (error) {
    logger.error(`Error retrieving languages: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve languages',
      message: error.message 
    });
  }
});

// API 3: Lista variabili con scansione ricorsiva campaign
router.get('/variables', async (req, res) => {
  try {
    logger.info('API call: GET /api/scripts/variables - Scansione ricorsiva ./campaign/**/*.txt');
    
    const variableMap = new Map();
    
    // Scansiona ricorsivamente tutti i file .txt in ./campaign
    await scanCampaignFiles(variableMap, 'variables');
    
    // Converti mappa in array
    const result = Array.from(variableMap.entries()).map(([nomevariabile, data]) => ({
      nomevariabile,
      listascriptchelausano: Array.from(data.scripts),
      tipo: 'numerica',
      utilizzi_totali: data.count,
      operazioni: data.operations,
      valori_utilizzati: Array.from(data.values).sort((a, b) => a - b)
    })).sort((a, b) => a.nomevariabile.localeCompare(b.nomevariabile));
    
    logger.info(`Found ${result.length} unique variables from campaign files`);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    logger.error(`Error retrieving variables: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve variables',
      message: error.message 
    });
  }
});

// Funzione per scansionare ricorsivamente file campaign
async function scanCampaignFiles(resultMap, type) {
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
          logger.debug(`Scanning file: ${fullPath} for ${type}`);
          await parseFileForElements(fullPath, relPath, resultMap, type);
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

// Parse file per estrarre variabili/semafori/label
async function parseFileForElements(filePath, fileName, resultMap, type) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    let currentScript = null;
    let scriptStartLine = 0; // Linea di inizio dello script corrente
    let scriptsFound = 0;
    let missionsFound = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Traccia script corrente
      if (line.startsWith('SCRIPT ')) {
        currentScript = line.replace('SCRIPT ', '').trim();
        scriptStartLine = i; // Memorizza la linea di inizio dello script
        scriptsFound++;
      } else if (line.startsWith('MISSION ')) {
        currentScript = line.replace('MISSION ', '').trim();
        scriptStartLine = i; // Memorizza la linea di inizio della mission
        missionsFound++;
      } else if (line === 'END_OF_SCRIPT' || line === 'END_OF_MISSION') {
        currentScript = null;
        scriptStartLine = 0;
      }
      
      // Se non siamo in uno script/mission, salta
      if (!currentScript) continue;
      
      // Non considerare le seguenti righe come fine dello script/mission
      // perché sono sotto-blocchi delle mission
      const missionSubBlocks = [
        'INIT_BUILD', 'START_BUILDING', 'END_BUILDING',
        'INIT_FLIGHT', 'START_FLIGHT', 'EVALUATE_FLIGHT', 'END_FLIGHT',
        'FINISH_MISSION'
      ];
      
      if (missionSubBlocks.includes(line)) {
        // Siamo ancora dentro la mission, continua a processare
      }
      
      // Estrai elementi basati su tipo
      if (type === 'variables') {
        extractVariablesFromLine(line, currentScript, resultMap);
        // Log per debug solo per variabili e comandi ADD
        if (line.trim().toUpperCase().includes('ADD ')) {
          logger.info(`Line with ADD found: "${line}" in script ${currentScript}`);
        }
      } else if (type === 'semaphores') {
        extractSemaphores(line, currentScript, resultMap);
      } else if (type === 'labels') {
        extractLabelsFromLine(line, currentScript, resultMap, fileName);
        
        // Aggiorna numero di linea per label e GO (relativo all'inizio dello script)
        const upperLine = line.toUpperCase().trim();
        if (upperLine.startsWith('LABEL ')) {
          const labelName = line.trim().split(' ')[1];
          const labelKey = `${currentScript}::${labelName}`;
          if (labelName && resultMap.has(labelKey)) {
            // Linea relativa all'inizio dello script (1-based)
            resultMap.get(labelKey).posizione_definizione.linea = i - scriptStartLine + 1;
          }
        } else if (upperLine.startsWith('GO ')) {
          const labelName = line.trim().split(' ')[1];
          const labelKey = `${currentScript}::${labelName}`;
          if (labelName && resultMap.has(labelKey)) {
            const data = resultMap.get(labelKey);
            const lastRef = data.riferimenti[data.riferimenti.length - 1];
            if (lastRef && lastRef.linea === null) {
              // Linea relativa all'inizio dello script (1-based)
              lastRef.linea = i - scriptStartLine + 1;
            }
          }
        }
      }
    }
    
    if (scriptsFound > 0 || missionsFound > 0) {
      logger.info(`Parsed ${filePath}: found ${scriptsFound} scripts, ${missionsFound} missions`);
    }
  } catch (error) {
    logger.warn(`Cannot parse file ${filePath}: ${error.message}`);
  }
}

// Estrai variabili numeriche
function extractVariablesFromLine(line, scriptName, variableMap) {
  const trimmedLine = line.trim();
  const upperLine = trimmedLine.toUpperCase();
  let variableName = null;
  let operation = null;
  let value = null;
  
  // SET_TO <variabile> <valore>
  if (upperLine.startsWith('SET_TO ')) {
    const parts = trimmedLine.split(/\s+/);
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'SET_TO';
      value = parseInt(parts[2]) || 0;
    }
  }
  // ADD <variabile> <valore>
  else if (upperLine.startsWith('ADD ')) {
    const parts = trimmedLine.split(/\s+/);
    logger.info(`Parsing ADD command: parts = ${JSON.stringify(parts)}, trimmedLine = "${trimmedLine}"`);
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'ADD';
      value = parseInt(parts[2]) || 0;
    }
  }
  // IF_IS <variabile> <valore>
  else if (upperLine.startsWith('IF_IS ')) {
    const parts = trimmedLine.split(/\s+/);
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'IF_IS';
      value = parseInt(parts[2]) || 0;
    }
  }
  // IF_MIN <variabile> <valore>
  else if (upperLine.startsWith('IF_MIN ')) {
    const parts = trimmedLine.split(/\s+/);
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'IF_MIN';
      value = parseInt(parts[2]) || 0;
    }
  }
  // IF_MAX <variabile> <valore>
  else if (upperLine.startsWith('IF_MAX ')) {
    const parts = trimmedLine.split(/\s+/);
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'IF_MAX';
      value = parseInt(parts[2]) || 0;
    }
  }
  // RESET viene ignorato perché può essere usato sia per semafori che variabili
  
  if (variableName && operation) {
    logger.info(`Found variable: ${variableName} with operation ${operation} in script ${scriptName}`);
    if (!variableMap.has(variableName)) {
      variableMap.set(variableName, {
        scripts: new Set(),
        count: 0,
        operations: {},
        values: new Set()
      });
    }
    
    const data = variableMap.get(variableName);
    data.scripts.add(scriptName);
    data.count++;
    data.operations[operation] = (data.operations[operation] || 0) + 1;
    if (value !== null) {
      data.values.add(value);
    }
  }
}

// API 4: Lista semafori con scansione ricorsiva campaign
router.get('/semaphores', async (req, res) => {
  try {
    logger.info('API call: GET /api/scripts/semaphores - Scansione ricorsiva ./campaign/**/*.txt');
    
    // Prima raccogli tutte le variabili
    const variableMap = new Map();
    await scanCampaignFiles(variableMap, 'variables');
    const variableNames = new Set(variableMap.keys());
    logger.info(`Found ${variableNames.size} variables to exclude from semaphores`);
    
    // Poi raccogli i semafori
    const semaphoreMap = new Map();
    await scanCampaignFiles(semaphoreMap, 'semaphores');
    
    // Rimuovi le variabili dai semafori
    for (const varName of variableNames) {
      if (semaphoreMap.has(varName)) {
        logger.info(`Excluding '${varName}' from semaphores (it's a variable)`);
        semaphoreMap.delete(varName);
      }
    }
    
    // Converti mappa in array
    const result = Array.from(semaphoreMap.entries()).map(([nomesemaforo, data]) => {
      // Calcola stato finale probabile (RESET non viene più tracciato)
      const setCount = data.operations.SET || 0;
      const stato_finale_probabile = setCount > 0 ? 'SET' : 'UNKNOWN';
      
      return {
        nomesemaforo,
        listascriptchelousano: Array.from(data.scripts),
        tipo: 'booleano',
        utilizzi_totali: data.count,
        operazioni: data.operations,
        stato_finale_probabile
      };
    }).sort((a, b) => a.nomesemaforo.localeCompare(b.nomesemaforo));
    
    logger.info(`Found ${result.length} unique semaphores from campaign files`);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    logger.error(`Error retrieving semaphores: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve semaphores',
      message: error.message 
    });
  }
});

// Estrai semafori booleani
function extractSemaphores(line, scriptName, semaphoreMap) {
  const upperLine = line.toUpperCase().trim();
  let semaphoreName = null;
  let operation = null;
  
  // SET <semaforo>
  if (upperLine.startsWith('SET ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2) {
      semaphoreName = parts[1];
      operation = 'SET';
    }
  }
  // RESET viene ignorato perché può essere usato sia per semafori (false) che variabili (0)
  // // RESET <semaforo>
  // else if (upperLine.startsWith('RESET ')) {
  //   const parts = line.trim().split(' ');
  //   if (parts.length >= 2) {
  //     semaphoreName = parts[1];
  //     operation = 'RESET';
  //   }
  // }
  // IF <semaforo>
  else if (upperLine.startsWith('IF ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2 && !parts[1].includes('_')) { // Escludi IF_IS, IF_MIN, etc.
      semaphoreName = parts[1];
      operation = 'IF';
    }
  }
  // IFNOT <semaforo>
  else if (upperLine.startsWith('IFNOT ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2) {
      semaphoreName = parts[1];
      operation = 'IFNOT';
    }
  }
  // OPT_IF <semaforo> "<testo>"
  else if (upperLine.startsWith('OPT_IF ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2) {
      semaphoreName = parts[1];
      operation = 'OPT_IF';
    }
  }
  // OPT_IFNOT <semaforo> "<testo>"
  else if (upperLine.startsWith('OPT_IFNOT ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2) {
      semaphoreName = parts[1];
      operation = 'OPT_IFNOT';
    }
  }
  
  if (semaphoreName && operation) {
    if (!semaphoreMap.has(semaphoreName)) {
      semaphoreMap.set(semaphoreName, {
        scripts: new Set(),
        count: 0,
        operations: {}
      });
    }
    
    const data = semaphoreMap.get(semaphoreName);
    data.scripts.add(scriptName);
    data.count++;
    data.operations[operation] = (data.operations[operation] || 0) + 1;
  }
}

// API 5: Lista label con scansione ricorsiva campaign
router.get('/labels', async (req, res) => {
  try {
    logger.info('API call: GET /api/scripts/labels - Scansione ricorsiva ./campaign/**/*.txt');
    
    const labelMap = new Map();
    
    // Scansiona ricorsivamente tutti i file .txt in ./campaign
    await scanCampaignFiles(labelMap, 'labels');
    
    // Converti mappa in array
    const result = Array.from(labelMap.entries()).map(([labelKey, data]) => ({
      nomelabel: data.nomelabel,
      scriptancoraggio: data.scriptancoraggio,
      utilizzi_totali: data.riferimenti.length,
      posizione_definizione: data.posizione_definizione,
      riferimenti: data.riferimenti
    })).sort((a, b) => {
      // Ordina prima per script, poi per label
      if (a.scriptancoraggio !== b.scriptancoraggio) {
        return a.scriptancoraggio.localeCompare(b.scriptancoraggio);
      }
      return a.nomelabel.localeCompare(b.nomelabel);
    });
    
    logger.info(`Found ${result.length} unique labels from campaign files`);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    logger.error(`Error retrieving labels: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve labels',
      message: error.message 
    });
  }
});

// Estrai label e riferimenti GO
function extractLabelsFromLine(line, scriptName, labelMap, fileName) {
  const upperLine = line.toUpperCase().trim();
  
  // LABEL <nome>
  if (upperLine.startsWith('LABEL ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2) {
      const labelName = parts[1];
      const labelKey = `${scriptName}::${labelName}`; // Chiave unica per script + label
      
      if (!labelMap.has(labelKey)) {
        labelMap.set(labelKey, {
          nomelabel: labelName,
          scriptancoraggio: scriptName,
          posizione_definizione: {
            file: fileName,
            linea: null // Sarà impostato dal chiamante
          },
          riferimenti: []
        });
      }
    }
  }
  // GO <label>
  else if (upperLine.startsWith('GO ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2) {
      const labelName = parts[1];
      const labelKey = `${scriptName}::${labelName}`; // Chiave unica per script + label
      
      // Crea entry se non esiste (GO prima di LABEL)
      if (!labelMap.has(labelKey)) {
        labelMap.set(labelKey, {
          nomelabel: labelName,
          scriptancoraggio: scriptName,
          posizione_definizione: {
            file: fileName,
            linea: null
          },
          riferimenti: []
        });
      }
      
      // Aggiungi riferimento
      const data = labelMap.get(labelKey);
      data.riferimenti.push({
        linea: null, // Sarà impostato dal chiamante
        comando: line.trim()
      });
    }
  }
}

// API 10: Lista scripts secondo specifica con analisi collegamenti completa
router.get('/', async (req, res) => {
  try {
    logger.info('API call: GET /api/scripts - Lista script con stellato e collegamenti completi');
    
    const scripts = [];
    const languages = SUPPORTED_LANGUAGES;
    const allScriptsData = new Map();
    
    // 1. Scansiona tutti i file script multilingua
    for (const lang of languages) {
      const scriptsPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`);
      
      if (await fs.pathExists(scriptsPath)) {
        try {
          const files = await fs.readdir(scriptsPath);
          const txtFiles = files.filter(f => f.endsWith('.txt'));
          
          for (const fileName of txtFiles) {
            const filePath = path.join(scriptsPath, fileName);
            await parseScriptFileForAPI10(filePath, fileName, lang, allScriptsData);
          }
        } catch (error) {
          logger.warn(`Error scanning scripts for ${lang}: ${error.message}`);
        }
      }
    }
    
    // 2. Costruisce grafo collegamenti bidirezionale
    const scriptConnections = buildScriptConnectionGraph(allScriptsData);
    
    // 3. Determina script stellati dai bottoni (riuso logica API 9)
    const { stellatedScripts, allButtons } = await getStellatedScriptsAndButtons();
    
    // 4. Costruisce risultato finale per ogni script
    for (const [scriptName, scriptData] of allScriptsData.entries()) {
      const connections = scriptConnections.get(scriptName) || {
        script_richiamati: [],
        missions_richiamate: [],
        richiamato_da_script: [],
        richiamato_da_missions: []
      };
      
      // Trova bottoni collegati
      const bottoni_collegati = allButtons
        .filter(b => b.script === scriptName)
        .map(b => ({
          buttonId: b.id,
          sourceId: b.sourceId,
          tipo: b.tipo
        }));
      
      // Determina filename dal primo linguaggio disponibile
      const firstLang = scriptData.languages[0];
      const nomefile = scriptData.fileNames[firstLang] || 'unknown.txt';
      
      // Prende conteggi dalla lingua EN se disponibile, altrimenti prima disponibile
      const refLang = scriptData.languages.includes('EN') ? 'EN' : scriptData.languages[0];
      const numero_comandi = scriptData.commandCounts[refLang] || 0;
      const numero_blocchi = Math.ceil(numero_comandi / 3); // Stima approssimativa
      
      scripts.push({
        nomescript: scriptName,
        nomefile: nomefile,
        numero_blocchi: numero_blocchi,
        numero_comandi: numero_comandi,
        stellato: stellatedScripts.has(scriptName),
        languages: scriptData.languages,
        bottoni_collegati: bottoni_collegati,
        script_richiamati: connections.script_richiamati,
        missions_richiamate: connections.missions_richiamate,
        richiamato_da_script: connections.richiamato_da_script,
        richiamato_da_missions: connections.richiamato_da_missions,
        comandi_richiamo: Array.from(scriptData.comandiRichiamo || []),
        utilizzi_totali: (connections.richiamato_da_script.length + connections.richiamato_da_missions.length + bottoni_collegati.length),
        variabili_utilizzate: Array.from(scriptData.variabili || []),
        personaggi_utilizzati: Array.from(scriptData.personaggi || []),
        labels_definite: Array.from(scriptData.labels || []),
        nodi_referenziati: Array.from(scriptData.nodi || [])
      });
    }
    
    // Ordina per nome
    scripts.sort((a, b) => a.nomescript.localeCompare(b.nomescript));
    
    logger.info(`Found ${scripts.length} scripts (${scripts.filter(s => s.stellato).length} stellated)`);
    
    res.json({
      success: true,
      data: scripts,
      count: scripts.length
    });
  } catch (error) {
    logger.error(`Error retrieving scripts: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve scripts',
      message: error.message 
    });
  }
});

// Parse file script per API 10
async function parseScriptFileForAPI10(filePath, fileName, language, allScriptsData) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    let currentScript = null;
    let commandCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Traccia script corrente
      if (line.startsWith('SCRIPT ')) {
        currentScript = line.replace('SCRIPT ', '').trim();
        commandCount = 0;
        
        if (!allScriptsData.has(currentScript)) {
          allScriptsData.set(currentScript, {
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
        
        const scriptData = allScriptsData.get(currentScript);
        if (!scriptData.languages.includes(language)) {
          scriptData.languages.push(language);
        }
        scriptData.fileNames[language] = fileName;
        
      } else if (line === 'END_OF_SCRIPT') {
        if (currentScript) {
          const scriptData = allScriptsData.get(currentScript);
          scriptData.commandCounts[language] = commandCount;
          currentScript = null;
        }
      } else if (currentScript && line.length > 0 && !line.startsWith('//')) {
        commandCount++;
        
        const scriptData = allScriptsData.get(currentScript);
        const upperLine = line.toUpperCase().trim();
        
        // Analizza comandi per estrarre collegamenti e elementi
        analyzeScriptCommand(line, upperLine, scriptData);
      }
    }
  } catch (error) {
    logger.warn(`Cannot parse script file ${filePath}: ${error.message}`);
  }
}

// Analizza comando script per estrarre collegamenti
function analyzeScriptCommand(line, upperLine, scriptData) {
  const parts = line.trim().split(' ');
  
  // SUB_SCRIPT richiami
  if (upperLine.startsWith('SUB_SCRIPT ') && parts.length >= 2) {
    scriptData.scriptRichiamati.add(parts[1]);
    scriptData.comandiRichiamo.add('SUB_SCRIPT');
  }
  
  // ACT_MISSION richiami
  if (upperLine.startsWith('ACT_MISSION ') && parts.length >= 2) {
    scriptData.missionsRichiamate.add(parts[1]);
    scriptData.comandiRichiamo.add('ACT_MISSION');
  }
  
  // Variabili
  if (upperLine.startsWith('SET_TO ') || upperLine.startsWith('ADD ') || 
      upperLine.startsWith('IF_IS ') || upperLine.startsWith('IF_MIN ') || 
      upperLine.startsWith('IF_MAX ')) {
    if (parts.length >= 2) {
      scriptData.variabili.add(parts[1]);
    }
  }
  
  // Semafori (anche se tecnicamente sono variabili booleane)
  if (upperLine.startsWith('SET ') || upperLine.startsWith('RESET ') || 
      upperLine.startsWith('IF ') || upperLine.startsWith('IFNOT ')) {
    if (parts.length >= 2 && !parts[1].includes('_')) {
      scriptData.variabili.add(parts[1]);
    }
  }
  
  // Personaggi
  if (upperLine.startsWith('SHOWCHAR ') || upperLine.startsWith('HIDECHAR ') || 
      upperLine.startsWith('CHANGECHAR ') || upperLine.startsWith('SAYCHAR ') || 
      upperLine.startsWith('ASKCHAR ')) {
    if (parts.length >= 2) {
      scriptData.personaggi.add(parts[1]);
    }
  }
  
  // Labels
  if (upperLine.startsWith('LABEL ') && parts.length >= 2) {
    scriptData.labels.add(parts[1]);
  }
  
  // Nodi
  if (upperLine.startsWith('SHOWNODE ') || upperLine.startsWith('HIDENODE ') || 
      upperLine.startsWith('CENTERMAPBYNODE ') || upperLine.startsWith('MOVEPLAYERTONODE ')) {
    if (parts.length >= 2) {
      scriptData.nodi.add(parts[1]);
    }
  }
}

// Costruisce grafo collegamenti bidirezionale
function buildScriptConnectionGraph(allScriptsData) {
  const connections = new Map();
  
  // Inizializza connections per ogni script
  for (const scriptName of allScriptsData.keys()) {
    connections.set(scriptName, {
      script_richiamati: [],
      missions_richiamate: [],
      richiamato_da_script: [],
      richiamato_da_missions: []
    });
  }
  
  // Costruisce collegamenti bidirezionali
  for (const [scriptName, scriptData] of allScriptsData.entries()) {
    const conn = connections.get(scriptName);
    
    // Script richiamati da questo script
    conn.script_richiamati = Array.from(scriptData.scriptRichiamati);
    conn.missions_richiamate = Array.from(scriptData.missionsRichiamate);
    
    // Aggiorna collegamenti inversi
    for (const targetScript of scriptData.scriptRichiamati) {
      if (connections.has(targetScript)) {
        connections.get(targetScript).richiamato_da_script.push(scriptName);
      }
    }
    
    for (const targetMission of scriptData.missionsRichiamate) {
      if (connections.has(targetMission)) {
        connections.get(targetMission).richiamato_da_missions.push(scriptName);
      }
    }
  }
  
  return connections;
}

// Funzione parsing script singola lingua con blocchi completi
async function parseScriptSingleLanguage(scriptName, language, format) {
  try {
    // Carica file script per la lingua specifica
    const scriptPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${language}`);
    
    if (!await fs.pathExists(scriptPath)) {
      return null;
    }
    
    // Cerca file contenente lo script
    const files = await fs.readdir(scriptPath);
    const txtFiles = files.filter(f => f.endsWith('.txt'));
    
    let scriptFound = null;
    let scriptLines = [];
    let fileName = '';
    
    for (const file of txtFiles) {
      const filePath = path.join(scriptPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      let lines = content.split('\n');
      
      // Rimuovi SCRIPTS all'inizio e END_OF_SCRIPTS alla fine del file
      if (lines.length > 0 && lines[0].trim() === 'SCRIPTS') {
        lines = lines.slice(1);
      }
      if (lines.length > 0 && lines[lines.length - 1].trim() === 'END_OF_SCRIPTS') {
        lines = lines.slice(0, -1);
      }
      
      let currentScript = null;
      let scriptStartIndex = -1;
      let scriptEndIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('SCRIPT ')) {
          currentScript = line.replace('SCRIPT ', '').trim();
          if (currentScript === scriptName) {
            scriptStartIndex = i;
            fileName = file;
          }
        } else if (line === 'END_OF_SCRIPT' && currentScript === scriptName) {
          scriptEndIndex = i;
          break;
        }
      }
      
      if (scriptStartIndex >= 0 && scriptEndIndex >= 0) {
        scriptLines = lines.slice(scriptStartIndex, scriptEndIndex + 1);
        scriptFound = true;
        break;
      }
    }
    
    if (!scriptFound) {
      return null;
    }
    
    // Parsing base con metadata
    const result = {
      name: scriptName,
      fileName: fileName,
      language: language,
      originalCode: scriptLines.join('\n'),
      lineCount: scriptLines.length
    };
    
    if (format === 'blocks') {
      // Parsing completo a blocchi
      try {
        const parseResult = parseScriptToBlocks(scriptLines, language);
        
        result.blocks = parseResult.blocks;
        result.metadata = {
          blockCount: parseResult.blocks.length,
          errorCount: parseResult.errors.length,
          commandCount: countCommands(parseResult.blocks),
          variableCount: countVariables(parseResult.blocks),
          characterCount: countCharacters(parseResult.blocks),
          labelCount: countLabels(parseResult.blocks)
        };
        
        if (parseResult.errors.length > 0) {
          result.parseErrors = parseResult.errors;
        }
        
      } catch (parseError) {
        logger.error(`Error parsing script ${scriptName} to blocks: ${parseError.message}`);
        result.error = `PARSE - ${parseError.message}`;
        result.blocks = [];
        result.metadata = { blockCount: 0, errorCount: 1 };
      }
    } else {
      // Formato raw - solo codice originale
      result.rawCommands = scriptLines.filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('//');
      });
      result.metadata = {
        commandCount: result.rawCommands.length
      };
    }
    
    return result;
    
  } catch (error) {
    logger.error(`Error parsing single language script ${scriptName}: ${error.message}`);
    throw error;
  }
}

// Funzione parsing script multilingua con merge
async function parseScriptMultilingual(scriptName, format) {
  try {
    const languages = SUPPORTED_LANGUAGES;
    const parsedScripts = {};
    let referenceScript = null;
    
    // 1. Parse ogni lingua separatamente
    for (const lang of languages) {
      const scriptData = await parseScriptSingleLanguage(scriptName, lang, format);
      if (scriptData) {
        parsedScripts[lang] = scriptData;
        if (lang === 'EN') {
          referenceScript = scriptData;
        }
      }
    }
    
    if (!referenceScript) {
      // Usa la prima lingua disponibile come riferimento
      const availableLanguages = Object.keys(parsedScripts);
      if (availableLanguages.length === 0) {
        return null;
      }
      referenceScript = parsedScripts[availableLanguages[0]];
    }
    
    // 2. Merge multilingua se formato blocchi
    if (format === 'blocks') {
      try {
        const mergedResult = mergeMultilingualBlocks(parsedScripts, referenceScript);
        return mergedResult;
      } catch (mergeError) {
        logger.error(`Error merging multilingual script ${scriptName}: ${mergeError.message}`);
        // Fallback: restituisci solo inglese con errore
        referenceScript.error = `ML - ${mergeError.message}`;
        return referenceScript;
      }
    } else {
      // Formato raw: aggiungi solo info multilingua
      referenceScript.availableLanguages = Object.keys(parsedScripts);
      referenceScript.multilingualVersions = parsedScripts;
      return referenceScript;
    }
    
  } catch (error) {
    logger.error(`Error parsing multilingual script ${scriptName}: ${error.message}`);
    throw error;
  }
}

// Merge blocchi multilingua
function mergeMultilingualBlocks(parsedScripts, referenceScript) {
  const languages = Object.keys(parsedScripts);
  const result = { ...referenceScript };
  
  // Controlla struttura consistente
  for (const lang of languages) {
    if (lang === 'EN') continue;
    
    const otherScript = parsedScripts[lang];
    const structureMatch = compareBlockStructures(referenceScript.blocks, otherScript.blocks);
    
    if (!structureMatch.isMatch) {
      throw new Error(`Structure mismatch between EN and ${lang} at ${structureMatch.mismatchLocation}`);
    }
  }
  
  // Merge testi multilingua
  result.blocks = mergeBlocksTextContent(result.blocks, parsedScripts, []);
  result.availableLanguages = languages;
  result.multilingualMerged = true;
  
  return result;
}

// Confronta strutture blocchi tra lingue
function compareBlockStructures(blocks1, blocks2) {
  if (blocks1.length !== blocks2.length) {
    return { isMatch: false, mismatchLocation: 'block count differs' };
  }
  
  for (let i = 0; i < blocks1.length; i++) {
    const block1 = blocks1[i];
    const block2 = blocks2[i];
    
    if (block1.type !== block2.type) {
      return { isMatch: false, mismatchLocation: `block ${i}: type differs (${block1.type} vs ${block2.type})` };
    }
    
    // Controllo ricorsivo per blocchi con children
    if (block1.children && block2.children) {
      const childMatch = compareBlockStructures(block1.children, block2.children);
      if (!childMatch.isMatch) {
        return { isMatch: false, mismatchLocation: `block ${i}.children: ${childMatch.mismatchLocation}` };
      }
    }
    
    // Controllo branch ELSE per IF
    if (block1.elseBranch && block2.elseBranch) {
      const elseMatch = compareBlockStructures(block1.elseBranch, block2.elseBranch);
      if (!elseMatch.isMatch) {
        return { isMatch: false, mismatchLocation: `block ${i}.elseBranch: ${elseMatch.mismatchLocation}` };
      }
    }
  }
  
  return { isMatch: true };
}

// Merge contenuto testuale multilingua nei blocchi
function mergeBlocksTextContent(blocks, parsedScripts, path = []) {
  return blocks.map((block, index) => {
    const mergedBlock = { ...block };
    
    // Merge campi specifici per OPT dalle altre lingue
    if (block.type === 'OPT') {
      // Assicurati che optType e condition siano preservati dall'originale
      if (block.optType && !mergedBlock.optType) {
        mergedBlock.optType = block.optType;
      }
      if (block.condition && !mergedBlock.condition) {
        mergedBlock.condition = block.condition;
      }
      
      // Se mancano ancora, prendili dalle altre lingue
      if (!mergedBlock.optType || !mergedBlock.condition) {
        for (const [lang, scriptData] of Object.entries(parsedScripts)) {
          // Naviga al blocco corrispondente seguendo il path
          let correspondingBlocks = scriptData.blocks;
          for (const pathStep of path) {
            if (correspondingBlocks && correspondingBlocks[pathStep.index] && correspondingBlocks[pathStep.index][pathStep.prop]) {
              correspondingBlocks = correspondingBlocks[pathStep.index][pathStep.prop];
            } else {
              correspondingBlocks = null;
              break;
            }
          }
          
          // Prendi il blocco all'indice corrente
          const correspondingBlock = correspondingBlocks ? correspondingBlocks[index] : null;
          
          // PATCH SPECIFICO per OPT con SET merchAlienQuestion che ha testo vuoto in EN
          if (correspondingBlock && correspondingBlock.type === 'OPT' && 
              correspondingBlock.children && correspondingBlock.children.some(child => 
                child.type === 'SET' && child.parameters && child.parameters.semaphore === 'merchAlienQuestion')) {
            // Se questo OPT ha optType e condition ma il merged non li ha, forzali
            if (correspondingBlock.optType && !mergedBlock.optType) {
              mergedBlock.optType = correspondingBlock.optType;
            }
            if (correspondingBlock.condition && !mergedBlock.condition) {
              mergedBlock.condition = correspondingBlock.condition;
            }
            // Se manca il testo multilingua, copialo
            if (correspondingBlock.text && (!mergedBlock.text || typeof mergedBlock.text === 'undefined')) {
              mergedBlock.text = correspondingBlock.text;
            }
          }
          
          if (correspondingBlock && correspondingBlock.type === 'OPT') {
            if (!mergedBlock.optType && correspondingBlock.optType) {
              mergedBlock.optType = correspondingBlock.optType;
            }
            if (!mergedBlock.condition && correspondingBlock.condition) {
              mergedBlock.condition = correspondingBlock.condition;
            }
            
            // Se abbiamo trovato entrambi, possiamo fermarci
            if (mergedBlock.optType && mergedBlock.condition) {
              break;
            }
          }
        }
      }
      
      // Fallback finale se manca ancora optType - GARANTISCE che tutte le OPT abbiano optType
      if (!mergedBlock.optType) {
        if (mergedBlock.condition) {
          mergedBlock.optType = 'OPT_CONDITIONAL';
        } else {
          mergedBlock.optType = 'OPT_SIMPLE';
        }
      }
      
    } else {
      // Aggiungi optType anche per OPT che non sono nel blocco IF sopra
      if (mergedBlock.type === 'OPT' && !mergedBlock.optType) {
        mergedBlock.optType = mergedBlock.condition ? 'OPT_CONDITIONAL' : 'OPT_SIMPLE';
      }
    }
    
    // Merge campo 'text' per OPT (che è direttamente sul blocco, non in parameters)
    if (mergedBlock.text) {
      // Se il text è già un oggetto multilingua (EN: "..."), mantieni la struttura
      if (typeof mergedBlock.text === 'object' && mergedBlock.text !== null && !Array.isArray(mergedBlock.text)) {
        const mergedText = { ...mergedBlock.text };
        
        for (const [lang, scriptData] of Object.entries(parsedScripts)) {
          if (lang === 'EN') continue;
          
          // Naviga al blocco corrispondente seguendo il path
          let correspondingBlocks = scriptData.blocks;
          for (const pathStep of path) {
            if (correspondingBlocks && correspondingBlocks[pathStep.index] && correspondingBlocks[pathStep.index][pathStep.prop]) {
              correspondingBlocks = correspondingBlocks[pathStep.index][pathStep.prop];
            } else {
              correspondingBlocks = null;
              break;
            }
          }
          
          // Ora prendi il blocco all'indice corrente
          const correspondingBlock = correspondingBlocks ? correspondingBlocks[index] : null;
          
          if (correspondingBlock && correspondingBlock.text) {
            if (typeof correspondingBlock.text === 'object' && correspondingBlock.text !== null) {
              // Prende il valore dalla lingua corrente (ogni script ha una sola chiave lingua)
              const langValues = Object.values(correspondingBlock.text);
              if (langValues.length > 0) {
                mergedText[lang] = langValues[0];
              }
            } else if (typeof correspondingBlock.text === 'string') {
              // Se è una stringa, la lingua è quella dello script
              mergedText[lang] = correspondingBlock.text;
            }
          }
        }
        
        mergedBlock.text = mergedText;
      } else if (typeof mergedBlock.text === 'string') {
        // Se il text è una stringa semplice, crea l'oggetto multilingua
        const mergedText = { EN: mergedBlock.text };
        
        for (const [lang, scriptData] of Object.entries(parsedScripts)) {
          if (lang === 'EN') continue;
          
          // Naviga al blocco corrispondente seguendo il path
          let correspondingBlocks = scriptData.blocks;
          for (const pathStep of path) {
            if (correspondingBlocks && correspondingBlocks[pathStep.index] && correspondingBlocks[pathStep.index][pathStep.prop]) {
              correspondingBlocks = correspondingBlocks[pathStep.index][pathStep.prop];
            } else {
              correspondingBlocks = null;
              break;
            }
          }
          
          // Ora prendi il blocco all'indice corrente
          const correspondingBlock = correspondingBlocks ? correspondingBlocks[index] : null;
          
          
          if (correspondingBlock && correspondingBlock.text && typeof correspondingBlock.text === 'string') {
            mergedText[lang] = correspondingBlock.text;
          }
        }
        
        mergedBlock.text = mergedText;
      }
    }

    // Merge parametri multilingua
    if (mergedBlock.parameters) {
      for (const [paramName, paramValue] of Object.entries(mergedBlock.parameters)) {
        if (typeof paramValue === 'object' && paramValue !== null && !Array.isArray(paramValue)) {
          // È un oggetto multilingua - merge con altre lingue
          const mergedParam = { ...paramValue };
          
          for (const [lang, scriptData] of Object.entries(parsedScripts)) {
            if (lang === 'EN') continue;
            
            // Naviga al blocco corrispondente seguendo il path
            let correspondingBlocks = scriptData.blocks;
            for (const pathStep of path) {
              if (correspondingBlocks && correspondingBlocks[pathStep.index] && correspondingBlocks[pathStep.index][pathStep.prop]) {
                correspondingBlocks = correspondingBlocks[pathStep.index][pathStep.prop];
              } else {
                correspondingBlocks = null;
                break;
              }
            }
            
            // Ora prendi il blocco all'indice corrente
            const correspondingBlock = correspondingBlocks ? correspondingBlocks[index] : null;
            
            if (correspondingBlock && correspondingBlock.parameters && correspondingBlock.parameters[paramName]) {
              const otherLangValue = correspondingBlock.parameters[paramName];
              if (typeof otherLangValue === 'object' && otherLangValue !== null) {
                // Prende il valore dalla lingua corrente (ogni script ha una sola chiave lingua)
                const langValues = Object.values(otherLangValue);
                if (langValues.length > 0) {
                  mergedParam[lang] = langValues[0];
                }
              }
            }
          }
          
          mergedBlock.parameters[paramName] = mergedParam;
        }
      }
    }
    
    // Merge ricorsivo per children
    if (mergedBlock.children) {
      const childPath = [...path, { prop: 'children', index }];
      mergedBlock.children = mergeBlocksTextContent(mergedBlock.children, parsedScripts, childPath);
    }
    
    // Merge ricorsivo per thenBranch (legacy)
    if (mergedBlock.thenBranch) {
      const thenPath = [...path, { prop: 'thenBranch', index }];
      mergedBlock.thenBranch = mergeBlocksTextContent(mergedBlock.thenBranch, parsedScripts, thenPath);
    }
    
    // Merge ricorsivo per elseBranch (legacy)
    if (mergedBlock.elseBranch) {
      const elsePath = [...path, { prop: 'elseBranch', index }];
      mergedBlock.elseBranch = mergeBlocksTextContent(mergedBlock.elseBranch, parsedScripts, elsePath);
    }
    
    // Merge ricorsivo per thenBlocks (nuovo formato IF)
    if (mergedBlock.thenBlocks) {
      const thenPath = [...path, { prop: 'thenBlocks', index }];
      mergedBlock.thenBlocks = mergeBlocksTextContent(mergedBlock.thenBlocks, parsedScripts, thenPath);
    }
    
    // Merge ricorsivo per elseBlocks (nuovo formato IF)
    if (mergedBlock.elseBlocks) {
      const elsePath = [...path, { prop: 'elseBlocks', index }];
      mergedBlock.elseBlocks = mergeBlocksTextContent(mergedBlock.elseBlocks, parsedScripts, elsePath);
    }
    
    return mergedBlock;
  });
}

// Trova blocco corrispondente in altra lingua
function findCorrespondingBlock(blocks, targetBlock, index) {
  if (index < blocks.length) {
    return blocks[index];
  }
  return null;
}

// Contatori per metadata
function countCommands(blocks) {
  let count = 0;
  for (const block of blocks) {
    if (block.type && !['SCRIPT', 'MISSION', 'IF', 'MENU', 'OPT', 'BUILD', 'FLIGHT'].includes(block.type)) {
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
  }
  return count;
}

function countVariables(blocks) {
  const variables = new Set();
  extractVariables(blocks, variables);
  return variables.size;
}

function countCharacters(blocks) {
  const characters = new Set();
  extractCharacters(blocks, characters);
  return characters.size;
}

function countLabels(blocks) {
  const labels = new Set();
  extractLabels(blocks, labels);
  return labels.size;
}

function extractVariables(blocks, variables) {
  for (const block of blocks) {
    if (block.parameters) {
      // Cerca parametri variabile
      if (block.type === 'SET_TO' || block.type === 'ADD' || block.type === 'IF_IS' || 
          block.type === 'IF_MIN' || block.type === 'IF_MAX') {
        if (block.parameters.variable) {
          variables.add(block.parameters.variable);
        }
      }
    }
    
    // Controlla anche i campi diretti per i blocchi IF
    if (block.type === 'IF' && block.variabile) {
      variables.add(block.variabile);
    }
    
    if (block.children) {
      extractVariables(block.children, variables);
    }
    if (block.elseBranch) {
      extractVariables(block.elseBranch, variables);
    }
    if (block.thenBlocks) {
      extractVariables(block.thenBlocks, variables);
    }
    if (block.elseBlocks) {
      extractVariables(block.elseBlocks, variables);
    }
  }
}

function extractCharacters(blocks, characters) {
  for (const block of blocks) {
    if (block.parameters && block.parameters.character) {
      characters.add(block.parameters.character);
    }
    
    if (block.children) {
      extractCharacters(block.children, characters);
    }
    if (block.elseBranch) {
      extractCharacters(block.elseBranch, characters);
    }
    if (block.thenBlocks) {
      extractCharacters(block.thenBlocks, characters);
    }
    if (block.elseBlocks) {
      extractCharacters(block.elseBlocks, characters);
    }
  }
}

function extractLabels(blocks, labels) {
  for (const block of blocks) {
    if (block.type === 'LABEL' && block.parameters && block.parameters.name) {
      labels.add(block.parameters.name);
    }
    
    if (block.children) {
      extractLabels(block.children, labels);
    }
    if (block.elseBranch) {
      extractLabels(block.elseBranch, labels);
    }
    if (block.thenBlocks) {
      extractLabels(block.thenBlocks, labels);
    }
    if (block.elseBlocks) {
      extractLabels(block.elseBlocks, labels);
    }
  }
}

// API 11: Script specifico con parsing completo a blocchi
router.get('/:scriptName', async (req, res) => {
  try {
    const { scriptName } = req.params;
    const { lang = 'EN', format = 'blocks', multilingua = 'false' } = req.query;
    
    logger.info(`API call: GET /api/scripts/${scriptName}?lang=${lang}&format=${format}&multilingua=${multilingua}`);
    
    if (multilingua === 'true') {
      // GESTIONE MULTILINGUA COMPLETA
      const result = await parseScriptMultilingual(scriptName, format);
      
      res.json({
        success: true,
        data: result
      });
    } else {
      // GESTIONE SINGOLA LINGUA
      const result = await parseScriptSingleLanguage(scriptName, lang, format);
      
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: 'Script not found',
          scriptName 
        });
      }
      
      res.json({
        success: true,
        data: result
      });
    }
    
  } catch (error) {
    logger.error(`Error retrieving script ${req.params.scriptName}: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve script',
      message: error.message 
    });
  }
});

// API 14: Salvataggio script singolo o multiplo
router.post('/saveScript', async (req, res) => {
  try {
    const body = req.body;
    
    // Determina se è un singolo script o un array
    const isSingleScript = body.name && body.fileName && body.blocks;
    const scripts = isSingleScript ? [body] : body;
    
    logger.info(`API call: POST /api/scripts/saveScript - ${isSingleScript ? 'single' : 'multiple'} mode, ${scripts.length} script(s)`);
    
    // Validazione
    if (!Array.isArray(scripts) && !isSingleScript) {
      return res.status(400).json({ 
        success: false, 
        error: 'Body must be either a single script object or an array of script objects' 
      });
    }
    
    // Valida ogni script
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (!script.name || !script.fileName || !script.blocks) {
        return res.status(400).json({ 
          success: false, 
          error: `Script at index ${i} missing required parameters: name, fileName, blocks` 
        });
      }
      if (!Array.isArray(script.blocks)) {
        return res.status(400).json({ 
          success: false, 
          error: `Script at index ${i}: blocks must be an array` 
        });
      }
    }
    
    try {
      // Raggruppa gli script per fileName
      const scriptsByFile = {};
      for (const script of scripts) {
        if (!scriptsByFile[script.fileName]) {
          scriptsByFile[script.fileName] = [];
        }
        scriptsByFile[script.fileName].push(script);
      }
      
      // Risultati per ogni script processato
      const results = [];
      const fileResults = {};
      
      // Processa ogni file
      for (const [fileName, fileScripts] of Object.entries(scriptsByFile)) {
        
        // Verifica se i blocchi contengono dati multilingua
        const hasMultilingualData = checkForMultilingualData(fileScripts);
        
        if (hasMultilingualData) {
          // Modalità multilingua - genera un file per ogni lingua
          const languages = SUPPORTED_LANGUAGES;
          
          for (const lang of languages) {
            const filePath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`, fileName);
            await processFileForLanguage(filePath, fileScripts, lang, results);
          }
        } else {
          // Modalità singola lingua (default EN)
          const filePath = path.join(GAME_ROOT, 'campaign', 'campaignScriptsEN', fileName);
          await processFileForLanguage(filePath, fileScripts, 'EN', results);
        }
      }
      
      res.json({
        success: true,
        data: {
          mode: isSingleScript ? 'single' : 'multiple',
          totalScripts: scripts.length,
          filesModified: Object.keys(scriptsByFile).length,
          savedAt: new Date().toISOString(),
          fileResults: fileResults,
          scriptResults: results
        }
      });
      
    } catch (conversionError) {
      logger.error(`Error converting/saving script: ${conversionError.message}`);
      res.status(400).json({
        success: false,
        error: 'Failed to convert or save script',
        message: conversionError.message
      });
    }
    
  } catch (error) {
    logger.error(`Error in saveScript: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save script',
      message: error.message 
    });
  }
});

// API 14-OLD: Salvataggio script multilingua da JSON (mantenuta per compatibilità)
router.post('/:scriptName/save', async (req, res) => {
  try {
    const { scriptName } = req.params;
    const { languages = ['EN'], blocks, format = 'script', saveMode = 'multilingual' } = req.body;
    
    logger.info(`API call: POST /api/scripts/${scriptName}/save?languages=${languages.join(',')}&format=${format}&saveMode=${saveMode}`);
    
    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({ 
        success: false, 
        error: 'blocks array is required' 
      });
    }
    
    try {
      // SEMPRE usa il parser multilingua per supportare testi multilingua corretti
      const saveResults = await saveScriptMultilingual(scriptName, blocks, languages);
      
      res.json({
        success: true,
        data: {
          scriptName,
          saveMode: saveMode || 'multilingual',
          languagesProcessed: saveResults.languagesProcessed,
          filesGenerated: saveResults.filesGenerated,
          blockCount: blocks.length,
          savedAt: new Date().toISOString(),
          validation: saveResults.validation
        }
      });
      
    } catch (conversionError) {
      logger.error(`Error converting blocks to script: ${conversionError.message}`);
      res.status(400).json({
        success: false,
        error: 'Failed to convert blocks to script',
        message: conversionError.message
      });
    }
    
  } catch (error) {
    logger.error(`Error saving script ${req.params.scriptName}: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save script',
      message: error.message 
    });
  }
});

// Funzione per determinare script stellati e raccogliere bottoni
async function getStellatedScriptsAndButtons() {
  const stellatedScripts = new Set();
  const allButtons = [];
  
  try {
    // Implementa direttamente la logica per raccogliere bottoni
    const languages = SUPPORTED_LANGUAGES;
    
    // 1. Raccoglie bottoni dai nodi
    const nodesMap = {};
    for (const lang of languages) {
      const nodesPath = config.PATH_TEMPLATES.nodesYaml(lang);
      
      if (await fs.pathExists(nodesPath)) {
        try {
          const content = await fs.readFile(nodesPath, 'utf8');
          const nodesData = yaml.load(content);
          
          if (Array.isArray(nodesData)) {
            for (const nodeData of nodesData) {
              if (!nodeData.name) continue;
              
              const nodeName = nodeData.name;
              if (!nodesMap[nodeName]) {
                nodesMap[nodeName] = {
                  name: nodeName,
                  buttons: nodeData.buttons || [],
                  localizedCaptions: {}
                };
              }
              
              if (nodeData.caption) {
                nodesMap[nodeName].localizedCaptions[lang] = nodeData.caption;
              }
            }
          }
        } catch (error) {
          logger.warn(`Error loading nodes.yaml for ${lang}: ${error.message}`);
        }
      }
    }
    
    // Estrai bottoni dai nodi
    for (const [nodeName, nodeData] of Object.entries(nodesMap)) {
      if (Array.isArray(nodeData.buttons)) {
        for (const buttonDef of nodeData.buttons) {
          if (Array.isArray(buttonDef) && buttonDef.length >= 3) {
            const [buttonId, scriptName, labelEN] = buttonDef;
            
            allButtons.push({
              id: buttonId,
              tipo: 'node_button',
              sourceId: nodeName,
              script: scriptName,
              localizedLabels: { 'EN': labelEN },
              sourceDetails: {
                name: nodeName,
                localizedCaptions: nodeData.localizedCaptions
              }
            });
            
            // Aggiungi agli script stellati
            if (scriptName) {
              stellatedScripts.add(scriptName);
            }
          }
        }
      }
    }
    
    // 2. Raccoglie bottoni dagli archi
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
                  button: routeData.button || [],
                  localizedCaptions: {}
                };
              }
              
              if (routeData.caption) {
                routesMap[routeName].localizedCaptions[lang] = routeData.caption;
              }
            }
          }
        } catch (error) {
          logger.warn(`Error loading missions.yaml for ${lang}: ${error.message}`);
        }
      }
    }
    
    // Estrai bottoni dagli archi
    for (const [routeName, routeData] of Object.entries(routesMap)) {
      if (Array.isArray(routeData.button) && routeData.button.length >= 3) {
        const [buttonId, scriptName, missionName] = routeData.button;
        
        allButtons.push({
          id: buttonId,
          tipo: 'route_button',
          sourceId: routeName,
          script: scriptName,
          mission: missionName,
          localizedLabels: { 'EN': 'Launch Mission' },
          sourceDetails: {
            name: routeName,
            source: routeData.source,
            destination: routeData.destination,
            localizedCaptions: routeData.localizedCaptions
          }
        });
        
        // Aggiungi agli script stellati
        if (scriptName) {
          stellatedScripts.add(scriptName);
        }
      }
    }
    
    return { stellatedScripts, allButtons };
  } catch (error) {
    logger.warn(`Error determining stellated scripts: ${error.message}`);
    return { stellatedScripts: new Set(), allButtons: [] };
  }
}

// Funzioni esportate per riuso da altri moduli
module.exports = {
  router,
  getStellatedScriptsAndButtons
};

// Funzione validazione post-save per API 14
async function validateSavedScript(scriptName, language, originalBlocks) {
  try {
    // 1. Rilegge lo script appena salvato
    const savedScript = await parseScriptSingleLanguage(scriptName, language, 'blocks');
    
    if (!savedScript || !savedScript.blocks) {
      return {
        isValid: false,
        error: 'VALIDATION_FAILED - Could not re-parse saved script'
      };
    }
    
    // 2. Confronta struttura salvata con originale
    const structureMatch = compareScriptStructures(originalBlocks, savedScript.blocks);
    
    if (!structureMatch.isMatch) {
      return {
        isValid: false,
        error: `VALIDATION_FAILED - Structure mismatch: ${structureMatch.mismatchLocation}`,
        details: {
          originalBlockCount: originalBlocks.length,
          savedBlockCount: savedScript.blocks.length
        }
      };
    }
    
    // 3. Verifica serializzazione→parsing→serializzazione idempotente
    const reserializedContent = convertBlocksToScript(savedScript.blocks);
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
        blockCount: savedScript.blocks.length,
        commandCount: savedScript.metadata?.commandCount || 0
      }
    };
    
  } catch (error) {
    logger.error(`Error in script validation: ${error.message}`);
    return {
      isValid: false,
      error: `VALIDATION_ERROR - ${error.message}`
    };
  }
}

// Confronto strutture script per validazione
function compareScriptStructures(blocks1, blocks2) {
  if (blocks1.length !== blocks2.length) {
    return { isMatch: false, mismatchLocation: 'block count differs' };
  }
  
  for (let i = 0; i < blocks1.length; i++) {
    const block1 = blocks1[i];
    const block2 = blocks2[i];
    
    if (block1.type !== block2.type) {
      return { isMatch: false, mismatchLocation: `block ${i}: type differs (${block1.type} vs ${block2.type})` };
    }
    
    // Controllo ricorsivo per blocchi con children
    if (block1.children && block2.children) {
      const childMatch = compareScriptStructures(block1.children, block2.children);
      if (!childMatch.isMatch) {
        return { isMatch: false, mismatchLocation: `block ${i}.children: ${childMatch.mismatchLocation}` };
      }
    }
    
    // Controllo branch ELSE per IF
    if (block1.elseBranch && block2.elseBranch) {
      const elseMatch = compareScriptStructures(block1.elseBranch, block2.elseBranch);
      if (!elseMatch.isMatch) {
        return { isMatch: false, mismatchLocation: `block ${i}.elseBranch: ${elseMatch.mismatchLocation}` };
      }
    }
  }
  
  return { isMatch: true };
}

// Funzione salvataggio script multilingua 
async function saveScriptMultilingual(scriptName, blocks, languages) {
  const results = {
    languagesProcessed: [],
    filesGenerated: [],
    validation: { isValid: true, languageValidations: {} },
    newLanguagesInitialized: []
  };
  
  try {
    // Supporta tutte le lingue richieste, anche se non sono nella lista predefinita
    // Questo permette l'aggiunta dinamica di nuove lingue
    const targetLanguages = languages;
    
    // Verifica e inizializza lingue non esistenti
    for (const language of targetLanguages) {
      if (!await isLanguageInitialized(language, GAME_ROOT)) {
        logger.info(`Detected new language ${language}, initializing...`);
        try {
          await initializeLanguage(language, GAME_ROOT);
          results.newLanguagesInitialized.push(language);
          logger.info(`Successfully initialized new language: ${language}`);
        } catch (initError) {
          logger.error(`Failed to initialize language ${language}: ${initError.message}`);
          results.validation.languageValidations[language] = {
            isValid: false,
            error: `Failed to initialize language: ${initError.message}`
          };
          continue; // Salta questa lingua se l'inizializzazione fallisce
        }
      }
    }
    
    for (const language of targetLanguages) {
      try {
        // Serializza script per la lingua specifica
        const scriptContent = convertBlocksToScript(blocks, language);
        
        // Il convertBlocksToScript ora gestisce già la struttura completa
        const fullScriptContent = scriptContent;
        
        // Salva nel file della lingua
        const scriptPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${language}`, `${scriptName}.txt`);
        
        // Assicurati che la directory esista (dovrebbe già esistere dopo inizializzazione)
        const scriptDir = path.dirname(scriptPath);
        await fs.ensureDir(scriptDir);
        
        // Gestisce aggiornamento file esistente
        await updateScriptInFileMultilingual(scriptPath, scriptName, fullScriptContent);
        
        results.languagesProcessed.push(language);
        results.filesGenerated.push(`scripts_${language}.txt`);
        
        // Validazione per questa lingua
        const validation = await validateSavedScript(scriptName, language, blocks);
        results.validation.languageValidations[language] = validation;
        
        if (!validation.isValid) {
          results.validation.isValid = false;
        }
        
        logger.info(`Successfully saved script ${scriptName} in ${language}`);
        
      } catch (langError) {
        logger.error(`Error saving script ${scriptName} in ${language}: ${langError.message}`);
        results.validation.languageValidations[language] = {
          isValid: false,
          error: langError.message
        };
        results.validation.isValid = false;
      }
    }
    
    return results;
    
  } catch (error) {
    logger.error(`Error in multilingual script save: ${error.message}`);
    throw error;
  }
}

// Funzione salvataggio script singola lingua (legacy)
async function saveScriptSingleLanguage(scriptName, blocks, language) {
  try {
    const scriptContent = convertBlocksToScript(blocks, language);
    const fullScriptContent = scriptContent;
    
    const scriptPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${language}`, `${scriptName}.txt`);
    
    // Assicurati che la directory esista
    const scriptDir = path.dirname(scriptPath);
    await fs.ensureDir(scriptDir);
    
    await updateScriptInFileMultilingual(scriptPath, scriptName, fullScriptContent);
    
    const validation = await validateSavedScript(scriptName, language, blocks);
    
    return {
      scriptName,
      language,
      blockCount: blocks.length,
      generatedLines: scriptContent.split('\n').length,
      savedAt: new Date().toISOString(),
      filePath: `scripts_${language}.txt`,
      validation
    };
    
  } catch (error) {
    logger.error(`Error in single language script save: ${error.message}`);
    throw error;
  }
}


async function updateScriptInFileMultilingual(filePath, scriptName, newContent) {
  let existingContent = '';
  
  if (await fs.pathExists(filePath)) {
    existingContent = await fs.readFile(filePath, 'utf8');
  }
  
  // Rimuovi versione esistente dello script
  const scriptStartPattern = new RegExp(`SCRIPT\\s+${scriptName}\\s*\\n`, 'i');
  const scriptEndPattern = /END_OF_SCRIPTS\\s*\\n?/;
  
  let updatedContent = existingContent;
  const startMatch = updatedContent.match(scriptStartPattern);
  
  if (startMatch) {
    const startIndex = startMatch.index;
    const afterStart = updatedContent.substring(startIndex + startMatch[0].length);
    const endMatch = afterStart.match(scriptEndPattern);
    
    if (endMatch) {
      const endIndex = startIndex + startMatch[0].length + endMatch.index + endMatch[0].length;
      updatedContent = updatedContent.substring(0, startIndex) + updatedContent.substring(endIndex);
    }
  }
  
  // Aggiungi nuovo script
  if (updatedContent && !updatedContent.endsWith('\n')) {
    updatedContent += '\n';
  }
  updatedContent += newContent;
  
  // Salva file aggiornato
  await fs.writeFile(filePath, updatedContent, 'utf8');
}

// Verifica se i blocchi contengono dati multilingua
function checkForMultilingualData(scripts) {
  for (const script of scripts) {
    if (hasMultilingualParameters(script.blocks)) {
      return true;
    }
  }
  return false;
}

// Verifica ricorsivamente se ci sono parametri multilingua
function hasMultilingualParameters(blocks) {
  for (const block of blocks) {
    // Controlla parametri in block.parameters
    if (block.parameters) {
      for (const param of Object.values(block.parameters)) {
        if (typeof param === 'object' && param !== null && !Array.isArray(param)) {
          const keys = Object.keys(param);
          if (keys.length > 1 || (keys.length === 1 && keys[0].length === 2 && keys[0] !== 'EN')) {
            return true;
          }
        }
      }
    }
    
    // Controlla anche campi diretti come text (per SAY, ASK, etc.)
    if (block.text && typeof block.text === 'object' && !Array.isArray(block.text)) {
      const keys = Object.keys(block.text);
      if (keys.length > 1 || (keys.length === 1 && keys[0].length === 2 && keys[0] !== 'EN')) {
        return true;
      }
    }
    
    // Verifica ricorsiva in tutte le proprietà che contengono array di blocchi
    if (block.children && hasMultilingualParameters(block.children)) return true;
    if (block.thenBranch && hasMultilingualParameters(block.thenBranch)) return true;
    if (block.elseBranch && hasMultilingualParameters(block.elseBranch)) return true;
    if (block.thenBlocks && hasMultilingualParameters(block.thenBlocks)) return true;
    if (block.elseBlocks && hasMultilingualParameters(block.elseBlocks)) return true;
  }
  return false;
}

// Processa un file per una lingua specifica
async function processFileForLanguage(filePath, fileScripts, language, results) {
  const fileExists = await fs.pathExists(filePath);
  
  let fileContent = '';
  let existingScripts = {};
  
  if (fileExists) {
    // Leggi e parsa il file esistente per preservare script non modificati
    fileContent = await fs.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Estrai tutti gli script esistenti
    let currentScript = null;
    let scriptLines = [];
    let inScript = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('SCRIPT ')) {
        currentScript = trimmedLine.replace('SCRIPT ', '').trim();
        scriptLines = [line];
        inScript = true;
      } else if (trimmedLine === 'END_OF_SCRIPT' && currentScript) {
        scriptLines.push(line);
        existingScripts[currentScript] = scriptLines;
        currentScript = null;
        scriptLines = [];
        inScript = false;
      } else if (inScript) {
        scriptLines.push(line);
      }
    }
  }
  
  // Processa ogni script per questo file
  for (const script of fileScripts) {
    try {
      // Estrai i blocchi reali - se c'è un wrapper SCRIPT, usa i suoi children
      let actualBlocks = script.blocks;
      if (actualBlocks.length === 1 && actualBlocks[0].type === 'SCRIPT' && actualBlocks[0].children) {
        actualBlocks = actualBlocks[0].children;
      }
      
      // Serializza solo il contenuto dello script (senza SCRIPTS wrapper)
      const scriptContent = actualBlocks.map(block => serializeElement(block, language)).filter(line => line).join('\n');
      
      // Costruisci le linee dello script con indentazione
      const scriptLines = [];
      scriptLines.push(`  SCRIPT ${script.name}`);
      
      // Aggiungi contenuto con indentazione
      const contentLines = scriptContent.split('\n');
      for (const line of contentLines) {
        if (line.trim()) {
          scriptLines.push(`    ${line}`);
        }
      }
      
      scriptLines.push(`  END_OF_SCRIPT`);
      
      // Aggiorna o aggiungi lo script
      existingScripts[script.name] = scriptLines;
      
      results.push({
        name: script.name,
        fileName: path.basename(filePath),
        language: language,
        status: 'success',
        action: fileExists ? 'updated' : 'created'
      });
      
    } catch (error) {
      logger.error(`Error processing script ${script.name} for ${language}: ${error.message}`);
      results.push({
        name: script.name,
        fileName: path.basename(filePath),
        language: language,
        status: 'error',
        error: error.message
      });
    }
  }
  
  // Ricostruisci il file completo
  const finalLines = ['SCRIPTS', ''];
  
  // Aggiungi tutti gli script (esistenti e nuovi)
  for (const [scriptName, scriptLines] of Object.entries(existingScripts)) {
    finalLines.push(...scriptLines);
  }
  
  finalLines.push('', 'END_OF_SCRIPTS');
  
  // Assicurati che la directory esista
  const scriptDir = path.dirname(filePath);
  await fs.ensureDir(scriptDir);
  
  // Salva il file
  await fs.writeFile(filePath, finalLines.join('\n'), 'utf8');
}

// Funzione helper per sostituire uno script specifico in un file
async function replaceScriptInFile(filePath, scriptName, newScriptLines) {
  const fileContent = await fs.readFile(filePath, 'utf8');
  const lines = fileContent.split('\n');
  const resultLines = [];
  
  // Rileva l'indentazione esistente degli script e del contenuto nel file
  let scriptIndent = '  '; // Default per SCRIPT
  let contentIndent = '    '; // Default per contenuto (2 spazi aggiuntivi)
  
  let foundScript = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*SCRIPT\s+/.test(line)) {
      const match = line.match(/^(\s*)/);
      scriptIndent = match[1];
      foundScript = true;
      
      // Cerca la prima riga di contenuto dopo SCRIPT per rilevare l'indentazione del contenuto
      for (let j = i + 1; j < lines.length; j++) {
        const contentLine = lines[j];
        if (contentLine.trim() && !contentLine.trim().startsWith('SCRIPT') && contentLine.trim() !== 'END_OF_SCRIPT') {
          const contentMatch = contentLine.match(/^(\s*)/);
          contentIndent = contentMatch[1];
          break;
        }
      }
      break;
    }
  }
  
  // Adatta l'indentazione del nuovo script a quella esistente
  const adaptedScriptLines = newScriptLines.map(line => {
    if (line.trim().startsWith('SCRIPT ') || line.trim() === 'END_OF_SCRIPT') {
      // Per SCRIPT e END_OF_SCRIPT usa l'indentazione degli script
      return scriptIndent + line.trim();
    } else if (line.startsWith('  ') && line.trim()) {
      // Per il contenuto, usa l'indentazione del contenuto
      return contentIndent + line.substring(2);
    } else {
      // Righe vuote o altre
      return line;
    }
  });
  
  let inTargetScript = false;
  let scriptStartPattern = new RegExp(`^\\s*SCRIPT\\s+${scriptName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
  let scriptFound = false;
  
  for (const line of lines) {
    if (scriptStartPattern.test(line)) {
      // Inizio dello script target - sostituisci con il nuovo contenuto
      inTargetScript = true;
      scriptFound = true;
      resultLines.push(...adaptedScriptLines);
    } else if (inTargetScript && line.trim() === 'END_OF_SCRIPT') {
      // Fine dello script target - è già incluso nel nuovo contenuto
      inTargetScript = false;
    } else if (!inTargetScript) {
      // Mantieni tutte le righe fuori dallo script target
      resultLines.push(line);
    }
    // Ignora le righe dentro lo script target (verranno sostituite)
  }
  
  // Se lo script non esisteva, aggiungilo prima di END_OF_SCRIPTS
  if (!scriptFound) {
    const endScriptsIndex = resultLines.findIndex(line => line.trim() === 'END_OF_SCRIPTS');
    if (endScriptsIndex !== -1) {
      resultLines.splice(endScriptsIndex, 0, '', ...adaptedScriptLines);
    } else {
      // Se non c'è END_OF_SCRIPTS, aggiungi alla fine
      resultLines.push('', ...adaptedScriptLines);
    }
  }
  
  await fs.writeFile(filePath, resultLines.join('\n'), 'utf8');
}

// Estrae i blocchi convertendo i parametri multilingua per una singola lingua
function extractBlocksForLanguage(blocks, language) {
  return blocks.map(block => {
    const newBlock = { ...block };
    
    // Converti parametri multilingua
    if (newBlock.parameters) {
      newBlock.parameters = { ...newBlock.parameters };
      for (const [paramName, paramValue] of Object.entries(newBlock.parameters)) {
        if (typeof paramValue === 'object' && paramValue !== null && !Array.isArray(paramValue)) {
          // È un oggetto multilingua - estrai il valore per questa lingua
          newBlock.parameters[paramName] = paramValue[language] || paramValue['EN'] || Object.values(paramValue)[0] || '';
        }
      }
    }
    
    // Processo ricorsivo per tutte le proprietà che contengono array di blocchi
    if (newBlock.children) {
      newBlock.children = extractBlocksForLanguage(newBlock.children, language);
    }
    if (newBlock.thenBranch) {
      newBlock.thenBranch = extractBlocksForLanguage(newBlock.thenBranch, language);
    }
    if (newBlock.elseBranch) {
      newBlock.elseBranch = extractBlocksForLanguage(newBlock.elseBranch, language);
    }
    
    return newBlock;
  });
}

// Mantieni compatibilità con export precedente
module.exports = router;
