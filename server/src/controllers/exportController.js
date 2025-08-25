const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const archiver = require('archiver');
const { getLogger } = require('../utils/logger');
const config = require('../config/config');

const logger = getLogger();

// Lista delle lingue supportate
const SUPPORTED_LANGUAGES = ['EN', 'DE', 'FR', 'ES', 'PL', 'CS', 'RU', 'IT'];

/**
 * Esporta le traduzioni per le lingue specificate
 */
async function exportLanguages(req, res) {
  try {
    const { languages, patchMode, replacementLanguage } = req.body;

    // Validazione input
    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ 
        error: 'Deve essere specificata almeno una lingua' 
      });
    }

    // Verifica che tutte le lingue siano supportate
    const invalidLanguages = languages.filter(lang => !SUPPORTED_LANGUAGES.includes(lang));
    if (invalidLanguages.length > 0) {
      return res.status(400).json({ 
        error: `Lingue non supportate: ${invalidLanguages.join(', ')}` 
      });
    }

    // Validazione modalità PATCH
    if (patchMode) {
      if (languages.length !== 1) {
        return res.status(400).json({ 
          error: 'La modalità PATCH richiede esattamente una lingua' 
        });
      }
      
      if (!replacementLanguage || !SUPPORTED_LANGUAGES.includes(replacementLanguage)) {
        return res.status(400).json({ 
          error: 'Lingua di sostituzione non valida per modalità PATCH' 
        });
      }
      
      if (replacementLanguage === 'EN') {
        return res.status(400).json({ 
          error: 'Non è possibile sostituire la lingua EN' 
        });
      }
    }

    logger.info(`Export richiesto per lingue: ${languages.join(', ')}`);
    if (patchMode) {
      logger.info(`Modalità PATCH: ${languages[0]} -> ${replacementLanguage}`);
    }

    // Genera il nome del file ZIP
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let zipName;
    if (patchMode) {
      zipName = `galaxy-trucker-${languages[0]}-to-${replacementLanguage}-${timestamp}.zip`;
    } else if (languages.length === 1) {
      zipName = `galaxy-trucker-${languages[0]}-${timestamp}.zip`;
    } else {
      zipName = `galaxy-trucker-multilang-${timestamp}.zip`;
    }

    // Imposta headers per download
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipName}"`,
    });

    // Crea l'archivio ZIP con opzioni cross-platform
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Compressione massima
      forceLocalTime: true, // Forza timestamp locali per compatibilità
      forceZip64: false, // Evita ZIP64 a meno che necessario
      store: false // Usa compressione sempre
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        logger.warn(`File non trovato durante l'archiviazione: ${err}`);
      } else {
        throw err;
      }
    });

    archive.on('error', (err) => {
      logger.error(`Errore durante l'archiviazione: ${err}`);
      throw err;
    });

    // Pipe dell'archivio alla response
    archive.pipe(res);

    // Raccogli i file per ogni lingua
    const hasEnglish = languages.includes('EN');
    for (let i = 0; i < languages.length; i++) {
      const lang = languages[i];
      const targetLang = patchMode ? replacementLanguage : lang;
      const isFirstLanguage = (i === 0);
      await addLanguageFiles(archive, lang, targetLang, patchMode, isFirstLanguage, hasEnglish);
    }

    // Aggiungi la guida all'installazione
    const guideContent = generateInstallationGuide(languages, patchMode, replacementLanguage);
    archive.append(guideContent, { name: 'INSTALLATION-GUIDE.txt' });
    archive.append(generateInstallationGuideIT(languages, patchMode, replacementLanguage), { name: 'GUIDA-INSTALLAZIONE.txt' });

    // Finalizza l'archivio
    await archive.finalize();
    
    logger.info(`Export completato per: ${zipName}`);

  } catch (error) {
    logger.error(`Errore durante l'export: ${error.message}`, { error });
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Errore interno durante l\'export', 
        details: error.message 
      });
    }
  }
}

/**
 * Aggiunge i file di una lingua specifica all'archivio
 */
async function addLanguageFiles(archive, sourceLang, targetLang, patchMode, isFirstLanguage, hasEnglish) {
  const gameFolder = config.GAME_HOST;
  
  if (!gameFolder || !fsSync.existsSync(gameFolder)) {
    throw new Error(`Directory di gioco non trovata: ${gameFolder}`);
  }

  // Determina le lingue per i nomi dei percorsi (maiuscole/minuscole)
  const sourceLangUpper = sourceLang.toUpperCase();
  const sourceLangLower = sourceLang.toLowerCase();
  const targetLangUpper = targetLang.toUpperCase();
  const targetLangLower = targetLang.toLowerCase();

  // Lista delle cartelle da includere per ogni lingua
  const languagePaths = [
    {
      source: path.normalize(`advCards/captions_${sourceLangLower}`),
      target: `advCards/captions_${targetLangLower}`
    },
    {
      source: path.normalize(`campaign/campaignScripts${sourceLangUpper}`),
      target: `campaign/campaignScripts${targetLangUpper}`
    },
    {
      source: path.normalize(`customScripts/${sourceLangUpper}`),
      target: `customScripts/${targetLangUpper}`
    },
    {
      source: path.normalize(`Manual/manual_${sourceLangLower}`),
      target: `Manual/manual_${targetLangLower}`
    },
    {
      source: path.normalize(`sd/advCards/captions_${sourceLangLower}`),
      target: `sd/advCards/captions_${targetLangLower}`
    }
  ];

  // File specifici da copiare - in modalità NO PATCH i file sd/ esistono già
  const specificFiles = [];
  
  // File sempre presenti
  specificFiles.push(
    {
      source: path.normalize(`common/flags/${sourceLangUpper}.png`),
      target: `common/flags/${targetLangUpper}.png`
    },
    {
      source: path.normalize(`videos/company_logo_${sourceLangUpper}.png`),
      target: `videos/company_logo_${targetLangUpper}.png`
    },
    {
      source: path.normalize(`videos/intro${sourceLangUpper}.sub`),
      target: `videos/intro${targetLangUpper}.sub`
    }
  );
  
  // File mp3 opzionale
  const mp3Path = path.normalize(`videos/intro${sourceLangUpper}.mp3`);
  if (fsSync.existsSync(path.join(gameFolder, mp3Path))) {
    specificFiles.push({
      source: mp3Path,
      target: `videos/intro${targetLangUpper}.mp3`
    });
  }
  
  // File sd/ - in NO PATCH esistono già, in PATCH vanno creati dai file normali
  if (patchMode) {
    // In modalità PATCH, copia dal file normale
    specificFiles.push(
      {
        source: path.normalize(`common/flags/${sourceLangUpper}.png`),
        target: `sd/common/flags/${targetLangUpper}.png`
      },
      {
        source: path.normalize(`videos/company_logo_${sourceLangUpper}.png`),
        target: `sd/videos/company_logo_${targetLangUpper}.png`
      }
    );
  } else {
    // In modalità NO PATCH, prendi i file sd/ esistenti
    specificFiles.push(
      {
        source: path.normalize(`sd/common/flags/${sourceLangUpper}.png`),
        target: `sd/common/flags/${targetLangUpper}.png`
      },
      {
        source: path.normalize(`sd/videos/company_logo_${sourceLangUpper}.png`),
        target: `sd/videos/company_logo_${targetLangUpper}.png`
      }
    );
  }

  // Aggiungi file di localizzazione
  const localizationDir = path.join(gameFolder, 'localization_strings');
  
  if (fsSync.existsSync(localizationDir)) {
    const localizationFiles = await fs.readdir(localizationDir);
    const matchingFiles = localizationFiles.filter(file => 
      file.endsWith(`_${sourceLangUpper}.yaml`) && !file.includes('credits_')
    );
    
    for (const file of matchingFiles) {
      const sourcePath = path.join(localizationDir, file);
      const targetFile = file.replace(`_${sourceLangUpper}.yaml`, `_${targetLangUpper}.yaml`);
      const targetPath = `localization_strings/${targetFile}`;
      
      if (fsSync.existsSync(sourcePath)) {
        archive.file(sourcePath, { 
          name: targetPath.replace(/\\/g, '/'), 
          mode: 0o644 
        });
        logger.debug(`Aggiunto file di localizzazione: ${targetPath}`);
      }
    }
    
    // Aggiungi il file credits specifico
    const creditsSourcePath = path.join(localizationDir, 'credits', `credits_${sourceLangUpper}.yaml`);
    const creditsTargetPath = `localization_strings/credits/credits_${targetLangUpper}.yaml`;
    
    if (fsSync.existsSync(creditsSourcePath)) {
      archive.file(creditsSourcePath, { 
        name: creditsTargetPath.replace(/\\/g, '/'), 
        mode: 0o644 
      });
      logger.debug(`Aggiunto file credits: ${creditsTargetPath}`);
    } else {
      logger.warn(`File credits non trovato: ${creditsSourcePath}`);
    }
  }

  // Aggiungi cartelle
  for (const pathConfig of languagePaths) {
    const sourcePath = path.join(gameFolder, pathConfig.source);
    const targetPath = pathConfig.target.replace(/\\/g, '/');
    
    if (fsSync.existsSync(sourcePath)) {
      await addDirectoryToArchive(archive, sourcePath, targetPath);
      logger.debug(`Aggiunta cartella: ${targetPath}`);
    } else {
      logger.warn(`Cartella non trovata: ${sourcePath}`);
    }
  }

  // Aggiungi file specifici
  for (const fileConfig of specificFiles) {
    const sourcePath = path.join(gameFolder, fileConfig.source);
    const targetPath = fileConfig.target.replace(/\\/g, '/');
    
    if (fsSync.existsSync(sourcePath)) {
      archive.file(sourcePath, { 
        name: targetPath, 
        mode: 0o644 
      });
      logger.debug(`Aggiunto file specifico: ${targetPath}`);
    } else {
      logger.warn(`File non trovato: ${sourcePath}`);
    }
  }

  // Aggiungi videos/podklady/ENG_kanal.png solo alla prima lingua processata
  if (isFirstLanguage) {
    if (patchMode) {
      // In modalità PATCH, usa il company_logo della lingua sorgente
      const companyLogoSource = path.join(gameFolder, `videos/company_logo_${sourceLangUpper}.png`);
      if (fsSync.existsSync(companyLogoSource)) {
        archive.file(companyLogoSource, { 
          name: 'videos/podklady/ENG_kanal.png',
          mode: 0o644 
        });
        logger.debug('Aggiunto: videos/podklady/ENG_kanal.png (da company_logo in modalità PATCH)');
      } else {
        logger.warn(`Logo aziendale per ENG_kanal non trovato: ${companyLogoSource}`);
      }
    } else {
      // In modalità NO PATCH, controlla se EN è tra le lingue selezionate
      if (hasEnglish) {
        // Se EN è tra le lingue, usa company_logo_EN.png
        const companyLogoEN = path.join(gameFolder, 'videos/company_logo_EN.png');
        if (fsSync.existsSync(companyLogoEN)) {
          archive.file(companyLogoEN, { 
            name: 'videos/podklady/ENG_kanal.png',
            mode: 0o644 
          });
          logger.debug('Aggiunto: videos/podklady/ENG_kanal.png (da company_logo_EN.png)');
        } else {
          logger.warn(`company_logo_EN.png non trovato`);
        }
      } else {
        // Se EN NON è tra le lingue, usa il file originale ENG_kanal.png
        const engKanalSource = path.join(gameFolder, 'videos/podklady/ENG_kanal.png');
        if (fsSync.existsSync(engKanalSource)) {
          archive.file(engKanalSource, { 
            name: 'videos/podklady/ENG_kanal.png',
            mode: 0o644 
          });
          logger.debug('Aggiunto: videos/podklady/ENG_kanal.png (file originale)');
        } else {
          logger.warn(`ENG_kanal.png originale non trovato`);
        }
      }
    }
  }

  // Se la lingua sorgente è EN, aggiungi anche i file .txt di customScripts
  if (sourceLangUpper === 'EN') {
    const customScriptsDir = path.join(gameFolder, 'customScripts');
    if (fsSync.existsSync(customScriptsDir)) {
      const txtFiles = await fs.readdir(customScriptsDir);
      const matchingTxtFiles = txtFiles.filter(file => file.endsWith('.txt'));
      
      for (const file of matchingTxtFiles) {
        const sourcePath = path.join(customScriptsDir, file);
        const targetPath = `customScripts/${file}`;
        
        if (fsSync.existsSync(sourcePath)) {
          archive.file(sourcePath, { name: targetPath });
          logger.debug(`Aggiunto file TXT: ${targetPath}`);
        }
      }
    }
  }
}

/**
 * Aggiunge ricorsivamente una directory all'archivio
 */
async function addDirectoryToArchive(archive, sourcePath, targetPath) {
  try {
    const stats = await fs.stat(sourcePath);
    
    if (stats.isDirectory()) {
      const items = await fs.readdir(sourcePath);
      
      for (const item of items) {
        const itemSourcePath = path.join(sourcePath, item);
        // Assicurati che i path nel ZIP usino sempre / anche su Windows
        const itemTargetPath = `${targetPath}/${item}`.replace(/\\/g, '/');
        
        const itemStats = await fs.stat(itemSourcePath);
        if (itemStats.isDirectory()) {
          await addDirectoryToArchive(archive, itemSourcePath, itemTargetPath);
        } else {
          // Aggiungi opzioni per preservare formato cross-platform
          archive.file(itemSourcePath, { 
            name: itemTargetPath,
            mode: 0o644 // Permessi standard per i file
          });
        }
      }
    } else {
      // File singolo - normalizza path per ZIP
      const normalizedTargetPath = targetPath.replace(/\\/g, '/');
      archive.file(sourcePath, { 
        name: normalizedTargetPath,
        mode: 0o644
      });
    }
  } catch (error) {
    logger.warn(`Errore durante l'aggiunta della directory ${sourcePath}: ${error.message}`);
  }
}

/**
 * Genera la guida all'installazione in inglese
 */
function generateInstallationGuide(languages, patchMode, replacementLanguage) {
  let content = `GALAXY TRUCKER - TRANSLATION INSTALLATION GUIDE
===============================================

EXPORTED LANGUAGES: ${languages.join(', ')}
EXPORT DATE: ${new Date().toISOString()}
${patchMode ? `PATCH MODE: ${languages[0]} -> ${replacementLanguage}` : ''}

INSTALLATION INSTRUCTIONS:
--------------------------

1. LOCATE YOUR GALAXY TRUCKER INSTALLATION:
   - Steam: Usually in "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Galaxy Trucker"
   - Other platforms: Check your games library

2. BACKUP YOUR CURRENT GAME FILES:
   - Make a copy of your Galaxy Trucker folder before proceeding
   - This allows you to restore the original files if needed

3. EXTRACT AND INSTALL:
   - Extract this ZIP file
   - Copy all extracted files to your Galaxy Trucker installation folder
   - Choose "Replace" when prompted to overwrite existing files

IMPORTANT NOTES:
----------------

`;

  if (patchMode) {
    content += `• PATCH MODE ACTIVE: This installation will replace ${replacementLanguage} language files with ${languages[0]} language content
• The ${replacementLanguage} language flag will still show in-game, but content will be in ${languages[0]}
• To access this language, select ${replacementLanguage} in the game's language settings
• LANGUAGE SELECTION: Once files are replaced, you can select the language from the game menu by relying on the displayed flags, even if the text indicates a different (original pre-patch) language

`;
  } else {
    content += `• LANGUAGE INSTALLATION: This adds/updates ${languages.join(' and ')} language support
• Even if the game was prepared for Italian (IT), it cannot be enabled as an actual FLAG
• However, you can replace an existing language with the installed content
• LANGUAGE SELECTION: Once files are replaced, you can select the language from the game menu by relying on the displayed flags, even if the text indicates a different (original pre-patch) language

`;
  }

  content += `• NEW GAME LEVELS: If you have custom scripts or additional game levels, you must export 
  and install ALL languages for them to work properly

• GAME COMPATIBILITY: These files are compatible with Galaxy Trucker version 2.0+

TROUBLESHOOTING:
----------------

• If the game doesn't start, verify all files were extracted to the correct location
• If translations don't appear, check that you selected the correct language in game settings
• For custom content, ensure all language files are present and properly named

For support, visit: https://github.com/your-repo/galaxy-trucker-translations
`;

  return content;
}

/**
 * Genera la guida all'installazione in italiano
 */
function generateInstallationGuideIT(languages, patchMode, replacementLanguage) {
  let content = `GALAXY TRUCKER - GUIDA INSTALLAZIONE TRADUZIONI
==============================================

LINGUE ESPORTATE: ${languages.join(', ')}
DATA ESPORTAZIONE: ${new Date().toISOString()}
${patchMode ? `MODALITÀ PATCH: ${languages[0]} -> ${replacementLanguage}` : ''}

ISTRUZIONI PER L'INSTALLAZIONE:
-------------------------------

1. TROVA LA CARTELLA DI GALAXY TRUCKER:
   - Steam: Solitamente in "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Galaxy Trucker"
   - Altre piattaforme: Controlla nella tua libreria giochi

2. FAI UN BACKUP DEI FILE ATTUALI:
   - Fai una copia della cartella Galaxy Trucker prima di procedere
   - Questo ti permette di ripristinare i file originali se necessario

3. ESTRAI E INSTALLA:
   - Estrai questo file ZIP
   - Copia tutti i file estratti nella cartella di installazione di Galaxy Trucker
   - Scegli "Sostituisci" quando richiesto di sovrascrivere i file esistenti

NOTE IMPORTANTI:
----------------

`;

  if (patchMode) {
    content += `• MODALITÀ PATCH ATTIVA: Questa installazione sostituirà i file della lingua ${replacementLanguage} con il contenuto della lingua ${languages[0]}
• La bandiera della lingua ${replacementLanguage} apparirà ancora nel gioco, ma il contenuto sarà in ${languages[0]}
• Per accedere a questa lingua, seleziona ${replacementLanguage} nelle impostazioni lingua del gioco
• SELEZIONE LINGUA: Una volta sostituiti i file, potrai selezionare la lingua dal menu di gioco facendo affidamento alle bandiere visualizzate, anche se il testo indica una lingua differente (originale pre-patch)

`;
  } else {
    content += `• INSTALLAZIONE LINGUE: Questo aggiunge/aggiorna il supporto per ${languages.join(' e ')}
• Anche se il gioco era predisposto per l'Italiano (IT), non è possibile abilitarlo come BANDIERA effettiva
• Tuttavia, puoi sostituire una lingua esistente con il contenuto installato
• SELEZIONE LINGUA: Una volta sostituiti i file, potrai selezionare la lingua dal menu di gioco facendo affidamento alle bandiere visualizzate, anche se il testo indica una lingua differente (originale pre-patch)

`;
  }

  content += `• NUOVI LIVELLI DI GIOCO: Se hai script personalizzati o livelli aggiuntivi, devi esportare 
  e installare TUTTE le lingue perché funzionino correttamente

• COMPATIBILITÀ GIOCO: Questi file sono compatibili con Galaxy Trucker versione 2.0+

RISOLUZIONE PROBLEMI:
---------------------

• Se il gioco non si avvia, verifica che tutti i file siano stati estratti nella posizione corretta
• Se le traduzioni non appaiono, controlla di aver selezionato la lingua corretta nelle impostazioni
• Per contenuti personalizzati, assicurati che tutti i file delle lingue siano presenti e nominati correttamente

Per supporto, visita: https://github.com/your-repo/galaxy-trucker-translations
`;

  return content;
}

module.exports = {
  exportLanguages
};