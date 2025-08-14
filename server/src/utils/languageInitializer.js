// languageInitializer.js - Gestisce l'inizializzazione automatica di nuove lingue
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { getLogger } = require('./logger');

const logger = getLogger();

/**
 * Inizializza una nuova lingua creando tutte le strutture necessarie
 * @param {string} languageCode - Codice lingua (es. 'IT', 'JP', etc.)
 * @param {string} gameRoot - Path root del gioco
 * @returns {Promise<boolean>} - true se inizializzazione riuscita
 */
async function initializeLanguage(languageCode, gameRoot) {
  try {
    logger.info(`Initializing new language: ${languageCode}`);
    
    // 1. Crea la cartella principale campaignScripts[LANG]
    const campaignScriptsDir = path.join(gameRoot, 'campaign', `campaignScripts${languageCode}`);
    
    // Verifica se la cartella esiste già
    if (await fs.pathExists(campaignScriptsDir)) {
      logger.info(`Language ${languageCode} already exists at ${campaignScriptsDir}`);
      return true;
    }
    
    // Crea la cartella
    await fs.ensureDir(campaignScriptsDir);
    logger.info(`Created campaign scripts directory: ${campaignScriptsDir}`);
    
    // 2. Crea i file YAML di configurazione base
    
    // nodes.yaml - Configurazione nodi vuota
    const nodesPath = path.join(campaignScriptsDir, 'nodes.yaml');
    const nodesContent = [];
    await fs.writeFile(nodesPath, yaml.dump(nodesContent, { lineWidth: -1 }), 'utf8');
    logger.info(`Created nodes.yaml for ${languageCode}`);
    
    // missions.yaml - Configurazione missioni vuota
    const missionsPath = path.join(campaignScriptsDir, 'missions.yaml');
    const missionsContent = [];
    await fs.writeFile(missionsPath, yaml.dump(missionsContent, { lineWidth: -1 }), 'utf8');
    logger.info(`Created missions.yaml for ${languageCode}`);
    
    // button_labels.yaml - Etichette bottoni vuote
    const buttonLabelsPath = path.join(campaignScriptsDir, 'button_labels.yaml');
    const buttonLabelsContent = {};
    await fs.writeFile(buttonLabelsPath, yaml.dump(buttonLabelsContent, { lineWidth: -1 }), 'utf8');
    logger.info(`Created button_labels.yaml for ${languageCode}`);
    
    // 3. Crea file di localizzazione se non esistono
    const localizationDir = path.join(gameRoot, 'localization_strings');
    if (await fs.pathExists(localizationDir)) {
      const buttonStringsPath = path.join(localizationDir, `button_strings_${languageCode}.yaml`);
      if (!await fs.pathExists(buttonStringsPath)) {
        // Copia da EN se esiste, altrimenti crea vuoto
        const buttonStringsEN = path.join(localizationDir, 'button_strings_EN.yaml');
        if (await fs.pathExists(buttonStringsEN)) {
          await fs.copy(buttonStringsEN, buttonStringsPath);
          logger.info(`Copied button_strings from EN to ${languageCode}`);
        } else {
          await fs.writeFile(buttonStringsPath, yaml.dump({}, { lineWidth: -1 }), 'utf8');
          logger.info(`Created empty button_strings for ${languageCode}`);
        }
      }
    }
    
    // 4. Crea file scripts2[LANG].txt vuoto nella root se necessario
    const scriptsFileName = languageCode === 'EN' ? 'scripts2.txt' : `scripts2${languageCode}.txt`;
    const scriptsPath = path.join(gameRoot, scriptsFileName);
    if (!await fs.pathExists(scriptsPath)) {
      await fs.writeFile(scriptsPath, '', 'utf8');
      logger.info(`Created empty scripts file: ${scriptsFileName}`);
    }
    
    logger.info(`Successfully initialized language ${languageCode}`);
    return true;
    
  } catch (error) {
    logger.error(`Error initializing language ${languageCode}: ${error.message}`);
    throw error;
  }
}

/**
 * Verifica se una lingua è già inizializzata
 * @param {string} languageCode - Codice lingua
 * @param {string} gameRoot - Path root del gioco
 * @returns {Promise<boolean>} - true se la lingua esiste
 */
async function isLanguageInitialized(languageCode, gameRoot) {
  const campaignScriptsDir = path.join(gameRoot, 'campaign', `campaignScripts${languageCode}`);
  return await fs.pathExists(campaignScriptsDir);
}

/**
 * Ottiene lista di tutte le lingue disponibili (inizializzate)
 * @param {string} gameRoot - Path root del gioco
 * @returns {Promise<string[]>} - Array di codici lingua
 */
async function getAvailableLanguages(gameRoot) {
  const campaignDir = path.join(gameRoot, 'campaign');
  const languages = [];
  
  try {
    const entries = await fs.readdir(campaignDir);
    
    for (const entry of entries) {
      // Cerca cartelle che matchano il pattern campaignScripts[LANG]
      const match = entry.match(/^campaignScripts([A-Z]{2,3})$/);
      if (match) {
        languages.push(match[1]);
      }
    }
    
    return languages.sort();
  } catch (error) {
    logger.error(`Error getting available languages: ${error.message}`);
    return [];
  }
}

/**
 * Inizializza una lingua copiando da un'altra lingua esistente
 * @param {string} newLanguageCode - Nuovo codice lingua
 * @param {string} sourceLanguageCode - Lingua da cui copiare
 * @param {string} gameRoot - Path root del gioco
 * @returns {Promise<boolean>} - true se inizializzazione riuscita
 */
async function initializeLanguageFromSource(newLanguageCode, sourceLanguageCode, gameRoot) {
  try {
    logger.info(`Initializing ${newLanguageCode} from source ${sourceLanguageCode}`);
    
    const sourcePath = path.join(gameRoot, 'campaign', `campaignScripts${sourceLanguageCode}`);
    const targetPath = path.join(gameRoot, 'campaign', `campaignScripts${newLanguageCode}`);
    
    // Verifica che la source esista
    if (!await fs.pathExists(sourcePath)) {
      logger.error(`Source language ${sourceLanguageCode} does not exist`);
      return false;
    }
    
    // Verifica che il target non esista già
    if (await fs.pathExists(targetPath)) {
      logger.info(`Target language ${newLanguageCode} already exists`);
      return true;
    }
    
    // Copia l'intera struttura
    await fs.copy(sourcePath, targetPath);
    logger.info(`Copied campaign structure from ${sourceLanguageCode} to ${newLanguageCode}`);
    
    // Copia anche i file di localizzazione se esistono
    const localizationDir = path.join(gameRoot, 'localization_strings');
    if (await fs.pathExists(localizationDir)) {
      const sourceButtonStrings = path.join(localizationDir, `button_strings_${sourceLanguageCode}.yaml`);
      const targetButtonStrings = path.join(localizationDir, `button_strings_${newLanguageCode}.yaml`);
      
      if (await fs.pathExists(sourceButtonStrings) && !await fs.pathExists(targetButtonStrings)) {
        await fs.copy(sourceButtonStrings, targetButtonStrings);
        logger.info(`Copied button_strings from ${sourceLanguageCode} to ${newLanguageCode}`);
      }
    }
    
    // Crea/copia il file scripts principale
    const sourceScriptsFile = sourceLanguageCode === 'EN' ? 'scripts2.txt' : `scripts2${sourceLanguageCode}.txt`;
    const targetScriptsFile = newLanguageCode === 'EN' ? 'scripts2.txt' : `scripts2${newLanguageCode}.txt`;
    
    const sourceScriptsPath = path.join(gameRoot, sourceScriptsFile);
    const targetScriptsPath = path.join(gameRoot, targetScriptsFile);
    
    if (await fs.pathExists(sourceScriptsPath) && !await fs.pathExists(targetScriptsPath)) {
      await fs.copy(sourceScriptsPath, targetScriptsPath);
      logger.info(`Copied scripts file from ${sourceLanguageCode} to ${newLanguageCode}`);
    }
    
    logger.info(`Successfully initialized ${newLanguageCode} from ${sourceLanguageCode}`);
    return true;
    
  } catch (error) {
    logger.error(`Error initializing ${newLanguageCode} from ${sourceLanguageCode}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initializeLanguage,
  isLanguageInitialized,
  getAvailableLanguages,
  initializeLanguageFromSource
};