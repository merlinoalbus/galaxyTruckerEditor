import { ParsedScript } from '@/types/CampaignEditor';
import { API_CONFIG, API_ENDPOINTS } from '@/config/constants';

// Cache per evitare richieste duplicate
const fileCache = new Map<string, string | null>();
const existsCache = new Map<string, boolean>();

export const scriptLoaderService = {
  // Metodo principale - usa API /scripts conforme alla documentazione
  async loadParsedScripts(): Promise<any> {
    const cacheKey = 'parsed_scripts';
    
    // Controlla cache
    if (fileCache.has(cacheKey)) {
      const cached = fileCache.get(cacheKey);
      return cached || null;
    }

    try {
      const url = `${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SCRIPTS}`;
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        console.error('Failed to load scripts list:', response.status);
        fileCache.set(cacheKey, null);
        return null;
      }
      
      const data = await response.json();
      
      // Cache risultato positivo
      fileCache.set(cacheKey, data);
      console.log(`Loaded ${data.count} scripts with detailed analysis`);
      return data;
    } catch (error) {
      console.error('Error loading scripts:', error);
      fileCache.set(cacheKey, null);
      return null;
    }
  },

  // Legacy methods aggiornati per usare API /file conforme
  async loadScriptFile(fileName: string, lang: string = 'EN'): Promise<string> {
    const cacheKey = fileName;
    
    if (fileCache.has(cacheKey)) {
      const cached = fileCache.get(cacheKey);
      return cached || '';
    }

    try {
      // Determina il percorso del file basato sul nome e lingua
      const filePath = fileName.includes('scripts2') ? 
        `scripts2${lang === 'EN' ? '' : lang}.txt` : 
        `campaign/${fileName}`;
      
      const url = `${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.FILE_GENERIC(filePath)}`;
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        fileCache.set(cacheKey, null);
        return '';
      }
      
      const data = await response.json();
      const content = data.data?.content || '';
      
      fileCache.set(cacheKey, content);
      return content;
    } catch (error) {
      fileCache.set(cacheKey, null);
      return '';
    }
  },

  async checkFileExists(fileName: string, lang: string = 'EN'): Promise<boolean> {
    const cacheKey = fileName;
    
    if (existsCache.has(cacheKey)) {
      return existsCache.get(cacheKey)!;
    }

    try {
      // Determina il percorso del file basato sul nome e lingua
      const filePath = fileName.includes('scripts2') ? 
        `scripts2${lang === 'EN' ? '' : lang}.txt` : 
        `campaign/${fileName}`;
      
      const url = `${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.FILE_GENERIC(filePath)}`;
      const response = await fetch(url, { method: 'HEAD' });
      const exists = response.ok;
      
      existsCache.set(cacheKey, exists);
      return exists;
    } catch {
      existsCache.set(cacheKey, false);
      return false;
    }
  },

  async loadAllScriptFiles(): Promise<{ [key: string]: string }> {
    console.warn('loadAllScriptFiles is deprecated. Use loadParsedScripts() instead.');
    
    // Per compatibilità, usa la nuova API /scripts e converte il formato
    const scriptsData = await this.loadParsedScripts();
    if (!scriptsData?.data) return {};
    
    const result: { [key: string]: string } = {};
    
    // Converte dal formato API /scripts al formato legacy atteso
    scriptsData.data.forEach((scriptInfo: any) => {
      if (scriptInfo.nomefile && scriptInfo.nomescript) {
        // Per ogni script, carica il contenuto usando API /scripts/{name}
        // Per ora ritorniamo un placeholder fino a quando non implementiamo il caricamento completo
        result[scriptInfo.nomefile] = `SCRIPT ${scriptInfo.nomescript}\n// Content placeholder\nEND_OF_SCRIPTS`;
      }
    });
    
    return result;
  },

  // Svuota cache quando necessario
  clearCache() {
    fileCache.clear();
    existsCache.clear();
  }
};