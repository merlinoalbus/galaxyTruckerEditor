const fs = require('fs');

// Lista dei comandi forniti dall'utente (80 comandi)
const userCommands = [
  'DELAY', 'GO', 'SUB_SCRIPT', 'EXIT_MENU', 'SAY', 'CHANGECHAR', 'SET', 'ASK',
  'HIDECHAR', 'SHOWCHAR', 'RESET', 'LABEL', 'HIDEDLGSCENE', 'ADDOPPONENT',
  'SHOWPATH', 'SHOWDLGSCENE', 'RETURN', 'ANNOUNCE', 'SAYCHAR', 'SHOWNODE',
  'SETDECKPREPARATIONSCRIPT', 'SETSHIPTYPE', 'ADDPARTTOSHIP', 'FINISH_MISSION',
  'SET_TO', 'SHOWBUTTON', 'SETFOCUS', 'ADDPARTTOASIDESLOT', 'ADD', 'HIDEPATH',
  'ADDINFOWINDOW', 'ADDMISSIONCREDITS', 'HIDEBUTTON', 'SETSECRETADVPILE',
  'ACT_MISSION', 'SETADVPILE', 'CENTERMAPBYNODE', 'RESETFOCUS', 'SETSPECCONDITION',
  'ADDCREDITS', 'SHOWINFOWINDOW', 'MOVEPLAYERTONODE', 'SETACHIEVEMENTPROGRESS',
  'MODIFYOPPONENTSBUILDSPEED', 'SETACHIEVEMENTATTEMPT', 'ADDMISSIONCREDITSBYRESULT',
  'SUBOPPONENTCREDITSBYRESULT', 'SETFLIGHTDECKPREPARATIONSCRIPT', 'SETNODEKNOWN',
  'BUILDINGHELPSCRIPT', 'UNLOCKACHIEVEMENT', 'UNLOCKSHIPPLAN', 'ASKCHAR',
  'CENTERMAPBYPATH', 'SETTURNBASED', 'ADDSHIPPARTS', 'UNLOCKSHUTTLES',
  'SETMISSIONASFAILED', 'ALLSHIPSGIVEUP', 'HIDEALLPATHS', 'SETFOCUSIFCREDITS',
  'FLIGHTHELPSCRIPT', 'ADDOPPONENTSCREDITS', 'SETCREDITS', 'SETFLIGHTSTATUSBAR',
  'HIDENODE', 'ALIENHELPSCRIPT', 'GIVEUPFLIGHT', 'SETMISSIONASCOMPLETED',
  'SHOWHELPIMAGE', 'SAVESTATE', 'LOADSTATE', 'ADDNODE', 'FOCUSCHAR',
  'QUITCAMPAIGN', 'IF', 'MENU', 'OPT', 'BUILD', 'FLIGHT'
];

// Leggi il file ToolCategories.ts
const content = fs.readFileSync('src/types/CampaignEditor/VisualFlowEditor/ToolCategories.ts', 'utf8');

// Estrai tutti i blockType dal file
const blockTypeMatches = content.match(/blockType:\s*'([^']+)'/g);
const toolsInFile = blockTypeMatches ? blockTypeMatches.map(match => match.match(/blockType:\s*'([^']+)'/)[1]) : [];

console.log('Comandi nel file ToolCategories.ts:', toolsInFile.length);
console.log('Comandi forniti dall\'utente:', userCommands.length);

// Trova comandi mancanti
const missing = userCommands.filter(cmd => !toolsInFile.includes(cmd));
const inFileButNotInUser = toolsInFile.filter(cmd => !userCommands.includes(cmd));

console.log('\n=== COMANDI MANCANTI NEL FILE (da aggiungere) ===');
console.log('Totale:', missing.length);
missing.forEach(cmd => console.log('- ' + cmd));

console.log('\n=== COMANDI NEL FILE MA NON NELLA LISTA UTENTE ===');
console.log('Totale:', inFileButNotInUser.length);
inFileButNotInUser.forEach(cmd => console.log('- ' + cmd));

console.log('\n=== RIEPILOGO ===');
console.log('Comandi utente:', userCommands.length);
console.log('Comandi nel file:', toolsInFile.length);
console.log('Da aggiungere:', missing.length);