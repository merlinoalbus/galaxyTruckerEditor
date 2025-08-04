// gameRoutes.js - Routes per elementi di gioco (characters, nodes, buttons, achievements)
const express = require('express');
const { getLogger } = require('../utils/logger');
const { findCharacterImages } = require('../utils/characterUtils');
const { GAME_ROOT, SUPPORTED_LANGUAGES } = require('../config/config');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const router = express.Router();
const logger = getLogger();

// API 6: Lista personaggi secondo specifica
router.get('/characters', async (req, res) => {
  try {
    logger.info('API call: GET /api/game/characters - Scansione personaggi da characters.yaml + usage negli script');
    
    const characters = [];
    
    // Carica campaign/characters.yaml
    const charactersPath = path.join(GAME_ROOT, 'campaign', 'characters.yaml');
    
    if (!await fs.pathExists(charactersPath)) {
      logger.warn('characters.yaml not found');
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    const content = await fs.readFile(charactersPath, 'utf8');
    const charactersData = yaml.load(content);
    
    if (!Array.isArray(charactersData)) {
      logger.warn('characters.yaml format not supported');
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    // Scansiona script per raccogliere dati utilizzo
    const characterUsage = new Map();
    await scanCampaignFilesForCharacters(characterUsage);
    
    // Processa ogni personaggio dal YAML
    for (const characterDef of charactersData) {
      if (!characterDef.name) continue;
      
      const nomepersonaggio = characterDef.name;
      const usage = characterUsage.get(nomepersonaggio) || {
        utilizzi_totali: 0,
        script_che_lo_usano: [],
        comandi_utilizzati: [],
        immagine_corrente: null
      };
      
      // Carica immagine base
      const immaginebase = await loadCharacterBaseImage(characterDef.image);
      
      // Trova tutte le immagini possibili
      const listaimmagini = await findAllCharacterImages(nomepersonaggio);
      
      // Determina immagine corrente (da CHANGECHAR o default base)
      const immagine_corrente = usage.immagine_corrente || characterDef.image;
      
      characters.push({
        nomepersonaggio: nomepersonaggio,
        visibile: false,
        immaginebase: immaginebase,
        listaimmagini: listaimmagini,
        posizione: null,
        utilizzi_totali: usage.utilizzi_totali,
        script_che_lo_usano: Array.from(usage.script_che_lo_usano),
        comandi_utilizzati: Array.from(usage.comandi_utilizzati),
        immagine_corrente: immagine_corrente
      });
    }
    
    // Ordina per nome
    characters.sort((a, b) => a.nomepersonaggio.localeCompare(b.nomepersonaggio));
    
    logger.info(`Found ${characters.length} characters (${characters.filter(c => c.utilizzi_totali > 0).length} used in scripts)`);
    
    res.json({
      success: true,
      data: characters,
      count: characters.length
    });
  } catch (error) {
    logger.error(`Error retrieving characters: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve characters',
      message: error.message 
    });
  }
});

// Funzione per scansionare file campaign per personaggi
async function scanCampaignFilesForCharacters(characterUsage) {
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
          await parseFileForCharacters(fullPath, relPath, characterUsage);
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

// Parse file per estrarre utilizzi personaggi
async function parseFileForCharacters(filePath, fileName, characterUsage) {
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
      
      // Estrai utilizzi personaggi
      const upperLine = line.toUpperCase().trim();
      let personaggio = null;
      let comando = null;
      let immagine = null;
      
      // SHOWCHAR <personaggio> <posizione>
      if (upperLine.startsWith('SHOWCHAR ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          personaggio = parts[1];
          comando = 'SHOWCHAR';
        }
      }
      // HIDECHAR <personaggio>
      else if (upperLine.startsWith('HIDECHAR ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          personaggio = parts[1];
          comando = 'HIDECHAR';
        }
      }
      // CHANGECHAR <personaggio> <immagine>
      else if (upperLine.startsWith('CHANGECHAR ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 3) {
          personaggio = parts[1];
          comando = 'CHANGECHAR';
          immagine = parts[2];
        }
      }
      // SAYCHAR <personaggio> "<testo>"
      else if (upperLine.startsWith('SAYCHAR ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          personaggio = parts[1];
          comando = 'SAYCHAR';
        }
      }
      // ASKCHAR <personaggio> "<testo>"
      else if (upperLine.startsWith('ASKCHAR ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          personaggio = parts[1];
          comando = 'ASKCHAR';
        }
      }
      // FOCUSCHAR <personaggio>
      else if (upperLine.startsWith('FOCUSCHAR ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          personaggio = parts[1];
          comando = 'FOCUSCHAR';
        }
      }
      
      if (personaggio && comando) {
        if (!characterUsage.has(personaggio)) {
          characterUsage.set(personaggio, {
            utilizzi_totali: 0,
            script_che_lo_usano: new Set(),
            comandi_utilizzati: new Set(),
            immagine_corrente: null
          });
        }
        
        const usage = characterUsage.get(personaggio);
        usage.utilizzi_totali++;
        usage.script_che_lo_usano.add(currentScript);
        usage.comandi_utilizzati.add(comando);
        
        // Se è CHANGECHAR, aggiorna immagine corrente
        if (comando === 'CHANGECHAR' && immagine) {
          usage.immagine_corrente = immagine;
        }
      }
    }
  } catch (error) {
    logger.warn(`Cannot parse file ${filePath}: ${error.message}`);
  }
}

// Carica immagine base del personaggio con binary
async function loadCharacterBaseImage(imagePath) {
  try {
    const fullPath = path.join(GAME_ROOT, imagePath);
    
    if (await fs.pathExists(fullPath)) {
      const buffer = await fs.readFile(fullPath);
      const ext = path.extname(imagePath);
      const nomefile = path.basename(imagePath, ext);
      
      return {
        nomefile: nomefile,
        percorso: imagePath,
        binary: buffer.toString('base64')
      };
    } else {
      // Fallback se immagine non trovata
      return {
        nomefile: 'missing',
        percorso: imagePath,
        binary: null
      };
    }
  } catch (error) {
    logger.warn(`Cannot load character base image ${imagePath}: ${error.message}`);
    return {
      nomefile: 'error',
      percorso: imagePath,
      binary: null
    };
  }
}

// Trova tutte le immagini possibili per un personaggio
async function findAllCharacterImages(nomepersonaggio) {
  const images = [];
  const campaignPath = path.join(GAME_ROOT, 'campaign');
  
  try {
    if (await fs.pathExists(campaignPath)) {
      const files = await fs.readdir(campaignPath);
      const imageExtensions = ['.png', '.jpg', '.jpeg'];
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const baseName = path.basename(file, ext);
          
          // Controlla se è un'immagine del personaggio (baseName inizia con nomepersonaggio)
          if (baseName === nomepersonaggio || baseName.startsWith(nomepersonaggio + '-')) {
            const fullPath = path.join(campaignPath, file);
            const buffer = await fs.readFile(fullPath);
            const percorso = `campaign/${file}`;
            
            images.push({
              nomefile: baseName,
              percorso: percorso,
              binary: buffer.toString('base64')
            });
          }
        }
      }
    }
  } catch (error) {
    logger.warn(`Cannot scan for character images for ${nomepersonaggio}: ${error.message}`);
  }
  
  // Ordina per nome file
  images.sort((a, b) => a.nomefile.localeCompare(b.nomefile));
  
  return images;
}

// API 7: Lista nodi mappa da nodes.yaml secondo specifica
router.get('/nodes', async (req, res) => {
  try {
    logger.info('API call: GET /api/game/nodes - Caricamento nodi con tutti gli attributi + analisi utilizzo script');
    
    const nodes = [];
    
    // Carica nodes.yaml multilingua
    const languages = SUPPORTED_LANGUAGES;
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
                  coordinates: nodeData.coordinates || [0, 0],
                  image: nodeData.image || '',
                  localizedCaptions: {},
                  localizedDescriptions: {},
                  shuttles: nodeData.shuttles || [],
                  buttons: nodeData.buttons || [],
                  imagePath: '',
                  imageBinary: null
                };
              }
              
              // Aggiungi dati localizzati
              if (nodeData.caption) {
                nodesMap[nodeName].localizedCaptions[lang] = nodeData.caption;
              }
              if (nodeData.description) {
                nodesMap[nodeName].localizedDescriptions[lang] = nodeData.description;
              }
            }
          }
        } catch (error) {
          logger.warn(`Error loading nodes.yaml for ${lang}: ${error.message}`);
        }
      }
    }
    
    // Scansiona script per raccogliere utilizzi nodi
    const nodeUsage = new Map();
    await scanCampaignFilesForNodes(nodeUsage);
    
    // Processa ogni nodo
    for (const [nodeName, nodeData] of Object.entries(nodesMap)) {
      const usage = nodeUsage.get(nodeName) || {
        utilizzi_totali: 0,
        script_che_lo_usano: [],
        comandi_utilizzati: []
      };
      
      // Carica immagine del nodo
      const imageResult = await loadNodeImage(nodeData.image);
      
      // Parsa buttons in formato strutturato
      const parsedButtons = await parseNodeButtons(nodeData.buttons, languages);
      
      nodes.push({
        name: nodeName,
        coordinates: nodeData.coordinates,
        image: nodeData.image,
        localizedCaptions: nodeData.localizedCaptions,
        localizedDescriptions: nodeData.localizedDescriptions,
        shuttles: nodeData.shuttles,
        buttons: parsedButtons,
        imagePath: imageResult.imagePath,
        imageBinary: imageResult.imageBinary,
        utilizzi_totali: usage.utilizzi_totali,
        script_che_lo_usano: Array.from(usage.script_che_lo_usano),
        comandi_utilizzati: Array.from(usage.comandi_utilizzati)
      });
    }
    
    // Ordina per nome
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    
    logger.info(`Found ${nodes.length} nodes (${nodes.filter(n => n.utilizzi_totali > 0).length} used in scripts)`);
    
    res.json({
      success: true,
      data: nodes,
      count: nodes.length
    });
  } catch (error) {
    logger.error(`Error retrieving nodes: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve nodes',
      message: error.message 
    });
  }
});

// Funzione per scansionare file campaign per utilizzi nodi
async function scanCampaignFilesForNodes(nodeUsage) {
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
          await parseFileForNodes(fullPath, relPath, nodeUsage);
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

// Parse file per estrarre utilizzi nodi
async function parseFileForNodes(filePath, fileName, nodeUsage) {
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
      
      // Estrai utilizzi nodi
      const upperLine = line.toUpperCase().trim();
      let nodo = null;
      let comando = null;
      
      // SHOWNODE <nodo>
      if (upperLine.startsWith('SHOWNODE ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          nodo = parts[1];
          comando = 'SHOWNODE';
        }
      }
      // HIDENODE <nodo>
      else if (upperLine.startsWith('HIDENODE ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          nodo = parts[1];
          comando = 'HIDENODE';
        }
      }
      // CENTERMAPBYNODE <nodo>
      else if (upperLine.startsWith('CENTERMAPBYNODE ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          nodo = parts[1];
          comando = 'CENTERMAPBYNODE';
        }
      }
      // MOVEPLAYERTONODE <nodo>
      else if (upperLine.startsWith('MOVEPLAYERTONODE ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          nodo = parts[1];
          comando = 'MOVEPLAYERTONODE';
        }
      }
      
      if (nodo && comando) {
        if (!nodeUsage.has(nodo)) {
          nodeUsage.set(nodo, {
            utilizzi_totali: 0,
            script_che_lo_usano: new Set(),
            comandi_utilizzati: new Set()
          });
        }
        
        const usage = nodeUsage.get(nodo);
        usage.utilizzi_totali++;
        usage.script_che_lo_usano.add(currentScript);
        usage.comandi_utilizzati.add(comando);
      }
    }
  } catch (error) {
    logger.warn(`Cannot parse file ${filePath}: ${error.message}`);
  }
}

// Carica immagine del nodo
async function loadNodeImage(imageName) {
  if (!imageName) {
    return { imagePath: '', imageBinary: null };
  }
  
  const imagePath = `campaign/campaignMap/big/${imageName}`;
  const fullPath = path.join(GAME_ROOT, imagePath);
  
  try {
    if (await fs.pathExists(fullPath)) {
      const buffer = await fs.readFile(fullPath);
      return {
        imagePath: imagePath,
        imageBinary: buffer.toString('base64')
      };
    } else {
      logger.warn(`Node image not found: ${imagePath}`);
      return { imagePath: imagePath, imageBinary: null };
    }
  } catch (error) {
    logger.warn(`Cannot load node image ${imagePath}: ${error.message}`);
    return { imagePath: imagePath, imageBinary: null };
  }
}

// Parsa buttons del nodo in formato strutturato
async function parseNodeButtons(buttonsArray, languages) {
  const parsedButtons = [];
  
  if (!Array.isArray(buttonsArray)) {
    return parsedButtons;
  }
  
  // Carica stringhe localizzate per buttons da file yaml
  const buttonStrings = await loadButtonLocalizedStrings(languages);
  
  for (const buttonDef of buttonsArray) {
    if (Array.isArray(buttonDef) && buttonDef.length >= 3) {
      const [buttonId, scriptName, labelEN] = buttonDef;
      
      // Costruisce labels multilingua usando i file di localizzazione
      const localizedLabels = {
        'EN': labelEN
      };
      
      // Carica labels dalle altre lingue se disponibili
      for (const lang of languages) {
        if (lang !== 'EN' && buttonStrings[lang] && buttonStrings[lang][buttonId]) {
          localizedLabels[lang] = buttonStrings[lang][buttonId];
        }
      }
      
      parsedButtons.push({
        id: buttonId,
        script: scriptName,
        localizedLabels: localizedLabels
      });
    }
  }
  
  return parsedButtons;
}

// Carica stringhe localizzate per buttons da file di localizzazione
async function loadButtonLocalizedStrings(languages) {
  const buttonStrings = {};
  
  for (const lang of languages) {
    if (lang === 'EN') continue; // EN è già nel nodes.yaml
    
    try {
      // Cerca file strings per buttons in localization_strings/
      const stringsPath = path.join(GAME_ROOT, 'localization_strings', `button_strings_${lang}.yaml`);
      
      if (await fs.pathExists(stringsPath)) {
        const content = await fs.readFile(stringsPath, 'utf8');
        buttonStrings[lang] = yaml.load(content) || {};
      } else {
        // Fallback: cerca file alternativi
        const altPath = path.join(GAME_ROOT, 'campaign', `campaignScripts${lang}`, 'button_labels.yaml');
        if (await fs.pathExists(altPath)) {
          const content = await fs.readFile(altPath, 'utf8');
          buttonStrings[lang] = yaml.load(content) || {};
        }
      }
    } catch (error) {
      logger.warn(`Cannot load button strings for ${lang}: ${error.message}`);
      buttonStrings[lang] = {};
    }
  }
  
  return buttonStrings;
}

// API 9: Lista bottoni completa calcolata da nodi + archi + analisi utilizzo
router.get('/buttons', async (req, res) => {
  try {
    logger.info('API call: GET /api/game/buttons - Raccolta bottoni da nodi e archi + analisi utilizzo script');
    
    const allButtons = [];
    
    // 1. Raccoglie bottoni dai nodi
    const nodeButtons = await collectNodeButtons();
    allButtons.push(...nodeButtons);
    
    // 2. Raccoglie bottoni dagli archi
    const routeButtons = await collectRouteButtons();
    allButtons.push(...routeButtons);
    
    // 3. Scansiona script per raccogliere utilizzi bottoni
    const buttonUsage = new Map();
    await scanCampaignFilesForButtons(buttonUsage);
    
    // 4. Aggiungi dati utilizzo a ogni bottone
    for (const button of allButtons) {
      const usage = buttonUsage.get(button.id) || {
        utilizzi_totali: 0,
        script_che_lo_usano: [],
        comandi_utilizzati: []
      };
      
      button.utilizzi_totali = usage.utilizzi_totali;
      button.script_che_lo_usano = Array.from(usage.script_che_lo_usano);
      button.comandi_utilizzati = Array.from(usage.comandi_utilizzati);
    }
    
    // Ordina per ID bottone
    allButtons.sort((a, b) => a.id.localeCompare(b.id));
    
    logger.info(`Found ${allButtons.length} total buttons (${nodeButtons.length} from nodes, ${routeButtons.length} from routes, ${allButtons.filter(b => b.utilizzi_totali > 0).length} used in scripts)`);
    
    res.json({
      success: true,
      data: allButtons,
      count: allButtons.length
    });
  } catch (error) {
    logger.error(`Error retrieving buttons: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve buttons',
      message: error.message 
    });
  }
});

// Raccoglie bottoni dai nodi
async function collectNodeButtons() {
  const buttons = [];
  const languages = SUPPORTED_LANGUAGES;
  const nodesMap = {};
  
  // Carica nodes.yaml multilingua
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
  
  // Estrai bottoni da ogni nodo
  for (const [nodeName, nodeData] of Object.entries(nodesMap)) {
    if (Array.isArray(nodeData.buttons)) {
      for (const buttonDef of nodeData.buttons) {
        if (Array.isArray(buttonDef) && buttonDef.length >= 3) {
          const [buttonId, scriptName, labelEN] = buttonDef;
          
          buttons.push({
            id: buttonId,
            tipo: 'node_button',
            sourceId: nodeName,
            script: scriptName,
            localizedLabels: {
              'EN': labelEN
            },
            sourceDetails: {
              name: nodeName,
              localizedCaptions: nodeData.localizedCaptions
            }
          });
        }
      }
    }
  }
  
  return buttons;
}

// Raccoglie bottoni dagli archi
async function collectRouteButtons() {
  const buttons = [];
  const languages = SUPPORTED_LANGUAGES;
  const routesMap = {};
  
  // Carica missions.yaml multilingua
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
  
  // Estrai bottoni da ogni arco
  for (const [routeName, routeData] of Object.entries(routesMap)) {
    if (Array.isArray(routeData.button) && routeData.button.length >= 3) {
      const [buttonId, scriptName, missionName] = routeData.button;
      
      buttons.push({
        id: buttonId,
        tipo: 'route_button',
        sourceId: routeName,
        script: scriptName,
        mission: missionName,
        localizedLabels: {
          'EN': 'Launch Mission'
        },
        sourceDetails: {
          name: routeName,
          source: routeData.source,
          destination: routeData.destination,
          localizedCaptions: routeData.localizedCaptions
        }
      });
    }
  }
  
  return buttons;
}

// Funzione per scansionare file campaign per utilizzi bottoni
async function scanCampaignFilesForButtons(buttonUsage) {
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
          await parseFileForButtons(fullPath, relPath, buttonUsage);
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

// Parse file per estrarre utilizzi bottoni
async function parseFileForButtons(filePath, fileName, buttonUsage) {
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
      
      // Estrai utilizzi bottoni
      const upperLine = line.toUpperCase().trim();
      let bottone = null;
      let comando = null;
      
      // SHOWBUTTON <bottone>
      if (upperLine.startsWith('SHOWBUTTON ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          bottone = parts[1];
          comando = 'SHOWBUTTON';
        }
      }
      // HIDEBUTTON <bottone>
      else if (upperLine.startsWith('HIDEBUTTON ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          bottone = parts[1];
          comando = 'HIDEBUTTON';
        }
      }
      
      if (bottone && comando) {
        if (!buttonUsage.has(bottone)) {
          buttonUsage.set(bottone, {
            utilizzi_totali: 0,
            script_che_lo_usano: new Set(),
            comandi_utilizzati: new Set()
          });
        }
        
        const usage = buttonUsage.get(bottone);
        usage.utilizzi_totali++;
        usage.script_che_lo_usano.add(currentScript);
        usage.comandi_utilizzati.add(comando);
      }
    }
  } catch (error) {
    logger.warn(`Cannot parse file ${filePath}: ${error.message}`);
  }
}

// API 16: Lista achievement completa con analisi utilizzo
router.get('/achievements', async (req, res) => {
  try {
    logger.info('API call: GET /api/game/achievements - Lista completa con analisi utilizzo');
    
    const achievements = [];
    
    // Carica achi.yaml
    const achiPath = path.join(GAME_ROOT, 'achievements', 'achi.yaml');
    
    if (!await fs.pathExists(achiPath)) {
      logger.warn('achievements/achi.yaml not found');
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    const content = await fs.readFile(achiPath, 'utf8');
    const achiData = yaml.load(content);
    
    if (!achiData || !Array.isArray(achiData)) {
      logger.warn('Invalid achi.yaml format');
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    // Carica stringhe localizzate
    const languages = SUPPORTED_LANGUAGES;
    const localizedStrings = {};
    
    for (const lang of languages) {
      const stringsPath = path.join(GAME_ROOT, 'localization_strings', `achievements_strings_${lang}.yaml`);
      if (await fs.pathExists(stringsPath)) {
        try {
          const stringsContent = await fs.readFile(stringsPath, 'utf8');
          localizedStrings[lang] = yaml.load(stringsContent) || {};
        } catch (error) {
          logger.warn(`Error loading achievements_strings_${lang}.yaml: ${error.message}`);
        }
      }
    }
    
    // Scansiona script/missions per utilizzi achievement
    const achievementUsage = new Map();
    await scanCampaignFilesForAchievements(achievementUsage);
    
    // Processa ogni achievement
    for (const achievement of achiData) {
      if (!achievement || !achievement.name) continue;
      
      const usage = achievementUsage.get(achievement.name) || {
        utilizzi_totali: 0,
        script_che_lo_utilizzano: [],
        comandi_utilizzati: []
      };
      
      // Verifica esistenza immagini
      const preImagePath = path.join(GAME_ROOT, 'achievements', 'images', achievement.preImage || '');
      const postImagePath = path.join(GAME_ROOT, 'achievements', 'images', achievement.postImage || '');
      
      const achievementData = {
        name: achievement.name,
        category: achievement.category || 'general',
        points: achievement.points || 0,
        objectivesCount: achievement.objectivesCount || 1,
        hidden: achievement.hidden === true,
        repeatable: achievement.repeatable === true,
        preDesc: achievement.preDesc || '',
        postDesc: achievement.postDesc || '',
        preImage: {
          fileName: achievement.preImage || null,
          path: achievement.preImage ? `achievements/images/${achievement.preImage}` : null,
          exists: achievement.preImage ? await fs.pathExists(preImagePath) : false
        },
        postImage: {
          fileName: achievement.postImage || null,
          path: achievement.postImage ? `achievements/images/${achievement.postImage}` : null,
          exists: achievement.postImage ? await fs.pathExists(postImagePath) : false
        },
        localizedNames: {},
        localizedPreDescriptions: {},
        localizedPostDescriptions: {},
        utilizzi_totali: usage.utilizzi_totali,
        script_che_lo_utilizzano: Array.from(usage.script_che_lo_utilizzano),
        comandi_utilizzati: Array.from(usage.comandi_utilizzati)
      };
      
      // Aggiungi stringhe localizzate
      for (const [lang, strings] of Object.entries(localizedStrings)) {
        // Nome achievement
        if (strings[achievement.name]) {
          achievementData.localizedNames[lang] = strings[achievement.name];
        }
        // Descrizione pre (usando la chiave preDesc)
        if (achievement.preDesc && strings[achievement.preDesc]) {
          achievementData.localizedPreDescriptions[lang] = strings[achievement.preDesc];
        }
        // Descrizione post (usando la chiave postDesc)
        if (achievement.postDesc && strings[achievement.postDesc]) {
          achievementData.localizedPostDescriptions[lang] = strings[achievement.postDesc];
        }
      }
      
      achievements.push(achievementData);
    }
    
    // Ordina per categoria e nome
    achievements.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    logger.info(`Found ${achievements.length} achievements (${achievements.filter(a => a.utilizzi_totali > 0).length} used in scripts)`);
    
    res.json({
      success: true,
      data: achievements,
      count: achievements.length
    });
  } catch (error) {
    logger.error(`Error retrieving achievements: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve achievements',
      message: error.message 
    });
  }
});

// Funzione per scansionare file campaign per utilizzi achievement
async function scanCampaignFilesForAchievements(achievementUsage) {
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
          await parseFileForAchievements(fullPath, relPath, achievementUsage);
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

// Parse file per estrarre utilizzi achievement
async function parseFileForAchievements(filePath, fileName, achievementUsage) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    let currentScript = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Traccia script/mission corrente
      if (line.startsWith('SCRIPT ')) {
        currentScript = line.replace('SCRIPT ', '').trim();
      } else if (line.startsWith('MISSION ')) {
        currentScript = line.replace('MISSION ', '').trim();
      } else if (line === 'END_OF_SCRIPT' || line === 'END_OF_MISSION') {
        currentScript = null;
      }
      
      if (!currentScript) continue;
      
      // Estrai utilizzi achievement
      const upperLine = line.toUpperCase().trim();
      let achievement = null;
      let comando = null;
      
      // UNLOCKACHIEVEMENT <achievement>
      if (upperLine.startsWith('UNLOCKACHIEVEMENT ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          achievement = parts[1];
          comando = 'UNLOCKACHIEVEMENT';
        }
      }
      // SETACHIEVEMENTPROGRESS <achievement> <progress>
      else if (upperLine.startsWith('SETACHIEVEMENTPROGRESS ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          achievement = parts[1];
          comando = 'SETACHIEVEMENTPROGRESS';
        }
      }
      // IFACHIEVEMENTUNLOCKED <achievement>
      else if (upperLine.startsWith('IFACHIEVEMENTUNLOCKED ')) {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          achievement = parts[1];
          comando = 'IFACHIEVEMENTUNLOCKED';
        }
      }
      
      if (achievement && comando) {
        if (!achievementUsage.has(achievement)) {
          achievementUsage.set(achievement, {
            utilizzi_totali: 0,
            script_che_lo_utilizzano: new Set(),
            comandi_utilizzati: new Set()
          });
        }
        
        const usage = achievementUsage.get(achievement);
        usage.utilizzi_totali++;
        usage.script_che_lo_utilizzano.add(currentScript);
        usage.comandi_utilizzati.add(comando);
      }
    }
  } catch (error) {
    logger.warn(`Cannot parse file ${filePath}: ${error.message}`);
  }
}

// API 17: Get File Generico - Carica binary per qualsiasi tipo di file
router.post('/file/binary', async (req, res) => {
  try {
    const { percorsi } = req.body;
    
    logger.info(`API call: POST /api/game/file/binary - Loading ${percorsi?.length || 0} files`);
    
    if (!Array.isArray(percorsi)) {
      return res.status(400).json({ 
        success: false, 
        error: 'percorsi must be an array' 
      });
    }
    
    const results = [];
    
    for (const percorso of percorsi) {
      try {
        // Validazione security path (senza restrizione estensione)
        if (!isValidFilePath(percorso)) {
          throw new Error('Invalid or unsafe path');
        }
        
        const fullPath = path.join(GAME_ROOT, percorso);
        
        if (await fs.pathExists(fullPath)) {
          // Carica file richiesto
          const buffer = await fs.readFile(fullPath);
          const stats = await fs.stat(fullPath);
          const fileType = determineFileType(percorso);
          
          results.push({
            percorso: percorso,
            binary: buffer.toString('base64'),
            successo: true,
            dimensione: stats.size,
            tipo: fileType
          });
        } else {
          // File non trovato - nessun fallback
          results.push({
            percorso: percorso,
            binary: null,
            successo: false,
            errore: 'File not found',
            dimensione: 0,
            tipo: 'unknown'
          });
        }
      } catch (error) {
        logger.warn(`Error loading file ${percorso}: ${error.message}`);
        results.push({
          percorso: percorso,
          binary: null,
          successo: false,
          errore: error.message,
          dimensione: 0,
          tipo: 'unknown'
        });
      }
    }
    
    const successful = results.filter(r => r.successo).length;
    const failed = results.filter(r => !r.successo).length;
    
    logger.info(`File loading completed: ${successful} successful, ${failed} failed`);
    
    res.json({
      success: true,
      data: results,
      stats: {
        richieste: percorsi.length,
        successo: successful,
        falliti: failed
      }
    });
  } catch (error) {
    logger.error(`Error in file binary loading: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load files',
      message: error.message 
    });
  }
});

// Funzione validazione path sicuro (per tutti i tipi di file)
function isValidFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  
  // Normalizza path
  const normalized = path.normalize(filePath);
  
  // Controlla traversal
  if (normalized.includes('..')) return false;
  
  // Controlla caratteri non sicuri
  if (normalized.includes('\0') || normalized.includes('<') || normalized.includes('>')) return false;
  
  return true;
}

// Determina tipo file dall'estensione
function determineFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // Immagini
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
    return 'image';
  }
  
  // Testo/Configurazione
  if (['.txt', '.yaml', '.yml', '.json', '.xml', '.csv', '.md'].includes(ext)) {
    return 'text';
  }
  
  // Audio
  if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
    return 'audio';
  }
  
  // Video
  if (['.mp4', '.avi', '.mov', '.webm'].includes(ext)) {
    return 'video';
  }
  
  // Archivi
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
    return 'archive';
  }
  
  // Documenti
  if (['.pdf', '.doc', '.docx'].includes(ext)) {
    return 'document';
  }
  
  return 'binary';
}

// Esporta router e funzioni per riuso
module.exports = {
  router,
  collectNodeButtons,
  collectRouteButtons
};

// Mantieni compatibilità
module.exports = router;
