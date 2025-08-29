// backupManager.js - Sistema di backup per salvataggio script con retry
const fs = require('fs-extra');
const path = require('path');
const { getLogger } = require('./logger');

const logger = getLogger();

// Classe di errore personalizzata per gestire errori di backup/ripristino
class BackupRestoreError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'BackupRestoreError';
    this.details = details;
  }
}

// NUOVA FUNZIONE CON SISTEMA DI BACKUP E RETRY
async function updateScriptInFileMultilingualWithBackup(filePath, scriptName, newContent) {
  const MAX_RETRIES = 5;
  const BACKUP_DIR = path.join(__dirname, '../../backup');
  
  console.log('[BACKUP MANAGER] Function called for:', scriptName);
  console.log('[BACKUP MANAGER] Backup directory:', BACKUP_DIR);
  
  // Assicurati che la cartella backup esista
  await fs.ensureDir(BACKUP_DIR);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${scriptName}_${path.basename(filePath)}_${timestamp}.backup`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);
  
  let existingContent = '';
  let backupCreated = false;
  
  try {
    // Leggi contenuto esistente se il file esiste
    if (await fs.pathExists(filePath)) {
      existingContent = await fs.readFile(filePath, 'utf8');
      // Crea backup del file originale
      await fs.writeFile(backupFilePath, existingContent, 'utf8');
      backupCreated = true;
      logger.info(`Created backup: ${backupFileName}`);
    }
    
    // Prepara il nuovo contenuto
    const updatedContent = prepareUpdatedContent(existingContent, scriptName, newContent);
    
    // Tenta il salvataggio con retry
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await fs.writeFile(filePath, updatedContent, 'utf8');
        
        // Verifica che il file sia stato scritto correttamente
        const writtenContent = await fs.readFile(filePath, 'utf8');
        if (writtenContent === updatedContent) {
          // Salvataggio riuscito, rimuovi backup
          if (backupCreated) {
            await fs.unlink(backupFilePath);
            logger.info(`Successfully saved ${scriptName}, backup removed`);
          }
          return { success: true };
        } else {
          throw new Error('File content verification failed after write');
        }
        
      } catch (writeError) {
        lastError = writeError;
        logger.warn(`Write attempt ${attempt}/${MAX_RETRIES} failed for ${scriptName}: ${writeError.message}`);
        
        if (attempt < MAX_RETRIES) {
          // Attendi prima del prossimo tentativo (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }
    
    // Tutti i tentativi falliti, ripristina dal backup
    if (backupCreated) {
      try {
        await fs.writeFile(filePath, existingContent, 'utf8');
        logger.error(`All ${MAX_RETRIES} write attempts failed for ${scriptName}, restored from backup`);
      } catch (restoreError) {
        logger.error(`CRITICAL: Failed to restore ${scriptName} from backup: ${restoreError.message}`);
        throw new Error(`Write failed and backup restore failed: ${restoreError.message}`);
      }
    }
    
    // Lancia errore con dettagli del backup
    const errorDetails = {
      scriptName,
      filePath,
      backupFile: backupCreated ? backupFileName : null,
      lastError: lastError?.message,
      retriesAttempted: MAX_RETRIES
    };
    
    throw new BackupRestoreError('Script save failed after all retries', errorDetails);
    
  } catch (error) {
    if (error instanceof BackupRestoreError) {
      throw error;
    }
    
    // Errore durante preparazione backup
    const errorDetails = {
      scriptName,
      filePath,
      backupFile: backupCreated ? backupFileName : null,
      lastError: error.message,
      retriesAttempted: 0
    };
    
    throw new BackupRestoreError('Script backup/save preparation failed', errorDetails);
  }
}

// Funzione helper per preparare il contenuto aggiornato
function prepareUpdatedContent(existingContent, scriptName, newContent) {
  // Rimuovi versione esistente dello script
  const scriptStartPattern = new RegExp(`SCRIPT\\s+${scriptName}\\s*\\n`, 'i');
  const scriptEndPattern = /END_OF_SCRIPT\s*\n?/;
  
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
  
  return updatedContent;
}

module.exports = {
  updateScriptInFileMultilingualWithBackup,
  BackupRestoreError,
  prepareUpdatedContent
};