import { logger } from '@/utils/logger';
import { ParsedScript, CampaignAnalysis } from '@/types/CampaignEditor';
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
  const flowStructure = new Map<string, any[]>();

      // Process scripts from backend - API returns data array directly
      const scriptsArray = parsedData.data || [];
      scriptsArray.forEach((scriptData: any) => {
        const scriptName = scriptData.nomescript || scriptData.name || '';
        const fileName = scriptData.nomefile || scriptData.fileName || '';
        
        const script: ParsedScript = {
          name: scriptName,
          fileName: fileName,
          language: 'EN', // Mantengo EN come default per compatibilità
          languages: scriptData.languages || [], // Array delle lingue supportate
          commands: scriptData.commands || [],
          variables: scriptData.variabili_utilizzate || scriptData.variables || [],
          characters: scriptData.personaggi_utilizzati || scriptData.characters || [],
          missions: scriptData.missions_richiamate || scriptData.missions || [],
          labels: scriptData.labels_definite || scriptData.labels || [],
          nodes: scriptData.nodi_referenziati || scriptData.nodes || [],
          references: scriptData.script_richiamati || [],
          subScripts: scriptData.script_richiamati || [],
          relatedScripts: scriptData.richiamato_da_script || [],
          // Aggiungo i dati numerici del backend per l'analisi complessità
          backendData: {
            numero_comandi: scriptData.numero_comandi || 0,
            numero_blocchi: scriptData.numero_blocchi || 0,
            utilizzi_totali: scriptData.utilizzi_totali || 0,
            stellato: scriptData.stellato || false
          }
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
  logger.error('Error loading and analyzing scripts:', error);
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