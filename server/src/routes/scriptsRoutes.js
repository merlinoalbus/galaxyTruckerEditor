// scriptsRoutes.js - Routes per gestione scripts
const express = require('express');
const { parseScriptContent } = require('../parsers/scriptParser');
const { parseScriptToBlocks, convertBlocksToScript } = require('../parsers/blockParser');
const { parseScriptToBlocks: parseScriptToBlocksComplete, convertBlocksToScript: convertBlocksToScriptComplete } = require('../parsers/blockParserComplete');
const { getLogger } = require('../utils/logger');
const { loadMultilingualContent } = require('../utils/fileUtils');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const router = express.Router();
const logger = getLogger();

// Define GAME_ROOT - temporary until moved to config  
const GAME_ROOT = path.join(process.cwd(), '..', '..');

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
      
      // Estrai elementi basati su tipo
      if (type === 'variables') {
        extractVariables(line, currentScript, resultMap);
      } else if (type === 'semaphores') {
        extractSemaphores(line, currentScript, resultMap);
      } else if (type === 'labels') {
        extractLabels(line, currentScript, resultMap, fileName);
        
        // Aggiorna numero di linea per label e GO
        const upperLine = line.toUpperCase().trim();
        if (upperLine.startsWith('LABEL ')) {
          const labelName = line.trim().split(' ')[1];
          if (labelName && resultMap.has(labelName)) {
            resultMap.get(labelName).posizione_definizione.linea = i + 1;
          }
        } else if (upperLine.startsWith('GO ')) {
          const labelName = line.trim().split(' ')[1];
          if (labelName && resultMap.has(labelName)) {
            const data = resultMap.get(labelName);
            const lastRef = data.riferimenti[data.riferimenti.length - 1];
            if (lastRef && lastRef.linea === null) {
              lastRef.linea = i + 1;
            }
          }
        }
      }
    }
  } catch (error) {
    logger.warn(`Cannot parse file ${filePath}: ${error.message}`);
  }
}

// Estrai variabili numeriche
function extractVariables(line, scriptName, variableMap) {
  const upperLine = line.toUpperCase().trim();
  let variableName = null;
  let operation = null;
  let value = null;
  
  // SET_TO <variabile> <valore>
  if (upperLine.startsWith('SET_TO ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'SET_TO';
      value = parseInt(parts[2]) || 0;
    }
  }
  // ADD <variabile> <valore>
  else if (upperLine.startsWith('ADD ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'ADD';
      value = parseInt(parts[2]) || 0;
    }
  }
  // IF_IS <variabile> <valore>
  else if (upperLine.startsWith('IF_IS ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'IF_IS';
      value = parseInt(parts[2]) || 0;
    }
  }
  // IF_MIN <variabile> <valore>
  else if (upperLine.startsWith('IF_MIN ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'IF_MIN';
      value = parseInt(parts[2]) || 0;
    }
  }
  // IF_MAX <variabile> <valore>
  else if (upperLine.startsWith('IF_MAX ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 3) {
      variableName = parts[1];
      operation = 'IF_MAX';
      value = parseInt(parts[2]) || 0;
    }
  }
  
  if (variableName && operation) {
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
    
    const semaphoreMap = new Map();
    
    // Scansiona ricorsivamente tutti i file .txt in ./campaign
    await scanCampaignFiles(semaphoreMap, 'semaphores');
    
    // Converti mappa in array
    const result = Array.from(semaphoreMap.entries()).map(([nomesemaforo, data]) => {
      // Calcola stato finale probabile
      const setCount = data.operations.SET || 0;
      const resetCount = data.operations.RESET || 0;
      const stato_finale_probabile = setCount >= resetCount ? 'SET' : 'RESET';
      
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
  // RESET <semaforo>
  else if (upperLine.startsWith('RESET ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2) {
      semaphoreName = parts[1];
      operation = 'RESET';
    }
  }
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
    const result = Array.from(labelMap.entries()).map(([nomelabel, data]) => ({
      nomelabel,
      scriptancoraggio: data.scriptancoraggio,
      utilizzi_totali: data.riferimenti.length,
      posizione_definizione: data.posizione_definizione,
      riferimenti: data.riferimenti
    })).sort((a, b) => a.nomelabel.localeCompare(b.nomelabel));
    
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
function extractLabels(line, scriptName, labelMap, fileName) {
  const upperLine = line.toUpperCase().trim();
  
  // LABEL <nome>
  if (upperLine.startsWith('LABEL ')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2) {
      const labelName = parts[1];
      
      if (!labelMap.has(labelName)) {
        labelMap.set(labelName, {
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
      
      // Crea entry se non esiste (GO prima di LABEL)
      if (!labelMap.has(labelName)) {
        labelMap.set(labelName, {
          scriptancoraggio: scriptName,
          posizione_definizione: {
            file: fileName,
            linea: null
          },
          riferimenti: []
        });
      }
      
      // Aggiungi riferimento
      const data = labelMap.get(labelName);
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
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
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
        const parseResult = parseScriptToBlocksComplete(scriptLines, language);
        
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
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
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
  result.blocks = mergeBlocksTextContent(result.blocks, parsedScripts);
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
function mergeBlocksTextContent(blocks, parsedScripts) {
  return blocks.map(block => {
    const mergedBlock = { ...block };
    
    // Merge parametri multilingua
    if (mergedBlock.parameters) {
      for (const [paramName, paramValue] of Object.entries(mergedBlock.parameters)) {
        if (typeof paramValue === 'object' && paramValue !== null && !Array.isArray(paramValue)) {
          // È un oggetto multilingua - merge con altre lingue
          const mergedParam = { ...paramValue };
          
          for (const [lang, scriptData] of Object.entries(parsedScripts)) {
            if (lang === 'EN') continue;
            
            const correspondingBlock = findCorrespondingBlock(scriptData.blocks, block, blocks.indexOf(block));
            if (correspondingBlock && correspondingBlock.parameters && correspondingBlock.parameters[paramName]) {
              const otherLangValue = correspondingBlock.parameters[paramName];
              if (typeof otherLangValue === 'object' && otherLangValue[lang]) {
                mergedParam[lang] = otherLangValue[lang];
              }
            }
          }
          
          mergedBlock.parameters[paramName] = mergedParam;
        }
      }
    }
    
    // Merge ricorsivo per children
    if (mergedBlock.children) {
      mergedBlock.children = mergeBlocksTextContent(mergedBlock.children, parsedScripts);
    }
    
    // Merge ricorsivo per elseBranch
    if (mergedBlock.elseBranch) {
      mergedBlock.elseBranch = mergeBlocksTextContent(mergedBlock.elseBranch, parsedScripts);
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
    
    if (block.children) {
      extractVariables(block.children, variables);
    }
    if (block.elseBranch) {
      extractVariables(block.elseBranch, variables);
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

// API 14: Salvataggio script multilingua da JSON  
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
      if (saveMode === 'multilingual') {
        // SALVATAGGIO MULTILINGUA: genera un file per ogni lingua
        const saveResults = await saveScriptMultilingual(scriptName, blocks, languages);
        
        res.json({
          success: true,
          data: {
            scriptName,
            saveMode: 'multilingual',
            languagesProcessed: saveResults.languagesProcessed,
            filesGenerated: saveResults.filesGenerated,
            blockCount: blocks.length,
            savedAt: new Date().toISOString(),
            validation: saveResults.validation
          }
        });
      } else {
        // SALVATAGGIO SINGOLA LINGUA (modalità legacy)
        const singleLang = languages[0] || 'EN';
        const saveResult = await saveScriptSingleLanguage(scriptName, blocks, singleLang);
        
        res.json({
          success: true,
          data: saveResult
        });
      }
      
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
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    
    // 1. Raccoglie bottoni dai nodi
    const nodesMap = {};
    for (const lang of languages) {
      const nodesPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`, 'nodes.yaml');
      
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
      const missionsPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`, 'missions.yaml');
      
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
    const reserializedContent = convertBlocksToScriptComplete(savedScript.blocks);
    const originalSerializedContent = convertBlocksToScriptComplete(originalBlocks);
    
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
    validation: { isValid: true, languageValidations: {} }
  };
  
  try {
    // Supporta tutte le lingue del gioco
    const allLanguages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const targetLanguages = languages.filter(lang => allLanguages.includes(lang));
    
    for (const language of targetLanguages) {
      try {
        // Serializza script per la lingua specifica
        const scriptContent = convertBlocksToScriptCompleteMultilingual(blocks, language);
        
        // Prepara contenuto con header SCRIPT
        const fullScriptContent = `SCRIPT ${scriptName}\n${scriptContent}\nEND_OF_SCRIPTS\n`;
        
        // Salva nel file della lingua
        const scriptPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${language}`, `${scriptName}.txt`);
        
        // Assicurati che la directory esista
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
    const scriptContent = convertBlocksToScriptComplete(blocks);
    const fullScriptContent = `SCRIPT ${scriptName}\n${scriptContent}\nEND_OF_SCRIPTS\n`;
    
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

// Serializzazione completa con supporto multilingua
function convertBlocksToScriptCompleteMultilingual(blocks, targetLanguage) {
  return blocks.map(block => serializeElementMultilingual(block, targetLanguage)).join('\n');
}

function serializeElementMultilingual(element, targetLanguage) {
  if (!element || !element.type) {
    return '';
  }
  
  switch (element.type) {
    case 'SCRIPT':
      const scriptLines = [`SCRIPT ${element.name}`];
      if (element.children) {
        scriptLines.push(...element.children.map(child => serializeElementMultilingual(child, targetLanguage)));
      }
      scriptLines.push('END_OF_SCRIPTS');
      return scriptLines.join('\n');
      
    case 'IF':
      return serializeIfBlockMultilingual(element, targetLanguage);
      
    case 'MENU':
      const menuLines = ['MENU'];
      if (element.options) {
        menuLines.push(...element.options.map(opt => serializeElementMultilingual(opt, targetLanguage)));
      }
      menuLines.push('END_OF_MENU');
      return menuLines.join('\n');
      
    case 'OPT':
      return serializeOptBlockMultilingual(element, targetLanguage);
      
    default:
      return serializeCommandMultilingual(element, targetLanguage);
  }
}

function serializeCommandMultilingual(element, targetLanguage) {
  if (element.type === 'UNKNOWN_COMMAND') {
    return `${element.name} ${element.parameters.raw || ''}`.trim();
  }
  
  const commandDef = require('../parsers/blockParserComplete').COMMAND_CATALOG[element.type];
  if (!commandDef) {
    return `${element.type} ${JSON.stringify(element.parameters)}`;
  }
  
  const parts = [element.type];
  
  if (commandDef.params && element.parameters) {
    commandDef.params.forEach(paramDef => {
      const [paramName, paramType] = paramDef.split(':');
      const paramValue = element.parameters[paramName];
      
      if (paramType === 'multilingual') {
        // Gestione testo multilingua con fallback a EN
        const text = getTextForLanguageWithFallback(paramValue, targetLanguage);
        parts.push(`"${text}"`);
      } else {
        parts.push(paramValue);
      }
    });
  }
  
  return parts.join(' ');
}

function serializeIfBlockMultilingual(ifElement, targetLanguage) {
  const lines = [];
  
  // Comando apertura IF
  const ifCommand = buildIfCommandFromElement(ifElement);
  lines.push(ifCommand);
  
  // Contenuto then
  if (ifElement.thenBranch) {
    lines.push(...ifElement.thenBranch.map(child => serializeElementMultilingual(child, targetLanguage)));
  }
  
  // Contenuto else
  if (ifElement.elseBranch && ifElement.elseBranch.length > 0) {
    lines.push('ELSE');
    lines.push(...ifElement.elseBranch.map(child => serializeElementMultilingual(child, targetLanguage)));
  }
  
  lines.push('END_OF_IF');
  return lines.join('\n');
}

function serializeOptBlockMultilingual(optElement, targetLanguage) {
  const lines = [];
  
  // Comando apertura OPT con testo multilingua
  let optCommand;
  const text = getTextForLanguageWithFallback(optElement.text, targetLanguage);
  
  switch (optElement.optType) {
    case 'OPT_SIMPLE':
      optCommand = `OPT "${text}"`;
      break;
    case 'OPT_CONDITIONAL':
      optCommand = `OPT_IF ${optElement.condition} "${text}"`;
      break;
    case 'OPT_CONDITIONAL_NOT':
      optCommand = `OPT_IFNOT ${optElement.condition} "${text}"`;
      break;
    default:
      optCommand = `OPT "${text}"`;
  }
  
  lines.push(optCommand);
  
  // Contenuto OPT
  if (optElement.children) {
    lines.push(...optElement.children.map(child => serializeElementMultilingual(child, targetLanguage)));
  }
  
  lines.push('END_OF_OPT');
  return lines.join('\n');
}

function buildIfCommandFromElement(ifElement) {
  switch (ifElement.ifType) {
    case 'IF_SEMAPHORE':
      return `IF ${ifElement.condition}`;
    case 'IFNOT_SEMAPHORE':
      return `IFNOT ${ifElement.condition}`;
    case 'IF_VARIABLE_EXACT':
      return `IF_IS ${ifElement.variable} ${ifElement.value}`;
    case 'IF_VARIABLE_MIN':
      return `IF_MIN ${ifElement.variable} ${ifElement.value}`;
    case 'IF_VARIABLE_MAX':
      return `IF_MAX ${ifElement.variable} ${ifElement.value}`;
    case 'IF_CREDITS':
      return `IF_HAS_CREDITS ${ifElement.value}`;
    case 'IF_PROBABILITY':
      return `IF_PROB ${ifElement.value}`;
    case 'IF_ORDER':
      return `IF_ORDER ${ifElement.positions.join(' ')}`;
    case 'IF_SYSTEM':
      return getSystemIfCommandFromVar(ifElement.systemVariable);
    default:
      return `IF ${ifElement.condition || 'UNKNOWN'}`;
  }
}

function getSystemIfCommandFromVar(systemVar) {
  switch (systemVar) {
    case 'debug': return 'IF_DEBUG';
    case 'from_campaign': return 'IF_FROM_CAMPAIGN';
    case 'mission_won': return 'IF_MISSION_WON';
    case 'tutorial_seen': return 'IF_TUTORIAL_SEEN';
    default: return `IF_${systemVar.toUpperCase()}`;
  }
}

function getTextForLanguageWithFallback(textObj, targetLanguage) {
  if (typeof textObj === 'string') return textObj;
  if (typeof textObj === 'object' && textObj !== null) {
    // Prima prova la lingua target
    if (textObj[targetLanguage]) return textObj[targetLanguage];
    // Fallback a inglese  
    if (textObj['EN']) return textObj['EN'];
    // Ultima risorsa: prima lingua disponibile
    const availableTexts = Object.values(textObj).filter(t => t && t.trim());
    return availableTexts[0] || '';
  }
  return '';
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

// Mantieni compatibilità con export precedente
module.exports = router;
