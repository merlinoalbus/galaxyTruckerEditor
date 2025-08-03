import { ParsedScript } from '@/types/CampaignEditor';

export const scriptLoaderService = {
  async loadScriptFile(fileName: string, lang: string = 'EN'): Promise<string> {
    try {
      const url = `http://localhost:3001/api/campaign/${lang}/${fileName}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName} for ${lang}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.content || '';
    } catch (error) {
      console.warn(`Could not load ${fileName} for ${lang}:`, error);
      return '';
    }
  },

  async loadAllScriptFiles(): Promise<{ [key: string]: string }> {
    const languages = ['EN', 'CS', 'DE', 'ES', 'FR', 'PL', 'RU'];
    const scriptFiles = [
      'tutorials.txt',
      'scripts1.txt', 
      'scripts2.txt', 
      'scripts3.txt', 
      'scripts4.txt', 
      'scripts5.txt',
      'missions.txt',
      'inits.txt',
      'base_inits.txt',
      'ms_scripts.txt',
      'stdMissions.txt',
      'missions2.txt'
    ];

    const loadedFiles: { [key: string]: string } = {};

    for (const lang of languages) {
      for (const fileName of scriptFiles) {
        const key = `${lang}/${fileName}`;
        loadedFiles[key] = await this.loadScriptFile(fileName, lang);
      }
    }

    return loadedFiles;
  }
};