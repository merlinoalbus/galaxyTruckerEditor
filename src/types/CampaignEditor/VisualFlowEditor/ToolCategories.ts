/** @jsxImportSource react */
// Forza il supporto JSX per TypeScript

import React from 'react';
import { logger } from '@/utils/logger';
import { BlockType } from './BlockTypes';
import { CMD_EMOJI } from '@/components/Emoji/cmdEmojiMap';
import Emoji from '@/components/Emoji/Emoji';
import { StackedEmoji } from '@/components/Emoji/StackedEmoji';
/**
 * Renderizza l'icona di un tool: se contiene più emoji, usa StackedEmoji, altrimenti Emoji.
 * @param icon stringa emoji (anche doppia)
 * @param size dimensione in px (default 22)
 * @param className classi CSS opzionali
 */
export function renderToolIcon(icon: string, size = 22, className = ""): React.ReactElement | null {
  if (!icon) return null;
  
  // Usa una funzione più robusta per separare le emoji
  const emojiRegex = /\p{Emoji}(\p{Emoji_Modifier}|\uFE0F|\u200D\p{Emoji})*|\p{Emoji_Presentation}/gu;
  const emojiMatches = icon.match(emojiRegex);
  const emojiArr: string[] = emojiMatches || [];
  
  if (emojiArr.length > 1) {
    return React.createElement(StackedEmoji, { emojis: emojiArr, size, className });
  }
  return React.createElement(Emoji, { text: icon, className });
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
  {
    id: 'constructs',
    name: t('visualFlowEditor.tools.category.constructs'),
    icon: '📦',
    alwaysVisible: false,
    tools: [
    { id: 'if', name: 'IF', icon: CMD_EMOJI['IF'], blockType: 'IF', description: t('visualFlowEditor.tools.if.description'), implemented: true },
    { id: 'menu', name: 'MENU', icon: CMD_EMOJI['MENU'], blockType: 'MENU', description: t('visualFlowEditor.tools.menu.description'), implemented: true },
  { id: 'opt', name: 'OPT', icon: CMD_EMOJI['OPT'], blockType: 'OPT', description: t('visualFlowEditor.tools.opt.description'), implemented: true },
  { id: 'build', name: 'BUILD', icon: CMD_EMOJI['BUILD'], blockType: 'BUILD', description: t('visualFlowEditor.tools.build.description'), implemented: true },
  { id: 'flight', name: 'FLIGHT', icon: CMD_EMOJI['FLIGHT'], blockType: 'FLIGHT', description: t('visualFlowEditor.tools.flight.description'), implemented: true }
    ]
  },
  {
    id: 'map',
    name: t('visualFlowEditor.tools.category.map'),
  icon: '🧭',
    tools: [
    { id: 'shownode', name: 'SHOWNODE', icon: CMD_EMOJI['SHOWNODE'], blockType: 'SHOWNODE', description: t('visualFlowEditor.tools.showNode.description'), implemented: true },
  { id: 'hidenode', name: 'HIDENODE', icon: CMD_EMOJI['HIDENODE'], blockType: 'HIDENODE', description: t('visualFlowEditor.tools.hideNode.description'), implemented: true },
  { id: 'addnode', name: 'ADDNODE', icon: CMD_EMOJI['ADDNODE'], blockType: 'ADDNODE', description: t('visualFlowEditor.tools.addNode.description'), implemented: true },
  { id: 'setnodeknown', name: 'SETNODEKNOWN', icon: CMD_EMOJI['SETNODEKNOWN'], blockType: 'SETNODEKNOWN', description: t('visualFlowEditor.tools.setNodeKnown.description'), implemented: true },
    { id: 'showpath', name: 'SHOWPATH', icon: CMD_EMOJI['SHOWPATH'], blockType: 'SHOWPATH', description: t('visualFlowEditor.tools.showPath.description'), implemented: true },
  { id: 'hidepath', name: 'HIDEPATH', icon: CMD_EMOJI['HIDEPATH'], blockType: 'HIDEPATH', description: t('visualFlowEditor.tools.hidePath.description'), implemented: true },
      { id: 'hideallpaths', name: 'HIDEALLPATHS', icon: CMD_EMOJI['HIDEALLPATHS'], blockType: 'HIDEALLPATHS', description: t('visualFlowEditor.tools.hideAllPaths.description'), implemented: true },
  { id: 'hidebutton', name: 'HIDEBUTTON', icon: CMD_EMOJI['HIDEBUTTON'], blockType: 'HIDEBUTTON', description: t('visualFlowEditor.tools.hideButton.description'), implemented: true },
    { id: 'showbutton', name: 'SHOWBUTTON', icon: CMD_EMOJI['SHOWBUTTON'], blockType: 'SHOWBUTTON', description: t('visualFlowEditor.tools.showButton.description'), implemented: true },
  { id: 'setfocus', name: 'SETFOCUS', icon: CMD_EMOJI['SETFOCUS'], blockType: 'SETFOCUS', description: t('visualFlowEditor.tools.setFocus.description'), implemented: true },
    { id: 'resetfocus', name: 'RESETFOCUS', icon: CMD_EMOJI['RESETFOCUS'], blockType: 'RESETFOCUS', description: t('visualFlowEditor.tools.resetFocus.description'), implemented: true },
    { id: 'centermapbypath', name: 'CENTERMAPBYPATH', icon: CMD_EMOJI['CENTERMAPBYPATH'], blockType: 'CENTERMAPBYPATH', description: t('visualFlowEditor.tools.centerMapByPath.description'), implemented: true },
  { id: 'centermapbynode', name: 'CENTERMAPBYNODE', icon: CMD_EMOJI['CENTERMAPBYNODE'], blockType: 'CENTERMAPBYNODE', description: t('visualFlowEditor.tools.centerMapByNode.description'), implemented: true },
      { id: 'moveplayertonode', name: 'MOVEPLAYERTONODE', icon: CMD_EMOJI['MOVEPLAYERTONODE'], blockType: 'MOVEPLAYERTONODE', description: t('visualFlowEditor.tools.movePlayerToNode.description'), implemented: true }
    ]
  },
  {
    id: 'mission',
    name: t('visualFlowEditor.tools.category.mission'),
    icon: '⚔️',
    tools: [
    { id: 'addopponent', name: 'ADDOPPONENT', icon: CMD_EMOJI['ADDOPPONENT'], blockType: 'ADDOPPONENT', description: t('visualFlowEditor.tools.addOpponent.description'), implemented: true },
    { id: 'setshiptype', name: 'SETSHIPTYPE', icon: CMD_EMOJI['SETSHIPTYPE'], blockType: 'SETSHIPTYPE', description: t('visualFlowEditor.tools.setShipType.description'), implemented: true },
    { id: 'addparttoship', name: 'ADDPARTTOSHIP', icon: CMD_EMOJI['ADDPARTTOSHIP'], blockType: 'ADDPARTTOSHIP', description: t('visualFlowEditor.tools.addPartToShip.description'), implemented: true },
    { id: 'addparttoasideslot', name: 'ADDPARTTOASIDESLOT', icon: CMD_EMOJI['ADDPARTTOASIDESLOT'], blockType: 'ADDPARTTOASIDESLOT', description: t('visualFlowEditor.tools.addPartToAsideSlot.description'), implemented: true },
    { id: 'addshipparts', name: 'ADDSHIPPARTS', icon: CMD_EMOJI['ADDSHIPPARTS'], blockType: 'ADDSHIPPARTS', description: t('visualFlowEditor.tools.addShipParts.description'), implemented: true },
  { id: 'act_mission', name: 'ACT_MISSION', icon: CMD_EMOJI['ACT_MISSION'], blockType: 'ACT_MISSION', description: t('visualFlowEditor.tools.actMission.description'), implemented: true },
  { id: 'setdeckpreparationscript', name: 'SETDECKPREPARATIONSCRIPT', icon: CMD_EMOJI['SETDECKPREPARATIONSCRIPT'], blockType: 'SETDECKPREPARATIONSCRIPT', description: t('visualFlowEditor.tools.setDeckPreparationScript.description'), implemented: true },
  { id: 'setflightdeckpreparationscript', name: 'SETFLIGHTDECKPREPARATIONSCRIPT', icon: CMD_EMOJI['SETFLIGHTDECKPREPARATIONSCRIPT'], blockType: 'SETFLIGHTDECKPREPARATIONSCRIPT', description: t('visualFlowEditor.tools.setFlightDeckPreparationScript.description'), implemented: true },
  { id: 'setadvpile', name: 'SETADVPILE', icon: CMD_EMOJI['SETADVPILE'], blockType: 'SETADVPILE', description: t('visualFlowEditor.tools.setAdvPile.description'), implemented: true },
  { id: 'setsecretadvpile', name: 'SETSECRETADVPILE', icon: CMD_EMOJI['SETSECRETADVPILE'], blockType: 'SETSECRETADVPILE', description: t('visualFlowEditor.tools.setSecretAdvPile.description'), implemented: true },
  { id: 'setspeccnondition', name: 'SETSPECCONDITION', icon: CMD_EMOJI['SETSPECCONDITION'], blockType: 'SETSPECCONDITION', description: t('visualFlowEditor.tools.setSpecCondition.description'), implemented: true },
  { id: 'modifyopponentsbuildspeed', name: 'MODIFYOPPONENTSBUILDSPEED', icon: CMD_EMOJI['MODIFYOPPONENTSBUILDSPEED'], blockType: 'MODIFYOPPONENTSBUILDSPEED', description: t('visualFlowEditor.tools.modifyOpponentsBuildSpeed.description'), implemented: true },
  { id: 'setturnbased', name: 'SETTURNBASED', icon: CMD_EMOJI['SETTURNBASED'], blockType: 'SETTURNBASED', description: t('visualFlowEditor.tools.setTurnBased.description'), implemented: true },
  { id: 'setmissionasfailed', name: 'SETMISSIONASFAILED', icon: CMD_EMOJI['SETMISSIONASFAILED'], blockType: 'SETMISSIONASFAILED', description: t('visualFlowEditor.tools.setMissionAsFailed.description'), implemented: true },
  { id: 'setmissionascompleted', name: 'SETMISSIONASCOMPLETED', icon: CMD_EMOJI['SETMISSIONASCOMPLETED'], blockType: 'SETMISSIONASCOMPLETED', description: t('visualFlowEditor.tools.setMissionAsCompleted.description'), implemented: true },
  { id: 'allshipsgiveup', name: 'ALLSHIPSGIVEUP', icon: CMD_EMOJI['ALLSHIPSGIVEUP'], blockType: 'ALLSHIPSGIVEUP', description: t('visualFlowEditor.tools.allShipsGiveUp.description'), implemented: true },
  { id: 'giveupflight', name: 'GIVEUPFLIGHT', icon: CMD_EMOJI['GIVEUPFLIGHT'], blockType: 'GIVEUPFLIGHT', description: t('visualFlowEditor.tools.giveUpFlight.description'), implemented: true }
    ]
  },
  {
    id: 'variables',
    name: t('visualFlowEditor.tools.category.variables'),
  icon: '🧮',
    tools: [
    { id: 'set_to', name: 'SET_TO', icon: CMD_EMOJI['SET_TO'], blockType: 'SET_TO', description: t('visualFlowEditor.tools.setTo.description'), implemented: true },
    { id: 'add', name: 'ADD', icon: CMD_EMOJI['ADD'], blockType: 'ADD', description: t('visualFlowEditor.tools.add.description'), implemented: true },
    { id: 'setfocusifcredits', name: 'SETFOCUSIFCREDITS', icon: CMD_EMOJI['SETFOCUSIFCREDITS'], blockType: 'SETFOCUSIFCREDITS', description: t('visualFlowEditor.tools.setFocusIfCredits.description'), implemented: true, inProgress: false }
    ]
  },
  {
    id: 'info',
    name: t('visualFlowEditor.tools.category.info'),
    icon: 'ℹ️',
    tools: [
  { id: 'addinfowindow', name: 'ADDINFOWINDOW', icon: CMD_EMOJI['ADDINFOWINDOW'], blockType: 'ADDINFOWINDOW', description: t('visualFlowEditor.tools.addInfoWindow.description'), implemented: true },
    { id: 'showinfowindow', name: 'SHOWINFOWINDOW', icon: CMD_EMOJI['SHOWINFOWINDOW'], blockType: 'SHOWINFOWINDOW', description: t('visualFlowEditor.tools.showInfoWindow.description'), implemented: true },
  { id: 'showhelpimage', name: 'SHOWHELPIMAGE', icon: CMD_EMOJI['SHOWHELPIMAGE'], blockType: 'SHOWHELPIMAGE', description: t('visualFlowEditor.tools.showHelpImage.description'), implemented: true },
  { id: 'buildinghelpscript', name: 'BUILDINGHELPSCRIPT', icon: CMD_EMOJI['BUILDINGHELPSCRIPT'], blockType: 'BUILDINGHELPSCRIPT', description: t('visualFlowEditor.tools.buildingHelpScript.description'), implemented: false },
  { id: 'flighthelpscript', name: 'FLIGHTHELPSCRIPT', icon: CMD_EMOJI['FLIGHTHELPSCRIPT'], blockType: 'FLIGHTHELPSCRIPT', description: t('visualFlowEditor.tools.flightHelpScript.description'), implemented: false },
    { id: 'alienhelpscript', name: 'ALIENHELPSCRIPT', icon: CMD_EMOJI['ALIENHELPSCRIPT'], blockType: 'ALIENHELPSCRIPT', description: t('visualFlowEditor.tools.alienHelpScript.description'), implemented: false }
    ]
  },
  {
    id: 'credits',
    name: t('visualFlowEditor.tools.category.credits'),
    icon: '💰',
    tools: [
      { id: 'addcredits', name: 'ADDCREDITS', icon: CMD_EMOJI['ADDCREDITS'], blockType: 'ADDCREDITS', description: t('visualFlowEditor.tools.addCredits.description'), implemented: false },
      { id: 'setcredits', name: 'SETCREDITS', icon: CMD_EMOJI['SETCREDITS'], blockType: 'SETCREDITS', description: t('visualFlowEditor.tools.setCredits.description'), implemented: false },
        { id: 'addmissioncredits', name: 'ADDMISSIONCREDITS', icon: CMD_EMOJI['ADDMISSIONCREDITS'], blockType: 'ADDMISSIONCREDITS', description: t('visualFlowEditor.tools.addMissionCredits.description'), implemented: false },
      { id: 'addmissioncreditsbyresult', name: 'ADDMISSIONCREDITSBYRESULT', icon: CMD_EMOJI['ADDMISSIONCREDITSBYRESULT'], blockType: 'ADDMISSIONCREDITSBYRESULT', description: t('visualFlowEditor.tools.addMissionCreditsByResult.description'), implemented: false },
      { id: 'subopponentcreditsbyresult', name: 'SUBOPPONENTCREDITSBYRESULT', icon: CMD_EMOJI['SUBOPPONENTCREDITSBYRESULT'], blockType: 'SUBOPPONENTCREDITSBYRESULT', description: t('visualFlowEditor.tools.subOpponentCreditsByResult.description'), implemented: false },
      { id: 'addopponentscredits', name: 'ADDOPPONENTSCREDITS', icon: CMD_EMOJI['ADDOPPONENTSCREDITS'], blockType: 'ADDOPPONENTSCREDITS', description: t('visualFlowEditor.tools.addOpponentsCredits.description'), implemented: false }
    ]
  },
  {
    id: 'achievement',
    name: t('visualFlowEditor.tools.category.achievement'),
    icon: '🏆',
    tools: [
  { id: 'setachievementprogress', name: 'SETACHIEVEMENTPROGRESS', icon: CMD_EMOJI['SETACHIEVEMENTPROGRESS'], blockType: 'SETACHIEVEMENTPROGRESS', description: t('visualFlowEditor.tools.setAchievementProgress.description'), implemented: false },
  { id: 'setachievementattempt', name: 'SETACHIEVEMENTATTEMPT', icon: CMD_EMOJI['SETACHIEVEMENTATTEMPT'], blockType: 'SETACHIEVEMENTATTEMPT', description: t('visualFlowEditor.tools.setAchievementAttempt.description'), implemented: false },
  { id: 'unlockachievement', name: 'UNLOCKACHIEVEMENT', icon: CMD_EMOJI['UNLOCKACHIEVEMENT'], blockType: 'UNLOCKACHIEVEMENT', description: t('visualFlowEditor.tools.unlockAchievement.description'), implemented: false },
  { id: 'unlockshipplan', name: 'UNLOCKSHIPPLAN', icon: CMD_EMOJI['UNLOCKSHIPPLAN'], blockType: 'UNLOCKSHIPPLAN', description: t('visualFlowEditor.tools.unlockShipPlan.description'), implemented: false },
  { id: 'unlockshuttles', name: 'UNLOCKSHUTTLES', icon: CMD_EMOJI['UNLOCKSHUTTLES'], blockType: 'UNLOCKSHUTTLES', description: t('visualFlowEditor.tools.unlockShuttles.description'), implemented: false }
    ]
  },
  {
    id: 'characters',
    name: t('visualFlowEditor.tools.category.characters'),
    icon: '🎭',
    tools: [
  { id: 'askchar', name: 'ASKCHAR', icon: CMD_EMOJI['ASKCHAR'], blockType: 'ASKCHAR', description: t('visualFlowEditor.tools.askChar.description'), implemented: false },
  { id: 'focuschar', name: 'FOCUSCHAR', icon: CMD_EMOJI['FOCUSCHAR'], blockType: 'FOCUSCHAR', description: t('visualFlowEditor.tools.focusChar.description'), implemented: false }
    ]
  },
  {
    id: 'system',
    name: t('visualFlowEditor.tools.category.system'),
    icon: '💾',
    tools: [
    { id: 'setflightstatusbar', name: 'SETFLIGHTSTATUSBAR', icon: CMD_EMOJI['SETFLIGHTSTATUSBAR'], blockType: 'SETFLIGHTSTATUSBAR', description: t('visualFlowEditor.tools.setFlightStatusBar.description'), implemented: false },
  { id: 'savestate', name: 'SAVESTATE', icon: CMD_EMOJI['SAVESTATE'], blockType: 'SAVESTATE', description: t('visualFlowEditor.tools.saveState.description'), implemented: false },
  { id: 'loadstate', name: 'LOADSTATE', icon: CMD_EMOJI['LOADSTATE'], blockType: 'LOADSTATE', description: t('visualFlowEditor.tools.loadState.description'), implemented: false },
  { id: 'quitcampaign', name: 'QUITCAMPAIGN', icon: CMD_EMOJI['QUITCAMPAIGN'], blockType: 'QUITCAMPAIGN', description: t('visualFlowEditor.tools.quitCampaign.description'), implemented: false }
    ]
  }
];

// Nota: TOOL_CATEGORIES rimosso per evitare esecuzione durante l'import
// Usare sempre getToolCategories(t) per ottenere le categorie con traduzioni