import { logger } from '@/utils/logger';
import { BlockType } from './BlockTypes';
import { CMD_EMOJI } from '@/components/Emoji/cmdEmojiMap';
import React from 'react';
import Emoji from '@/components/Emoji/Emoji';
import { StackedEmoji } from '@/components/Emoji/StackedEmoji';
/**
 * Renderizza l'icona di un tool: se contiene più emoji, usa StackedEmoji, altrimenti Emoji.
 * @param icon stringa emoji (anche doppia)
 * @param size dimensione in px (default 22)
 * @param className classi CSS opzionali
 */
export function renderToolIcon(icon: string, size = 22, className = ""): React.ReactNode {
  if (!icon) return null;
  // Estrae solo i caratteri emoji
  const emojiArr = Array.from(icon).filter(e => /\p{Emoji}/u.test(e));
  if (emojiArr.length > 1) {
    return <StackedEmoji emojis={emojiArr} size={size} className={className} />;
  }
  return <Emoji text={icon} className={className} />;
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  blockType: BlockType;
  description?: string;
  implemented: boolean;
  inProgress?: boolean; // Comando in corso di implementazione
  frequency?: number; // Percentuale di utilizzo
  parameters?: string[]; // Parametri richiesti
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  alwaysVisible?: boolean;
  tools: Tool[];
}

// Funzione helper per ottenere le traduzioni
export const getToolCategories = (t: any): ToolCategory[] => {
  try {
    if (!t || typeof t !== 'function') {
      throw new Error('Translation function not available');
    }
    return TOOL_CATEGORIES_DEFINITION(t);
  } catch (error) {
  logger.error('Error loading tool categories:', error);
    // Fallback senza traduzioni
    return [];
  }
};

// Definizione delle categorie e dei comandi - TUTTI I COMANDI RICHIESTI
const TOOL_CATEGORIES_DEFINITION = (t: any): ToolCategory[] => [
  {
    id: 'general',
    name: t('visualFlowEditor.tools.category.general'),
    icon: '⭐',
    alwaysVisible: false,
    tools: [
      // === GRUPPO SCENE/DIALOGHI (più frequenti) ===
    { id: 'showdlgscene', name: 'SHOWDLGSCENE', icon: CMD_EMOJI['SHOWDLGSCENE'], blockType: 'SHOWDLGSCENE', description: t('visualFlowEditor.tools.showDlgScene.description'), implemented: true },
    { id: 'say', name: 'SAY', icon: CMD_EMOJI['SAY'], blockType: 'SAY', description: t('visualFlowEditor.tools.say.description'), implemented: true },
    { id: 'ask', name: 'ASK', icon: CMD_EMOJI['ASK'], blockType: 'ASK', description: t('visualFlowEditor.tools.ask.description'), implemented: true },
  { id: 'hidedlgscene', name: 'HIDEDLGSCENE', icon: CMD_EMOJI['HIDEDLGSCENE'], blockType: 'HIDEDLGSCENE', description: t('visualFlowEditor.tools.hideDlgScene.description'), implemented: true },
      { id: 'announce', name: 'ANNOUNCE', icon: '📢', blockType: 'ANNOUNCE', description: t('visualFlowEditor.tools.announce.description'), implemented: true },
    { id: 'saychar', name: 'SAYCHAR', icon: CMD_EMOJI['SAYCHAR'], blockType: 'SAYCHAR', description: t('visualFlowEditor.tools.sayChar.description'), implemented: true },
      
      // === GRUPPO PERSONAGGI ===
  { id: 'showchar', name: 'SHOWCHAR', icon: CMD_EMOJI['SHOWCHAR'], blockType: 'SHOWCHAR', description: t('visualFlowEditor.tools.showChar.description'), implemented: true },
  { id: 'hidechar', name: 'HIDECHAR', icon: CMD_EMOJI['HIDECHAR'], blockType: 'HIDECHAR', description: t('visualFlowEditor.tools.hideChar.description'), implemented: true },
  { id: 'changechar', name: 'CHANGECHAR', icon: CMD_EMOJI['CHANGECHAR'], blockType: 'CHANGECHAR', description: t('visualFlowEditor.tools.changeChar.description'), implemented: true },
      
      // === GRUPPO CONTROLLO FLUSSO ===
      { id: 'label', name: 'LABEL', icon: CMD_EMOJI['LABEL'], blockType: 'LABEL', description: t('visualFlowEditor.tools.label.description'), implemented: true },
      { id: 'go', name: 'GO', icon: CMD_EMOJI['GO'], blockType: 'GO', description: t('visualFlowEditor.tools.go.description'), implemented: true },
    { id: 'sub_script', name: 'SUB_SCRIPT', icon: CMD_EMOJI['SUB_SCRIPT'], blockType: 'SUB_SCRIPT', description: t('visualFlowEditor.tools.subScript.description'), implemented: true },
    { id: 'return', name: 'RETURN', icon: CMD_EMOJI['RETURN'], blockType: 'RETURN', description: t('visualFlowEditor.tools.return.description'), implemented: true },
  { id: 'exit_menu', name: 'EXIT_MENU', icon: CMD_EMOJI['EXIT_MENU'], blockType: 'EXIT_MENU', description: t('visualFlowEditor.tools.exitMenu.description'), implemented: true },
      
      // === GRUPPO VARIABILI/SEMAFORI ===
  { id: 'set', name: 'SET', icon: CMD_EMOJI['SET'], blockType: 'SET', description: t('visualFlowEditor.tools.set.description'), implemented: true },
  { id: 'reset', name: 'RESET', icon: CMD_EMOJI['RESET'], blockType: 'RESET', description: t('visualFlowEditor.tools.reset.description'), implemented: true },
      
      // === GRUPPO UTILITY ===
  { id: 'delay', name: 'DELAY', icon: CMD_EMOJI['DELAY'], blockType: 'DELAY', description: t('visualFlowEditor.tools.delay.description'), implemented: true }
    ]
  },
  // ... resto delle categorie ...
];
