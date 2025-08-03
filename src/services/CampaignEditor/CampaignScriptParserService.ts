import { 
  ScriptCommand, 
  ParsedScript, 
  ScriptBlock, 
  CampaignAnalysis 
} from '@/types/CampaignEditor';
import { scriptLoaderService } from './CampaignScriptParserService/scriptLoaderService';
import { scriptParserService } from './CampaignScriptParserService/scriptParserService';
import { scriptAnalysisService } from './CampaignScriptParserService/scriptAnalysisService';

interface CampaignScriptParserService {
  loadScriptFile: typeof scriptLoaderService.loadScriptFile;
  loadAllScriptFiles: typeof scriptLoaderService.loadAllScriptFiles;
  parseScriptContent: typeof scriptParserService.parseScriptContent;
  parseCommand: typeof scriptParserService.parseCommand;
  analyzeScripts: typeof scriptAnalysisService.analyzeScripts;
  buildFlowStructure: typeof scriptAnalysisService.buildFlowStructure;
  loadAndAnalyzeAllScripts(): Promise<CampaignAnalysis>;
  getInstance(): CampaignScriptParserService;
}

export const campaignScriptParserService: CampaignScriptParserService = {
  // Delegate to specialized services
  loadScriptFile: scriptLoaderService.loadScriptFile,
  loadAllScriptFiles: scriptLoaderService.loadAllScriptFiles,
  parseScriptContent: scriptParserService.parseScriptContent,
  parseCommand: scriptParserService.parseCommand,
  analyzeScripts: scriptAnalysisService.analyzeScripts,
  buildFlowStructure: scriptAnalysisService.buildFlowStructure,

  async loadAndAnalyzeAllScripts(): Promise<CampaignAnalysis> {
    try {
      // Load all script files
      const loadedFiles = await scriptLoaderService.loadAllScriptFiles();
      
      // Parse all scripts
      const allScripts: ParsedScript[] = [];
      Object.entries(loadedFiles).forEach(([key, content]) => {
        const [lang, fileName] = key.split('/');
        if (content.trim()) {
          const scripts = scriptParserService.parseScriptContent(content, fileName, lang);
          allScripts.push(...scripts);
        }
      });
      
      // Analyze scripts
      const analysis = scriptAnalysisService.analyzeScripts(allScripts);
      
      return analysis;
    } catch (error) {
      console.error('Error loading and analyzing scripts:', error);
      throw error;
    }
  },

  // Legacy compatibility method
  getInstance() {
    return campaignScriptParserService;
  }
};