import { ParsedScript } from '@/types/CampaignEditor';

// Cache per evitare richieste duplicate
const fileCache = new Map<string, string | null>();
const existsCache = new Map<string, boolean>();

export const scriptLoaderService = {
  // Metodo principale - usa la nuova API centralizzata
  async loadParsedScripts(): Promise<any> {
    const cacheKey = 'parsed_scripts';
    
    // Controlla cache
    if (fileCache.has(cacheKey)) {
      const cached = fileCache.get(cacheKey);
      return cached || null;
    }

    try {
      const url = `http://localhost:3001/api/campaign/scripts/parsed`;
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        console.error('Failed to load parsed scripts:', response.status);
        fileCache.set(cacheKey, null);
        return null;
      }
      
      const data = await response.json();
      
      // Cache risultato positivo
      fileCache.set(cacheKey, data);
      console.log(`Loaded ${data.metadata.totalScripts} parsed scripts with detailed entities`);
      return data;
    } catch (error) {
      console.error('Error loading parsed scripts:', error);
      fileCache.set(cacheKey, null);
      return null;
    }
  },

  // Legacy methods mantenuti per compatibilità
  async loadScriptFile(fileName: string, lang: string = 'EN'): Promise<string> {
    const cacheKey = fileName;
    
    if (fileCache.has(cacheKey)) {
      const cached = fileCache.get(cacheKey);
      return cached || '';
    }

    try {
      const url = `http://localhost:3001/api/campaign/${fileName}`;
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        fileCache.set(cacheKey, null);
        return '';
      }
      
      const data = await response.json();
      const content = data.content || '';
      
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
      const url = `http://localhost:3001/api/campaign/${fileName}`;
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
    
    // Per compatibilità, usa la nuova API e converte il formato
    const parsedData = await this.loadParsedScripts();
    if (!parsedData) return {};
    
    const result: { [key: string]: string } = {};
    Object.values(parsedData.scripts).forEach((script: any) => {
      if (script.languages?.EN?.content) {
        result[script.fileName] = script.languages.EN.content.map((cmd: any) => cmd.content).join('\n');
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