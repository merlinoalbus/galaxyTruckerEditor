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
  getEmptyAnalysis(): CampaignAnalysis;
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
      // Use new centralized API
      const parsedData = await scriptLoaderService.loadParsedScripts();
      
      if (!parsedData) {
        console.info('No parsed scripts data received - providing empty analysis');
        return this.getEmptyAnalysis();
      }
      
      // Convert backend format to frontend CampaignAnalysis format
      const scripts: ParsedScript[] = [];
      const scriptMap = new Map<string, ParsedScript>();
      const scriptConnections = new Map<string, string[]>();
      const variables = new Set<string>();
      const semafori = new Set<string>();
      const realVariables = new Set<string>();
      const characters = new Set<string>();
      const missions = new Set<string>();
      const labels = new Set<string>();
      const nodeScriptMap = new Map<string, string[]>();
      const flowStructure = new Map<string, ScriptBlock[]>();

      // Process scripts from backend
      Object.values(parsedData.scripts).forEach((scriptData: any) => {
        const script: ParsedScript = {
          name: scriptData.name,
          fileName: scriptData.fileName,
          language: 'EN', // Primary language
          commands: scriptData.commands || [],
          variables: scriptData.variables || [],
          characters: scriptData.characters || [],
          missions: scriptData.missions || [],
          labels: scriptData.labels || [],
          nodes: scriptData.nodes || [],
          references: [],
          subScripts: [],
          relatedScripts: []
        };
        
        scripts.push(script);
        scriptMap.set(script.name, script);
        
        // Add to global sets (legacy compatibility)
        script.variables.forEach(v => variables.add(v));
        script.characters.forEach(c => characters.add(c));
        script.missions.forEach(m => missions.add(m));
        script.labels.forEach(l => labels.add(l));
        script.nodes.forEach(n => {
          if (!nodeScriptMap.has(n)) {
            nodeScriptMap.set(n, []);
          }
          nodeScriptMap.get(n)!.push(script.name);
        });
      });

      // Add backend entities to global sets
      Object.keys(parsedData.semafori || {}).forEach(s => semafori.add(s));
      Object.keys(parsedData.variables || {}).forEach(v => realVariables.add(v));
      Object.keys(parsedData.characters || {}).forEach(c => characters.add(c));
      Object.keys(parsedData.labels || {}).forEach(l => labels.add(l));

      console.info(`Loaded ${scripts.length} scripts with detailed backend parsing`);
      
      return {
        scripts,
        scriptMap,
        scriptConnections,
        variables,
        characters,
        missions,
        semafori,
        realVariables,
        labels,
        nodeScriptMap,
        flowStructure,
        // Add backend detailed data
        backendData: {
          semafori: parsedData.semafori,
          variables: parsedData.variables,
          characters: parsedData.characters,
          labels: parsedData.labels,
          nodes: parsedData.nodes,
          metadata: parsedData.metadata
        }
      } as any;
      
    } catch (error) {
      console.error('Error loading and analyzing scripts:', error);
      return this.getEmptyAnalysis();
    }
  },

  getEmptyAnalysis(): CampaignAnalysis {
    return {
      scripts: [],
      scriptMap: new Map(),
      scriptConnections: new Map(),
      variables: new Set(),
      characters: new Set(), 
      missions: new Set(),
      semafori: new Set(),
      realVariables: new Set(),
      labels: new Set(),
      nodeScriptMap: new Map(),
      flowStructure: new Map()
    };
  },

  // Legacy compatibility method
  getInstance() {
    return campaignScriptParserService;
  }
};