// localizationController.js - Controller per la gestione delle localization_strings
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { getLogger } = require('../utils/logger');
const config = require('../config/config');

const logger = getLogger();

// Lingue supportate standard
const SUPPORTED_LANGUAGES = ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU'];

// Lingue aggiuntive presenti in alcuni file
const ADDITIONAL_LANGUAGES = ['IT', 'JP', 'RO', 'SP'];

class LocalizationController {
  
  /**
   * Ottiene tutte le categorie di stringhe di localizzazione
   * Restituisce il JSON strutturato secondo le specifiche richieste
   */
  getAllStrings = async (req, res) => {
    try {
      logger.info('Getting all localization strings');
      
      const localizationPath = path.join(config.GAME_ROOT, 'localization_strings');
      
      // Test rapido per verificare che la directory esista
      try {
        await fs.access(localizationPath);
      } catch (accessError) {
        logger.error(`Localization directory not found: ${localizationPath}`);
        return res.status(404).json({
          success: false,
          error: 'Localization directory not found',
          path: localizationPath
        });
      }
      
      // Timeout per evitare blocchi
      const categoriesPromise = this.scanLocalizationCategories(localizationPath);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout scanning categories')), 15000)
      );
      
      const categories = await Promise.race([categoriesPromise, timeoutPromise]);
      
      const result = {
        num_categorystring: categories.length,
        category: categories
      };
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error getting all localization strings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get localization strings',
        message: error.message
      });
    }
  }

  /**
   * Scansiona le categorie di localizzazione nella directory
   */
  async scanLocalizationCategories(localizationPath) {
    const categories = [];
    const categoryMap = new Map();
    
    try {
      // Scansiona la directory principale
      await this.scanDirectory(localizationPath, categoryMap);
      
      // Scansiona le sottocartelle (come credits)
      const items = await fs.readdir(localizationPath, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          const subDir = path.join(localizationPath, item.name);
          try {
            await this.scanDirectory(subDir, categoryMap, item.name);
          } catch (subDirError) {
            logger.warn(`Error scanning subdirectory ${item.name}:`, subDirError.message);
          }
        }
      }
      
      // Converti la mappa in array di categorie con timeout per evitare blocchi
      for (const [categoryName, data] of categoryMap) {
        try {
          const category = await Promise.race([
            this.buildCategoryData(categoryName, data),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Timeout building category ${categoryName}`)), 5000)
            )
          ]);
          categories.push(category);
        } catch (categoryError) {
          logger.warn(`Error building category ${categoryName}:`, categoryError.message);
          // Aggiungi una categoria di fallback
          categories.push({
            id: categoryName.replace(/[\/\\]/g, '_'),
            nome: categoryName,
            numKeys: 0,
            listKeys: []
          });
        }
      }
      
      return categories.sort((a, b) => a.nome.localeCompare(b.nome));
    } catch (error) {
      logger.error('Error scanning localization categories:', error);
      return [];
    }
  }

  /**
   * Scansiona una directory per i file di localizzazione
   */
  async scanDirectory(dirPath, categoryMap, subDir = '') {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      if (!file.endsWith('.yaml')) continue;
      
      // Parsing del nome file: nomegruppo_LINGUA.yaml
      const match = file.match(/^(.+)_([A-Z]{2})\.yaml$/);
      if (!match) continue;
      
      const [, categoryName, language] = match;
      const fullCategoryName = subDir ? `${subDir}/${categoryName}` : categoryName;
      
      if (!categoryMap.has(fullCategoryName)) {
        categoryMap.set(fullCategoryName, {
          path: dirPath,
          languages: new Map(),
          subDir
        });
      }
      
      const filePath = path.join(dirPath, file);
      categoryMap.get(fullCategoryName).languages.set(language, filePath);
    }
  }

  /**
   * Parsing robusto per file YAML con fallback manuale
   */
  parseYamlContent(content, filePath) {
    try {
      // Prima prova con parser YAML standard
      return yaml.load(content) || {};
    } catch (yamlError) {
      logger.debug(`YAML parse failed for ${filePath}, using manual parsing`);
      
      // Fallback: parsing manuale robusto
      const parsed = {};
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        
        const colonIndex = line.indexOf(':');
        if (colonIndex <= 0) continue;
        
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // Gestisci stringhe quotate (singole o doppie)
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        } else if (value.startsWith('"') || value.startsWith("'")) {
          // Stringa multilinea - cerca la chiusura
          const quote = value.charAt(0);
          value = value.substring(1);
          
          while (i + 1 < lines.length && !value.endsWith(quote)) {
            i++;
            value += '\n' + lines[i];
          }
          
          if (value.endsWith(quote)) {
            value = value.slice(0, -1);
          }
        }
        
        // Gestisci valori vuoti
        if (value === '""' || value === "''" || value === '') {
          value = '';
        }
        
        parsed[key] = value;
      }
      
      return parsed;
    }
  }

  /**
   * Costruisce i dati di una categoria con timeout per singolo file
   */
  async buildCategoryData(categoryName, data) {
    try {
      // Usa EN come riferimento per il numero di chiavi, fallback su prima lingua disponibile
      const referenceLanguage = data.languages.has('EN') ? 'EN' : data.languages.keys().next().value;
      const referencePath = data.languages.get(referenceLanguage);
      
      // Leggi il file di riferimento per ottenere le chiavi con timeout
      const content = await Promise.race([
        fs.readFile(referencePath, 'utf8'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout reading reference file')), 2000))
      ]);
      
      const parsed = this.parseYamlContent(content, referencePath);
      const keys = Object.keys(parsed);
      const listKeys = [];
      
      // Per ogni chiave, raccoglie i valori in tutte le lingue (in parallelo)
      const languagePromises = Array.from(data.languages.entries()).map(async ([language, filePath]) => {
        try {
          const langContent = await Promise.race([
            fs.readFile(filePath, 'utf8'),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout reading ${language}`)), 1000))
          ]);
          
          const langParsed = this.parseYamlContent(langContent, filePath);
          return { language, data: langParsed };
        } catch (error) {
          logger.debug(`Error reading ${language} file for ${categoryName}:`, error.message);
          return { language, data: {} };
        }
      });
      
      const languageResults = await Promise.all(languagePromises);
      const languageData = {};
      languageResults.forEach(({ language, data: langData }) => {
        languageData[language] = langData;
      });
      
      // Costruisci la struttura finale con fallback EN
      for (const key of keys) {
        const values = {};
        
        // Prima ottieni il valore EN come fallback
        const enValue = languageData['EN']?.[key] || '';
        
        for (const language of data.languages.keys()) {
          let value = languageData[language]?.[key];
          
          // Se il valore non esiste o è vuoto, usa il fallback EN
          if (!value || value.trim() === '') {
            value = language === 'EN' ? '' : enValue;
          }
          
          values[language] = value;
        }
        
        listKeys.push({
          id: key,
          values: values
        });
      }
      
      return {
        id: categoryName.replace(/[\/\\]/g, '_'), // ID safe per URL
        nome: categoryName,
        numKeys: keys.length,
        listKeys: listKeys
      };
      
    } catch (error) {
      logger.error(`Error building category data for ${categoryName}:`, error);
      return {
        id: categoryName.replace(/[\/\\]/g, '_'),
        nome: categoryName,
        numKeys: 0,
        listKeys: []
      };
    }
  }

  /**
   * Ottiene le stringhe di una categoria specifica
   */
  getStringsByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      logger.info(`Getting strings for category: ${category}`);
      
      // Cerca la categoria (gestisce sia nomi semplici che con sottocartelle)
      const localizationPath = path.join(config.GAME_ROOT, 'localization_strings');
      const categories = await this.scanLocalizationCategories(localizationPath);
      
      const found = categories.find(cat => cat.id === category || cat.nome === category);
      
      if (!found) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }
      
      res.json({
        success: true,
        data: found
      });
      
    } catch (error) {
      logger.error(`Error getting category ${req.params.category}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to get category strings',
        message: error.message
      });
    }
  }

  /**
   * Salva le modifiche per una categoria
   */
  saveCategory = async (req, res) => {
    try {
      const { category } = req.params;
      const { listKeys } = req.body;
      
      logger.info(`Saving category: ${category}`);
      
      if (!listKeys || !Array.isArray(listKeys)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid data format'
        });
      }
      
      const localizationPath = path.join(config.GAME_ROOT, 'localization_strings');
      const categories = await this.scanLocalizationCategories(localizationPath);
      
      const found = categories.find(cat => cat.id === category || cat.nome === category);
      if (!found) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }
      
      // Raggruppa le modifiche per lingua
      const languageChanges = new Map();
      
      for (const keyData of listKeys) {
        for (const [language, value] of Object.entries(keyData.values)) {
          if (!languageChanges.has(language)) {
            languageChanges.set(language, {});
          }
          languageChanges.get(language)[keyData.id] = value;
        }
      }
      
      // Salva i file modificati
      const savedFiles = [];
      const categoryPath = found.nome.includes('/') ? 
        path.join(localizationPath, found.nome.split('/')[0]) : 
        localizationPath;
        
      const baseName = found.nome.includes('/') ? 
        found.nome.split('/')[1] : 
        found.nome;
      
      for (const [language, changes] of languageChanges) {
        const fileName = `${baseName}_${language}.yaml`;
        const filePath = path.join(categoryPath, fileName);
        
        try {
          // Leggi il file esistente per preservare l'ordine e i commenti
          let existingContent = {};
          try {
            const existing = await fs.readFile(filePath, 'utf8');
            existingContent = yaml.load(existing) || {};
          } catch (readError) {
            logger.warn(`Could not read existing file ${filePath}, creating new`);
          }
          
          // Sostituisci completamente il contenuto con quello dal frontend
          const updatedContent = changes;
          
          // Salva il file
          const yamlContent = yaml.dump(updatedContent, {
            indent: 2,
            lineWidth: -1,
            forceQuotes: true,
            quotingType: '"'
          });
          
          await fs.writeFile(filePath, yamlContent, 'utf8');
          savedFiles.push(fileName);
          
        } catch (fileError) {
          logger.error(`Error saving file ${filePath}:`, fileError);
          throw new Error(`Failed to save ${fileName}: ${fileError.message}`);
        }
      }
      
      res.json({
        success: true,
        message: `Category ${category} saved successfully`,
        savedFiles
      });
      
    } catch (error) {
      logger.error(`Error saving category ${req.params.category}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to save category',
        message: error.message
      });
    }
  }

  /**
   * Ottiene le traduzioni dei missions.yaml
   */
  getMissionsTranslations = async (req, res) => {
    try {
      logger.info('Getting missions translations');
      
      const translations = await this.getCampaignFileTranslations('missions.yaml');
      
      res.json({
        success: true,
        data: translations
      });
      
    } catch (error) {
      logger.error('Error getting missions translations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get missions translations',
        message: error.message
      });
    }
  }

  /**
   * Ottiene le traduzioni dei nodes.yaml
   */
  getNodesTranslations = async (req, res) => {
    try {
      logger.info('Getting nodes translations');
      
      const translations = await this.getCampaignFileTranslations('nodes.yaml');
      
      res.json({
        success: true,
        data: translations
      });
      
    } catch (error) {
      logger.error('Error getting nodes translations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get nodes translations',
        message: error.message
      });
    }
  }

  /**
   * Ottiene le traduzioni per un file di campagna (missions.yaml o nodes.yaml)
   */
  async getCampaignFileTranslations(fileName) {
    const campaignPath = path.join(config.GAME_ROOT, 'campaign');
    const translations = [];
    const languagePaths = new Map();
    
    // Trova tutti i file per le lingue
    const items = await fs.readdir(campaignPath, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory() && item.name.startsWith('campaignScripts')) {
        const language = item.name.replace('campaignScripts', '');
        if (language.length === 2) {
          const filePath = path.join(campaignPath, item.name, fileName);
          try {
            await fs.access(filePath);
            languagePaths.set(language, filePath);
          } catch (error) {
            logger.warn(`File ${fileName} not found for language ${language}`);
          }
        }
      }
    }
    
    // Usa EN come riferimento
    const referenceLang = languagePaths.has('EN') ? 'EN' : languagePaths.keys().next().value;
    if (!referenceLang) {
      throw new Error(`No ${fileName} files found`);
    }
    
    const referenceContent = await fs.readFile(languagePaths.get(referenceLang), 'utf8');
    const referenceData = yaml.load(referenceContent) || [];
    
    // Per ogni item nel file di riferimento, raccogli le traduzioni
    for (let i = 0; i < referenceData.length; i++) {
      const item = referenceData[i];
      if (!item || !item.name) continue;
      
      const translations_item = {
        id: item.name,
        index: i,
        translations: {}
      };
      
      // Raccogli le traduzioni da tutte le lingue
      for (const [language, filePath] of languagePaths) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const data = yaml.load(content) || [];
          const langItem = data[i];
          
          if (langItem && langItem.name === item.name) {
            const itemTranslation = {
              caption: langItem.caption || '',
              description: langItem.description || ''
            };
            
            // Aggiungi i buttons se presenti
            if (langItem.buttons && Array.isArray(langItem.buttons)) {
              itemTranslation.buttons = langItem.buttons.map(button => {
                if (Array.isArray(button) && button.length >= 3) {
                  return {
                    id: button[0],
                    action: button[1],
                    text: button[2] || ''
                  };
                }
                return { id: '', action: '', text: '' };
              });
            } else {
              itemTranslation.buttons = [];
            }
            
            translations_item.translations[language] = itemTranslation;
          } else {
            // Cerca per nome se l'indice non corrisponde
            const found = data.find(d => d && d.name === item.name);
            if (found) {
              const foundTranslation = {
                caption: found.caption || '',
                description: found.description || ''
              };
              
              // Aggiungi i buttons se presenti
              if (found.buttons && Array.isArray(found.buttons)) {
                foundTranslation.buttons = found.buttons.map(button => {
                  if (Array.isArray(button) && button.length >= 3) {
                    return {
                      id: button[0],
                      action: button[1],
                      text: button[2] || ''
                    };
                  }
                  return { id: '', action: '', text: '' };
                });
              } else {
                foundTranslation.buttons = [];
              }
              
              translations_item.translations[language] = foundTranslation;
            } else {
              translations_item.translations[language] = {
                caption: '',
                description: '',
                buttons: []
              };
            }
          }
        } catch (error) {
          logger.warn(`Error reading ${fileName} for language ${language}:`, error.message);
          translations_item.translations[language] = {
            caption: '',
            description: '',
            buttons: []
          };
        }
      }
      
      translations.push(translations_item);
    }
    
    return {
      fileName,
      numItems: translations.length,
      items: translations
    };
  }

  /**
   * Salva le modifiche per missions.yaml
   */
  saveMissionsTranslations = async (req, res) => {
    try {
      const { items } = req.body;
      
      logger.info('Saving missions translations');
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid data format'
        });
      }
      
      await this.saveCampaignFileTranslations('missions.yaml', items);
      
      res.json({
        success: true,
        message: 'Missions translations saved successfully'
      });
      
    } catch (error) {
      logger.error('Error saving missions translations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save missions translations',
        message: error.message
      });
    }
  }

  /**
   * Salva le modifiche per nodes.yaml
   */
  saveNodesTranslations = async (req, res) => {
    try {
      const { items } = req.body;
      
      logger.info('Saving nodes translations');
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid data format'
        });
      }
      
      await this.saveCampaignFileTranslations('nodes.yaml', items);
      
      res.json({
        success: true,
        message: 'Nodes translations saved successfully'
      });
      
    } catch (error) {
      logger.error('Error saving nodes translations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save nodes translations',
        message: error.message
      });
    }
  }

  /**
   * Salva le modifiche per un file di campagna PRESERVANDO IL FORMATO ORIGINALE
   */
  async saveCampaignFileTranslations(fileName, items) {
    const campaignPath = path.join(config.GAME_ROOT, 'campaign');
    const languagePaths = new Map();
    
    // Trova tutti i file per le lingue
    const dirItems = await fs.readdir(campaignPath, { withFileTypes: true });
    for (const item of dirItems) {
      if (item.isDirectory() && item.name.startsWith('campaignScripts')) {
        const language = item.name.replace('campaignScripts', '');
        if (language.length === 2) {
          const filePath = path.join(campaignPath, item.name, fileName);
          languagePaths.set(language, filePath);
        }
      }
    }
    
    // Per ogni lingua, aggiorna il file PRESERVANDO IL FORMATO
    for (const [language, filePath] of languagePaths) {
      try {
        // Leggi il contenuto originale come testo (NON yaml.load!)
        let originalContent = '';
        try {
          originalContent = await fs.readFile(filePath, 'utf8');
        } catch (readError) {
          logger.warn(`Could not read existing ${fileName} for ${language}, skipping`);
          continue;
        }
        
        let modifiedContent = originalContent;
        
        // Per ogni item da aggiornare
        for (const item of items) {
          const translation = item.translations[language];
          if (!translation) continue;
          
          // Pattern per trovare il nodo specifico
          const nodePattern = new RegExp(`(^- name:\\s*["']?${item.id}["']?\\s*$)`, 'm');
          const nodeMatch = modifiedContent.match(nodePattern);
          
          if (!nodeMatch) {
            logger.warn(`Node ${item.id} not found in ${language} ${fileName}`);
            continue;
          }
          
          const nodeStartIndex = nodeMatch.index;
          
          // Trova l'inizio del prossimo nodo o la fine del file
          const nextNodePattern = /^- name:/m;
          const restContent = modifiedContent.substring(nodeStartIndex + nodeMatch[0].length);
          const nextNodeMatch = restContent.match(nextNodePattern);
          
          const nodeEndIndex = nextNodeMatch 
            ? nodeStartIndex + nodeMatch[0].length + nextNodeMatch.index
            : modifiedContent.length;
          
          let nodeContent = modifiedContent.substring(nodeStartIndex, nodeEndIndex);
          
          // Aggiorna caption se presente
          if (translation.caption !== undefined && translation.caption !== '') {
            // Pattern che cattura tutto il contenuto tra virgolette, gestendo correttamente virgolette escaped
            const captionPattern = /(caption:\s*")((?:\\.|[^"\\])*)(")|(caption:\s*')((?:\\.|[^'\\])*')(')/;
            if (captionPattern.test(nodeContent)) {
              nodeContent = nodeContent.replace(captionPattern, (match, p1, p2, p3, p4, p5, p6) => {
                if (p1) {
                  // Caso con virgolette doppie - escape le virgolette interne
                  const escapedCaption = translation.caption.replace(/"/g, '\\"');
                  return `${p1}${escapedCaption}${p3}`;
                } else {
                  // Caso con virgolette singole - escape gli apostrofi interni
                  const escapedCaption = translation.caption.replace(/'/g, "\\'");
                  return `${p4}${escapedCaption}${p6}`;
                }
              });
            }
          }
          
          // Aggiorna description se presente
          if (translation.description !== undefined && translation.description !== '') {
            // Pattern che cattura tutto il contenuto tra virgolette, gestendo correttamente virgolette escaped
            const descriptionPattern = /(description:\s*")((?:\\.|[^"\\])*)(")|(description:\s*')((?:\\.|[^'\\])*')(')/;
            if (descriptionPattern.test(nodeContent)) {
              nodeContent = nodeContent.replace(descriptionPattern, (match, p1, p2, p3, p4, p5, p6) => {
                if (p1) {
                  // Caso con virgolette doppie - escape le virgolette interne
                  const escapedDescription = translation.description.replace(/"/g, '\\"');
                  return `${p1}${escapedDescription}${p3}`;
                } else {
                  // Caso con virgolette singole - escape gli apostrofi interni
                  const escapedDescription = translation.description.replace(/'/g, "\\'");
                  return `${p4}${escapedDescription}${p6}`;
                }
              });
            }
          }
          
          // Aggiorna buttons se presente  
          if (translation.buttons !== undefined && Array.isArray(translation.buttons)) {
            // Pattern che cattura l'intera linea dei buttons fino alla fine
            // Usa lookahead per essere sicuri di catturare tutto fino al ]
            const buttonsPattern = /(buttons:\s*\[)[^\n]*(\])/;
            const buttonsMatch = nodeContent.match(buttonsPattern);
            
            if (buttonsMatch) {
              // Ricostruisci l'array dei buttons mantenendo il formato compatto
              const newButtonsArray = translation.buttons.map(button => 
                `[${button.id}, ${button.action}, "${button.text}"]`
              ).join(', ');
              
              // Sostituisci SOLO la prima occorrenza trovata
              nodeContent = nodeContent.replace(buttonsPattern, `$1${newButtonsArray}$2`);
            }
          }
          
          // Sostituisci il nodo nel contenuto modificato
          modifiedContent = modifiedContent.substring(0, nodeStartIndex) + 
                           nodeContent + 
                           modifiedContent.substring(nodeEndIndex);
        }
        
        // Salva il file PRESERVANDO IL FORMATO ORIGINALE
        await fs.writeFile(filePath, modifiedContent, 'utf8');
        
      } catch (fileError) {
        logger.error(`Error saving ${fileName} for language ${language}:`, fileError);
        throw new Error(`Failed to save ${fileName} for ${language}: ${fileError.message}`);
      }
    }
  }

  /**
   * Traduzione AI per singola stringa usando Gemini 2.5 Pro
   */
  aiTranslateString = async (req, res) => {
    try {
      const { text, fromLanguage, toLanguage, context } = req.body;
      
      if (!text || !fromLanguage || !toLanguage) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: text, fromLanguage, toLanguage'
        });
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY missing in environment'
        });
      }
      
      logger.info(`AI translation request: ${fromLanguage} -> ${toLanguage}`);
      
      // Detect metacodes in the text
      const metacodes = text.match(/\[[^\]]+\]/g) || [];
      const codesList = metacodes.length ? `Metacodes: ${metacodes.join(' ')}` : 'Metacodes: none';
      
      const systemPrompt = [
        'You are a professional game localizer. Translate from English to the target language preserving placeholders and metacodes.',
        'Rules:',
        '- Keep every metacode exactly as is, do not translate or remove them (e.g., [NAME], [IMG:something], [NUM], [GENDER:...]).',
        '- Return only the translated string, no quotes, no commentary.',
        '- Prefer idiomatic, natural phrasing for the target language.',
        '- If the English text is already language-agnostic (e.g., only metacodes), still return a target-language appropriate phrasing around the codes when appropriate.',
        '',
        codesList,
        context ? `Context: ${context}` : ''
      ].join('\n');
      
      const body = {
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `Target language: ${toLanguage}` },
              { text: `English: ${text}` }
            ]
          }
        ]
      };
      
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      
      const doCall = async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        
        try {
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
            body: JSON.stringify(body),
            signal: controller.signal
          });
          
          clearTimeout(timeout);
          
          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`Gemini HTTP ${resp.status}: ${txt}`);
          }
          
          const data = await resp.json();
          const candidate = data.candidates?.[0];
          const content = candidate?.content?.parts?.[0]?.text;
          
          if (!content) {
            throw new Error('No translation received from Gemini');
          }
          
          return content.trim();
          
        } catch (error) {
          clearTimeout(timeout);
          throw error;
        }
      };
      
      const translatedText = await doCall();
      
      res.json({
        success: true,
        data: {
          originalText: text,
          translatedText,
          fromLanguage,
          toLanguage,
          context
        }
      });
      
    } catch (error) {
      logger.error('Error in AI translation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to translate string',
        message: error.message
      });
    }
  }

  /**
   * Traduzione AI per intera categoria usando Gemini 2.5 Pro
   */
  aiTranslateCategory = async (req, res) => {
    try {
      const { category, fromLanguage, toLanguage } = req.body;
      
      if (!category || !fromLanguage || !toLanguage) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: category, fromLanguage, toLanguage'
        });
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY missing in environment'
        });
      }
      
      logger.info(`AI category translation: ${category} (${fromLanguage} -> ${toLanguage})`);
      
      // Ottieni la categoria
      const localizationPath = path.join(config.GAME_ROOT, 'localization_strings');
      const categories = await this.scanLocalizationCategories(localizationPath);
      
      const found = categories.find(cat => cat.id === category || cat.nome === category);
      if (!found) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }
      
      // Prepara i testi per la traduzione batch
      const items = [];
      for (const key of found.listKeys) {
        const originalText = key.values[fromLanguage];
        if (originalText && originalText.trim()) {
          items.push({
            id: key.id,
            textEN: originalText,
            metacodesDetected: originalText.match(/\[[^\]]+\]/g) || []
          });
        }
      }
      
      if (items.length === 0) {
        return res.json({
          success: true,
          data: {
            category,
            fromLanguage,
            toLanguage,
            translations: []
          }
        });
      }
      
      const systemPrompt = [
        'You are a professional game localizer. Translate from English to the target language preserving placeholders and metacodes.',
        '- Keep every metacode exactly as is, do not translate or remove them (e.g., [NAME], [IMG:something], [NUM], [GENDER:...]).',
        '- Return only the translated string for each item, in order, nothing else.',
        '- Prefer idiomatic, natural phrasing for the target language.',
        `- Context: These are localization strings for the game "${category}".`
      ].join('\n');
      
      // Compose a single request with numbered items to keep order stable
      const numbered = items.map((it, i) => {
        const codes = Array.isArray(it.metacodesDetected) && it.metacodesDetected.length 
          ? ` Metacodes: ${it.metacodesDetected.join(' ')}` 
          : '';
        return `${i + 1}. ${it.textEN}${codes ? `\n${codes}` : ''}`;
      }).join('\n\n');
      
      const body = {
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `Target language: ${toLanguage}` },
              { text: 'Translate the following entries preserving all metacodes. Reply with one line per entry in the same order, without numbers:' },
              { text: numbered }
            ]
          }
        ]
      };
      
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // Longer timeout per batch
      
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`Gemini HTTP ${resp.status}: ${txt}`);
        }
        
        const data = await resp.json();
        const candidate = data.candidates?.[0];
        const content = candidate?.content?.parts?.[0]?.text;
        
        if (!content) {
          throw new Error('No translation received from Gemini');
        }
        
        // Parse the response to extract individual translations
        const translatedLines = content.trim().split('\n').map(line => line.trim()).filter(line => line);
        const translations = [];
        
        for (let i = 0; i < items.length; i++) {
          const originalItem = items[i];
          let translatedText = translatedLines[i] || originalItem.textEN; // Fallback to original
          
          // Clean up any potential numbering that might have been returned
          translatedText = translatedText.replace(/^\d+\.\s*/, '').trim();
          
          translations.push({
            key: originalItem.id,
            originalText: originalItem.textEN,
            translatedText
          });
        }
        
        res.json({
          success: true,
          data: {
            category,
            fromLanguage,
            toLanguage,
            translations
          }
        });
        
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
      
    } catch (error) {
      logger.error('Error in AI category translation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to translate category',
        message: error.message
      });
    }
  }
}

module.exports = new LocalizationController();