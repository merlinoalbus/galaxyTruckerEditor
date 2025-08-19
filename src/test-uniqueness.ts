import { checkToolbarUniqueness, generateUniquenessReport } from './utils/CampaignEditor/VisualFlowEditor/toolbarUniquenessCheck';

// Mock della funzione di traduzione per il test
const mockTranslation = (key: string) => {
  const translations: Record<string, string> = {
    'visualFlowEditor.tools.category.general': 'General',
    'visualFlowEditor.tools.category.constructs': 'Constructs',
    'visualFlowEditor.tools.category.map': 'Map',
    'visualFlowEditor.tools.category.mission': 'Mission',
    'visualFlowEditor.tools.category.variables': 'Variables',
    'visualFlowEditor.tools.category.info': 'Info',
    'visualFlowEditor.tools.category.credits': 'Credits',
    'visualFlowEditor.tools.category.achievement': 'Achievement',
    'visualFlowEditor.tools.category.characters': 'Characters',
    'visualFlowEditor.tools.category.system': 'System',
  };
  return translations[key] || key;
};

// Esegui la verifica di univocità
console.log('🔍 Starting Toolbar Uniqueness Analysis...\n');

try {
  const report = checkToolbarUniqueness(mockTranslation);
  const formattedReport = generateUniquenessReport(report);
  console.log(formattedReport);
} catch (error) {
  console.error('❌ Error during uniqueness check:', error);
}
