import { BlockType } from './BlockTypes';

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
    console.error('Error loading tool categories:', error);
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
      { id: 'showdlgscene', name: 'SHOWDLGSCENE', icon: '🗨️', blockType: 'SHOWDLGSCENE', description: t('visualFlowEditor.tools.showDlgScene.description'), implemented: true },
      { id: 'say', name: 'SAY', icon: '💬', blockType: 'SAY', description: t('visualFlowEditor.tools.say.description'), implemented: true },
      { id: 'ask', name: 'ASK', icon: '❓', blockType: 'ASK', description: t('visualFlowEditor.tools.ask.description'), implemented: true },
      { id: 'hidedlgscene', name: 'HIDEDLGSCENE', icon: '🚫', blockType: 'HIDEDLGSCENE', description: t('visualFlowEditor.tools.hideDlgScene.description'), implemented: true },
      { id: 'announce', name: 'ANNOUNCE', icon: '📢', blockType: 'ANNOUNCE', description: t('visualFlowEditor.tools.announce.description'), implemented: true },
      { id: 'saychar', name: 'SAYCHAR', icon: '🗣️', blockType: 'SAYCHAR', description: t('visualFlowEditor.tools.sayChar.description'), implemented: true },
      
      // === GRUPPO PERSONAGGI ===
      { id: 'showchar', name: 'SHOWCHAR', icon: '👤', blockType: 'SHOWCHAR', description: t('visualFlowEditor.tools.showChar.description'), implemented: true },
      { id: 'hidechar', name: 'HIDECHAR', icon: '👻', blockType: 'HIDECHAR', description: t('visualFlowEditor.tools.hideChar.description'), implemented: true },
      { id: 'changechar', name: 'CHANGECHAR', icon: '🎭', blockType: 'CHANGECHAR', description: t('visualFlowEditor.tools.changeChar.description'), implemented: true },
      
      // === GRUPPO CONTROLLO FLUSSO ===
      { id: 'label', name: 'LABEL', icon: '🏷️', blockType: 'LABEL', description: t('visualFlowEditor.tools.label.description'), implemented: true },
      { id: 'go', name: 'GO', icon: '➡️', blockType: 'GO', description: t('visualFlowEditor.tools.go.description'), implemented: true },
      { id: 'sub_script', name: 'SUB_SCRIPT', icon: '📄', blockType: 'SUB_SCRIPT', description: t('visualFlowEditor.tools.subScript.description'), implemented: true },
      { id: 'return', name: 'RETURN', icon: '↩️', blockType: 'RETURN', description: t('visualFlowEditor.tools.return.description'), implemented: true },
      { id: 'exit_menu', name: 'EXIT_MENU', icon: '🚪', blockType: 'EXIT_MENU', description: t('visualFlowEditor.tools.exitMenu.description'), implemented: true },
      
      // === GRUPPO VARIABILI/SEMAFORI ===
      { id: 'set', name: 'SET', icon: '✅', blockType: 'SET', description: t('visualFlowEditor.tools.set.description'), implemented: true },
      { id: 'reset', name: 'RESET', icon: '❌', blockType: 'RESET', description: t('visualFlowEditor.tools.reset.description'), implemented: true },
      
      // === GRUPPO UTILITY ===
      { id: 'delay', name: 'DELAY', icon: '⏱️', blockType: 'DELAY', description: t('visualFlowEditor.tools.delay.description'), implemented: true }
    ]
  },
  {
    id: 'constructs',
    name: t('visualFlowEditor.tools.category.constructs'),
    icon: '📦',
    alwaysVisible: false,
    tools: [
      { id: 'if', name: 'IF', icon: '🔀', blockType: 'IF', description: t('visualFlowEditor.tools.if.description'), implemented: true },
      { id: 'menu', name: 'MENU', icon: '☰', blockType: 'MENU', description: t('visualFlowEditor.tools.menu.description'), implemented: true },
      { id: 'opt', name: 'OPT', icon: '⭕', blockType: 'OPT', description: t('visualFlowEditor.tools.opt.description'), implemented: true },
      { id: 'build', name: 'BUILD', icon: '🔨', blockType: 'BUILD', description: t('visualFlowEditor.tools.build.description'), implemented: true },
      { id: 'flight', name: 'FLIGHT', icon: '✈️', blockType: 'FLIGHT', description: t('visualFlowEditor.tools.flight.description'), implemented: true }
    ]
  },
  {
    id: 'map',
    name: t('visualFlowEditor.tools.category.map'),
    icon: '🗺️',
    tools: [
      { id: 'shownode', name: 'SHOWNODE', icon: '📍', blockType: 'SHOWNODE', description: t('visualFlowEditor.tools.showNode.description'), implemented: false },
      { id: 'hidenode', name: 'HIDENODE', icon: '📌', blockType: 'HIDENODE', description: t('visualFlowEditor.tools.hideNode.description'), implemented: false },
      { id: 'addnode', name: 'ADDNODE', icon: '➕', blockType: 'ADDNODE', description: t('visualFlowEditor.tools.addNode.description'), implemented: false },
      { id: 'setnodeknown', name: 'SETNODEKNOWN', icon: '✔️', blockType: 'SETNODEKNOWN', description: t('visualFlowEditor.tools.setNodeKnown.description'), implemented: false },
      { id: 'showpath', name: 'SHOWPATH', icon: '🛤️', blockType: 'SHOWPATH', description: t('visualFlowEditor.tools.showPath.description'), implemented: false },
      { id: 'hidepath', name: 'HIDEPATH', icon: '🚧', blockType: 'HIDEPATH', description: t('visualFlowEditor.tools.hidePath.description'), implemented: false },
      { id: 'hideallpaths', name: 'HIDEALLPATHS', icon: '🚫', blockType: 'HIDEALLPATHS', description: t('visualFlowEditor.tools.hideAllPaths.description'), implemented: false },
      { id: 'showbutton', name: 'SHOWBUTTON', icon: '🔘', blockType: 'SHOWBUTTON', description: t('visualFlowEditor.tools.showButton.description'), implemented: false },
      { id: 'hidebutton', name: 'HIDEBUTTON', icon: '⭕', blockType: 'HIDEBUTTON', description: t('visualFlowEditor.tools.hideButton.description'), implemented: false },
      { id: 'centermapbynode', name: 'CENTERMAPBYNODE', icon: '🎯', blockType: 'CENTERMAPBYNODE', description: t('visualFlowEditor.tools.centerMapByNode.description'), implemented: false },
      { id: 'centermapbypath', name: 'CENTERMAPBYPATH', icon: '🗺️', blockType: 'CENTERMAPBYPATH', description: t('visualFlowEditor.tools.centerMapByPath.description'), implemented: false },
      { id: 'moveplayertonode', name: 'MOVEPLAYERTONODE', icon: '🚶', blockType: 'MOVEPLAYERTONODE', description: t('visualFlowEditor.tools.movePlayerToNode.description'), implemented: false }
    ]
  },
  {
    id: 'mission',
    name: t('visualFlowEditor.tools.category.mission'),
    icon: '⚔️',
    tools: [
      { id: 'addopponent', name: 'ADDOPPONENT', icon: '🎮', blockType: 'ADDOPPONENT', description: t('visualFlowEditor.tools.addOpponent.description'), implemented: false },
      { id: 'setshiptype', name: 'SETSHIPTYPE', icon: '🚀', blockType: 'SETSHIPTYPE', description: t('visualFlowEditor.tools.setShipType.description'), implemented: false },
      { id: 'addparttoship', name: 'ADDPARTTOSHIP', icon: '🔧', blockType: 'ADDPARTTOSHIP', description: t('visualFlowEditor.tools.addPartToShip.description'), implemented: false },
      { id: 'addparttoasideslot', name: 'ADDPARTTOASIDESLOT', icon: '📦', blockType: 'ADDPARTTOASIDESLOT', description: t('visualFlowEditor.tools.addPartToAsideSlot.description'), implemented: false },
      { id: 'addshipparts', name: 'ADDSHIPPARTS', icon: '⚙️', blockType: 'ADDSHIPPARTS', description: t('visualFlowEditor.tools.addShipParts.description'), implemented: false },
      { id: 'finish_mission', name: 'FINISH_MISSION', icon: '🏁', blockType: 'FINISH_MISSION', description: t('visualFlowEditor.tools.finishMission.description'), implemented: false },
      { id: 'act_mission', name: 'ACT_MISSION', icon: '🎬', blockType: 'ACT_MISSION', description: t('visualFlowEditor.tools.actMission.description'), implemented: false },
      { id: 'setdeckpreparationscript', name: 'SETDECKPREPARATIONSCRIPT', icon: '🃏', blockType: 'SETDECKPREPARATIONSCRIPT', description: t('visualFlowEditor.tools.setDeckPreparationScript.description'), implemented: false },
      { id: 'setflightdeckpreparationscript', name: 'SETFLIGHTDECKPREPARATIONSCRIPT', icon: '🛩️', blockType: 'SETFLIGHTDECKPREPARATIONSCRIPT', description: t('visualFlowEditor.tools.setFlightDeckPreparationScript.description'), implemented: false },
      { id: 'setadvpile', name: 'SETADVPILE', icon: '📚', blockType: 'SETADVPILE', description: t('visualFlowEditor.tools.setAdvPile.description'), implemented: false },
      { id: 'setsecretadvpile', name: 'SETSECRETADVPILE', icon: '🔒', blockType: 'SETSECRETADVPILE', description: t('visualFlowEditor.tools.setSecretAdvPile.description'), implemented: false },
      { id: 'setspeccondition', name: 'SETSPECCONDITION', icon: '⚙️', blockType: 'SETSPECCONDITION', description: t('visualFlowEditor.tools.setSpecCondition.description'), implemented: false },
      { id: 'modifyopponentsbuildspeed', name: 'MODIFYOPPONENTSBUILDSPEED', icon: '⚡', blockType: 'MODIFYOPPONENTSBUILDSPEED', description: t('visualFlowEditor.tools.modifyOpponentsBuildSpeed.description'), implemented: false },
      { id: 'setturnbased', name: 'SETTURNBASED', icon: '♟️', blockType: 'SETTURNBASED', description: t('visualFlowEditor.tools.setTurnBased.description'), implemented: false },
      { id: 'setmissionasfailed', name: 'SETMISSIONASFAILED', icon: '❌', blockType: 'SETMISSIONASFAILED', description: t('visualFlowEditor.tools.setMissionAsFailed.description'), implemented: false },
      { id: 'setmissionascompleted', name: 'SETMISSIONASCOMPLETED', icon: '✅', blockType: 'SETMISSIONASCOMPLETED', description: t('visualFlowEditor.tools.setMissionAsCompleted.description'), implemented: false },
      { id: 'allshipsgiveup', name: 'ALLSHIPSGIVEUP', icon: '🏳️', blockType: 'ALLSHIPSGIVEUP', description: t('visualFlowEditor.tools.allShipsGiveUp.description'), implemented: false },
      { id: 'giveupflight', name: 'GIVEUPFLIGHT', icon: '🛑', blockType: 'GIVEUPFLIGHT', description: t('visualFlowEditor.tools.giveUpFlight.description'), implemented: false }
    ]
  },
  {
    id: 'variables',
    name: t('visualFlowEditor.tools.category.variables'),
    icon: '🔢',
    tools: [
      { id: 'set_to', name: 'SET_TO', icon: '🔢', blockType: 'SET_TO', description: t('visualFlowEditor.tools.setTo.description'), implemented: false },
      { id: 'add', name: 'ADD', icon: '➕', blockType: 'ADD', description: t('visualFlowEditor.tools.add.description'), implemented: false },
      { id: 'setfocus', name: 'SETFOCUS', icon: '🎯', blockType: 'SETFOCUS', description: t('visualFlowEditor.tools.setFocus.description'), implemented: false },
      { id: 'resetfocus', name: 'RESETFOCUS', icon: '🔄', blockType: 'RESETFOCUS', description: t('visualFlowEditor.tools.resetFocus.description'), implemented: false },
      { id: 'setfocusifcredits', name: 'SETFOCUSIFCREDITS', icon: '💲', blockType: 'SETFOCUSIFCREDITS', description: t('visualFlowEditor.tools.setFocusIfCredits.description'), implemented: false }
    ]
  },
  {
    id: 'info',
    name: t('visualFlowEditor.tools.category.info'),
    icon: 'ℹ️',
    tools: [
      { id: 'addinfowindow', name: 'ADDINFOWINDOW', icon: 'ℹ️', blockType: 'ADDINFOWINDOW', description: t('visualFlowEditor.tools.addInfoWindow.description'), implemented: false },
      { id: 'showinfowindow', name: 'SHOWINFOWINDOW', icon: '🪟', blockType: 'SHOWINFOWINDOW', description: t('visualFlowEditor.tools.showInfoWindow.description'), implemented: false },
      { id: 'showhelpimage', name: 'SHOWHELPIMAGE', icon: '🖼️', blockType: 'SHOWHELPIMAGE', description: t('visualFlowEditor.tools.showHelpImage.description'), implemented: false },
      { id: 'buildinghelpscript', name: 'BUILDINGHELPSCRIPT', icon: '🔨', blockType: 'BUILDINGHELPSCRIPT', description: t('visualFlowEditor.tools.buildingHelpScript.description'), implemented: false },
      { id: 'flighthelpscript', name: 'FLIGHTHELPSCRIPT', icon: '✈️', blockType: 'FLIGHTHELPSCRIPT', description: t('visualFlowEditor.tools.flightHelpScript.description'), implemented: false },
      { id: 'alienhelpscript', name: 'ALIENHELPSCRIPT', icon: '👽', blockType: 'ALIENHELPSCRIPT', description: t('visualFlowEditor.tools.alienHelpScript.description'), implemented: false }
    ]
  },
  {
    id: 'credits',
    name: t('visualFlowEditor.tools.category.credits'),
    icon: '💰',
    tools: [
      { id: 'addcredits', name: 'ADDCREDITS', icon: '💰', blockType: 'ADDCREDITS', description: t('visualFlowEditor.tools.addCredits.description'), implemented: false },
      { id: 'setcredits', name: 'SETCREDITS', icon: '💵', blockType: 'SETCREDITS', description: t('visualFlowEditor.tools.setCredits.description'), implemented: false },
      { id: 'addmissioncredits', name: 'ADDMISSIONCREDITS', icon: '🏆', blockType: 'ADDMISSIONCREDITS', description: t('visualFlowEditor.tools.addMissionCredits.description'), implemented: false },
      { id: 'addmissioncreditsbyresult', name: 'ADDMISSIONCREDITSBYRESULT', icon: '💸', blockType: 'ADDMISSIONCREDITSBYRESULT', description: t('visualFlowEditor.tools.addMissionCreditsByResult.description'), implemented: false },
      { id: 'subopponentcreditsbyresult', name: 'SUBOPPONENTCREDITSBYRESULT', icon: '💳', blockType: 'SUBOPPONENTCREDITSBYRESULT', description: t('visualFlowEditor.tools.subOpponentCreditsByResult.description'), implemented: false },
      { id: 'addopponentscredits', name: 'ADDOPPONENTSCREDITS', icon: '🪙', blockType: 'ADDOPPONENTSCREDITS', description: t('visualFlowEditor.tools.addOpponentsCredits.description'), implemented: false }
    ]
  },
  {
    id: 'achievement',
    name: t('visualFlowEditor.tools.category.achievement'),
    icon: '🏆',
    tools: [
      { id: 'setachievementprogress', name: 'SETACHIEVEMENTPROGRESS', icon: '📈', blockType: 'SETACHIEVEMENTPROGRESS', description: t('visualFlowEditor.tools.setAchievementProgress.description'), implemented: false },
      { id: 'setachievementattempt', name: 'SETACHIEVEMENTATTEMPT', icon: '🎯', blockType: 'SETACHIEVEMENTATTEMPT', description: t('visualFlowEditor.tools.setAchievementAttempt.description'), implemented: false },
      { id: 'unlockachievement', name: 'UNLOCKACHIEVEMENT', icon: '🏆', blockType: 'UNLOCKACHIEVEMENT', description: t('visualFlowEditor.tools.unlockAchievement.description'), implemented: false },
      { id: 'unlockshipplan', name: 'UNLOCKSHIPPLAN', icon: '📋', blockType: 'UNLOCKSHIPPLAN', description: t('visualFlowEditor.tools.unlockShipPlan.description'), implemented: false },
      { id: 'unlockshuttles', name: 'UNLOCKSHUTTLES', icon: '🚁', blockType: 'UNLOCKSHUTTLES', description: t('visualFlowEditor.tools.unlockShuttles.description'), implemented: false }
    ]
  },
  {
    id: 'characters',
    name: t('visualFlowEditor.tools.category.characters'),
    icon: '🎭',
    tools: [
      { id: 'askchar', name: 'ASKCHAR', icon: '❔', blockType: 'ASKCHAR', description: t('visualFlowEditor.tools.askChar.description'), implemented: false },
      { id: 'focuschar', name: 'FOCUSCHAR', icon: '🔍', blockType: 'FOCUSCHAR', description: t('visualFlowEditor.tools.focusChar.description'), implemented: false }
    ]
  },
  {
    id: 'system',
    name: t('visualFlowEditor.tools.category.system'),
    icon: '💾',
    tools: [
      { id: 'setflightstatusbar', name: 'SETFLIGHTSTATUSBAR', icon: '📊', blockType: 'SETFLIGHTSTATUSBAR', description: t('visualFlowEditor.tools.setFlightStatusBar.description'), implemented: false },
      { id: 'savestate', name: 'SAVESTATE', icon: '💾', blockType: 'SAVESTATE', description: t('visualFlowEditor.tools.saveState.description'), implemented: false },
      { id: 'loadstate', name: 'LOADSTATE', icon: '📂', blockType: 'LOADSTATE', description: t('visualFlowEditor.tools.loadState.description'), implemented: false },
      { id: 'quitcampaign', name: 'QUITCAMPAIGN', icon: '🚪', blockType: 'QUITCAMPAIGN', description: t('visualFlowEditor.tools.quitCampaign.description'), implemented: false }
    ]
  }
];

// Nota: TOOL_CATEGORIES rimosso per evitare esecuzione durante l'import
// Usare sempre getToolCategories(t) per ottenere le categorie con traduzioni